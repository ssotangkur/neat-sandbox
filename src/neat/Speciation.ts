import _ from "lodash";
import {
  EvaluatedIndividual,
  Individual,
  Population,
  crossOver,
} from "./Population";
import { Kernel } from "./Inference";
import { PopulationOptions, SpeciationOptions } from "./Options";
import { mutateNN, mutateSingle } from "./Mutation";
import { NeuralNet } from "./NeuralNet";
import { SubscriptionManager } from "../utils/SubsciptionManager";

export class SpeciesManager extends SubscriptionManager<SpeciesManager> {
  public specieIdsMap = new Map<number, Specie>();
  public highestSpecieId = 0;
  public dynamicCompatibilityThreshold: undefined | number;

  public get species() {
    return Array.from(this.specieIdsMap.values());
  }

  public getTotalPopulation() {
    return _.sum(this.species.map((s) => s.population.length));
  }

  // Separate individuals into existing species
  public speciate(
    individuals: EvaluatedIndividual[],
    options: SpeciationOptions
  ) {
    individuals.forEach((i) => {
      // if (i.speciesId !== undefined) {
      //   // Try their old species first
      //   const oldSpecie = Specie.specieIdsMap.get(i.speciesId);
      //   if (oldSpecie?.isSameSpecie(i, options)) {
      //     oldSpecie.add(i);
      //     return;
      //   }
      // }
      // Couldn't add to old species, try the rest
      const species = this.species;
      const sameSpecie = species.find((s) => s.isSameSpecie(i, options));
      if (sameSpecie) {
        sameSpecie.add(i);
      } else {
        // Create a new specie
        new Specie(i, options, this);
      }
    });
    this.notify(this);
  }

  public clearSpeciesMap() {
    this.species.forEach((s) => {
      s.population = [];
      s.genSinceImprovement++;
    });
  }

  public removeEmptySpecies() {
    // Remove specie with no more members
    let removalCount = 0;
    this.species
      .filter((s) => s.population.length === 0)
      .forEach((s) => {
        this.specieIdsMap.delete(s.specieId);
        removalCount++;
      });
    if (removalCount) {
      console.log("removed " + removalCount + " empty species");
    }
  }

  public removeStagnantSpecies(options: SpeciationOptions) {
    // Remove specie that exceed max stagnation gen
    const species = this.species;
    const len = species.length;
    if (len <= 2) {
      // Always keep at least 2
      return;
    }
    // Only bottom half of performing species are up for removal
    const start = Math.max(2, Math.round(len / 2));
    let removalCount = 0;
    this.species
      .sort((a, b) => b.highestFitness - a.highestFitness)
      .slice(start)
      .filter((s) => s.genSinceImprovement > options.maxStagnationGens)
      .forEach((s) => {
        this.specieIdsMap.delete(s.specieId);
        removalCount++;
      });
    if (removalCount) {
      console.log("removed " + removalCount + " stagnant species");
    }
  }

  public setTargetPopulations(p: Population, options: PopulationOptions) {
    // Normalize the adjusted fitnesses to be in the range [0,1],
    // This becomes close to the % of the population that we want to hit
    const species = this.species;

    // Special case for one species
    if (species.length === 1) {
      species[0].targetPopulation = options.count;
      return;
    }

    const minFitness = p.minFitness ?? 0;
    const maxFitness = p.maxFitness ?? 0;
    const fitnessRange = Math.max(0.01, maxFitness - minFitness); // 0.01 to prevent divide by 0

    // When there's no range, just distribute the target population evenly
    if (fitnessRange === 0.01) {
      const targetForEach = Math.max(
        options.speciationOptions.minPopulation,
        Math.ceil(options.count / species.length)
      );
      species.forEach((s) => (s.targetPopulation = targetForEach));
      return;
    }

    const normalAdjFit = species.map(
      (s) => (s.adjustedFitness - minFitness) / fitnessRange
    );

    // Calculate stagnation penalty
    const stagnationFactor = species.map((s) => {
      const penaltyGen = Math.max(
        0,
        s.genSinceImprovement - options.speciationOptions.stagnationThreshold
      );
      const penaltyFactor = Math.max(
        0.01,
        1 - penaltyGen * options.speciationOptions.stagnationPenaltyRate
      );
      return penaltyFactor;
    });
    // Apply the penalty
    const penalizedNormAF = _.zip(normalAdjFit, stagnationFactor).map(
      ([af, factor]) => af! * factor!
    );

    // Normalize again since normalization by fitnessRange is not the same as true normalization
    // where the values add up to 1
    const sumNormalAdjFit = Math.max(0.01, _.sum(penalizedNormAF));
    const reNormalAdjFit = penalizedNormAF.map((af) => af / sumNormalAdjFit);

    // We reserve minPopulation for each species from the total population
    let totalUnreservedPop =
      options.count -
      (species.length ?? 0) * options.speciationOptions.minPopulation;
    if (totalUnreservedPop < 0) {
      // Population will increase to make sure each species has reserved pop
      totalUnreservedPop = 0;
    }
    const unreservedPops = reNormalAdjFit.map((pctPop) =>
      Math.round(totalUnreservedPop * pctPop)
    );
    _.zip(species, unreservedPops).forEach(
      ([specie, unreservedPop]) =>
        (specie!.targetPopulation =
          options.speciationOptions.minPopulation + unreservedPop!)
    );

    // targets should add up
    const sumTargetPop = species.reduce(
      (sum, s) => sum + s.targetPopulation,
      0
    );
    if (sumTargetPop < options.count) {
      console.warn(
        "Target Pop is less than expected. Got " +
          sumTargetPop +
          " expected " +
          options.count
      );
    }
  }

  /**
   * For each specie, reproduce a total of targetPopulation - # of elites that will be copied over
   */
  public reproduce(options: PopulationOptions): Individual[] {
    const newGeneration: Individual[] = this.species.flatMap((s) => {
      s.numSelected = Math.ceil(
        s.population.length * options.speciationOptions.selectionPercent
      );
      s.numElites = Math.ceil(
        Math.max(
          options.speciationOptions.minElite,
          s.numSelected * options.speciationOptions.elitePercent
        )
      );
      const numToReproduce = s.targetPopulation - s.numElites;

      const potentialParents = s.population.slice(0, s.numSelected);
      if (s.numSelected === 0) {
        throw Error("Cannot have zero selected for reproduction");
      }
      if (s.numSelected === 1) {
        const parent = potentialParents[0];
        // asexual reproduction
        const nextGen = _.range(numToReproduce).map(() => {
          const mutated = mutateNN(parent.neuralNet, options.mutationOptions);
          return { ...parent, neuralNet: mutated } as Individual;
        });
        return nextGen;
      }
      const nextGen: Individual[] = [];
      _.range(numToReproduce).forEach(() => {
        const [a, b] = _.sampleSize(potentialParents, 2);
        const nn = crossOver(a.neuralNet, a.fitness!, b.neuralNet, b.fitness!);
        const ABIsSame = compare(a, b, options.speciationOptions) === 0;
        const mutated = ABIsSame
          ? mutateSingle(nn, options.mutationOptions)
          : mutateNN(nn, options.mutationOptions);
        try {
          const child: Individual = {
            neuralNet: mutated,
            kernel: new Kernel(mutated),
            speciesId: a.speciesId,
          };
          nextGen.push(child);
        } catch (error) {
          console.error("Unviable child");
        }
      });
      return nextGen;
    });

    return newGeneration;
  }

  // Replaces the entire population in each species with just the elites
  public initializeNextGenWithElites() {
    this.species.forEach((s) => {
      const elites = s.population.slice(0, s.numElites);
      s.population = elites;
    });
  }

  public copyElites(): Individual[] {
    return this.species.flatMap((s) => s.population.slice(0, s.numElites));
  }

  public updateDynamicCompatibility(
    generation: number,
    options: SpeciationOptions
  ) {
    // let species stabilize for 30 gen before trying to change it
    if (generation < 30) {
      return;
    }
    const len = this.species.length;
    if (this.dynamicCompatibilityThreshold === undefined) {
      return;
    }
    if (len < options.targetNumSpecies) {
      // Need more so reduce dynThresh
      this.dynamicCompatibilityThreshold -= options.compatibilityChangeRate;
      this.dynamicCompatibilityThreshold = Math.max(
        0.9,
        this.dynamicCompatibilityThreshold
      );
    } else if (len > options.targetNumSpecies) {
      // Need less
      this.dynamicCompatibilityThreshold += options.compatibilityChangeRate;
    }
  }
}

export class Specie {
  public population: EvaluatedIndividual[];
  public targetPopulation: number;
  public readonly specieId: number;

  public numSelected: number = 0;
  public numElites: number = 0;
  public bestSpecimen: EvaluatedIndividual;
  public genSinceImprovement: number = 0; // # of generations that have passed since we got a better specimen

  constructor(
    specimen: EvaluatedIndividual,
    private readonly options: SpeciationOptions,
    private readonly manager: SpeciesManager
  ) {
    this.population = [];
    this.bestSpecimen = specimen;
    this.add(specimen);
    this.targetPopulation = options.minPopulation;
    this.specieId = ++manager.highestSpecieId;
    manager.specieIdsMap.set(this.specieId, this);
    if (manager.dynamicCompatibilityThreshold === undefined) {
      manager.dynamicCompatibilityThreshold =
        this.options.compatibilityThreshold;
    }
  }

  get adjustedFitness() {
    return (
      _.chain(this.population)
        .map((i) => i.fitness)
        .sum()
        .value() / this.population.length
    );
  }

  get highestFitness() {
    return this.bestSpecimen.fitness!;
  }

  public isSameSpecie(
    individual: EvaluatedIndividual,
    options: SpeciationOptions
  ) {
    return (
      (this.manager.dynamicCompatibilityThreshold ??
        options.compatibilityThreshold) >
      compare(individual, this.bestSpecimen, options)
    );
  }

  public add(individual: EvaluatedIndividual) {
    individual.speciesId = this.specieId;
    if (individual.fitness > this.bestSpecimen.fitness) {
      this.bestSpecimen = individual;
      // reset the stagnation count
      this.genSinceImprovement = 0;
    }
    this.population.push(individual);
  }
}

const compareNN = (a: NeuralNet, b: NeuralNet, options: SpeciationOptions) => {
  const N = Math.max(1, a.genes.length, b.genes.length);
  // const N = 1;
  const allGenes = [...b.genes, ...a.genes];
  const genesByInnovation = _.groupBy(allGenes, (g) => g.innovation);
  const [common, disjoint] = _.chain(genesByInnovation)
    .each()
    .partition((tuple) => tuple.length == 2)
    .value();
  const weightDiff = _.chain(common)
    .map(([a, b]) => Math.abs(a.weight - b.weight))
    .sum()
    .value();

  const compatibility =
    (options.excessMissingFactor * disjoint.length) / N +
    (options.weightsFactor * weightDiff) / N;
  return compatibility;
};

const compare = (a: Individual, b: Individual, options: SpeciationOptions) => {
  return compareNN(a.neuralNet, b.neuralNet, options);
};

const isSpeciesOf = (
  individual: Individual,
  group: Individual[],
  options: SpeciationOptions
) => {
  const speciesExample = _.sample(group);
  if (!speciesExample) {
    return false;
  }
  const compatibility = compare(individual, speciesExample, options);
  return compatibility < options.compatibilityThreshold;
};

export const speciate = (
  individuals: Individual[],
  options: SpeciationOptions
): Individual[][] => {
  const species: Individual[][] = [];
  individuals.forEach((individual) => {
    const group = species.find((group) =>
      isSpeciesOf(individual, group, options)
    );
    if (group) {
      group.push(individual);
    } else {
      // No matching group, individual becomes first member of new species
      species.push([individual]);
    }
  });
  return species;
};

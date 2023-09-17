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
import { NeatMeta, getInnovation } from "./NeatMeta";

export const setTargetPopulations = (
  p: Population,
  options: PopulationOptions
) => {
  // Normalize the adjusted fitnesses to be in the range [0,1],
  // This becomes close to the % of the population that we want to hit
  const species = p.species;

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
    (s) => (getAdjustedFitness(s) - minFitness) / fitnessRange
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
  const sumTargetPop = species.reduce((sum, s) => sum + s.targetPopulation, 0);
  if (sumTargetPop < options.count) {
    console.warn(
      "Target Pop is less than expected. Got " +
        sumTargetPop +
        " expected " +
        options.count
    );
  }
};

/**
 * For each specie, reproduce a total of targetPopulation - # of elites that will be copied over
 */
export const reproduce = (
  species: Specie[],
  options: PopulationOptions,
  meta: NeatMeta
): Individual[] => {
  const newGeneration: Individual[] = species.flatMap((s) => {
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
        const mutated = mutateNN(
          parent.neuralNet,
          options.mutationOptions,
          meta
        );
        return { ...parent, neuralNet: mutated } as EvaluatedIndividual;
      });
      return nextGen;
    }
    const nextGen: Individual[] = [];
    _.range(numToReproduce).forEach(() => {
      const [a, b] = _.sampleSize(potentialParents, 2);
      const nn = crossOver(
        a.neuralNet,
        a.fitness,
        b.neuralNet,
        b.fitness,
        meta
      );
      const ABIsSame = compare(a, b, options.speciationOptions, meta) === 0;
      const mutated = ABIsSame
        ? mutateSingle(nn, options.mutationOptions, meta)
        : mutateNN(nn, options.mutationOptions, meta);
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
};

export const copyElites = (species: Specie[]): EvaluatedIndividual[] => {
  return species.flatMap((s) => {
    // promote the best elite as the best specimen of the species
    if (s.population.length) {
      s.bestSpecimen = s.population[0]; // since its sorted, first is best
    }
    return s.population.slice(0, s.numElites);
  });
};

export const getTotalPopulation = (species: Specie[]) => {
  return _.sum(species.map((s) => s.population.length));
};

// Separate individuals into existing species
export const speciate = (
  species: Specie[],
  individuals: EvaluatedIndividual[],
  options: SpeciationOptions,
  meta: NeatMeta
) => {
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
    const sameSpecie = species.find((s) => isSameSpecie(s, i, options, meta));
    if (sameSpecie) {
      add(sameSpecie, i);
    } else {
      // Create a new specie
      const s = new Specie(i, options, meta);
      species.push(s);
    }
  });
};

export const clearSpeciesMap = (species: Specie[]) => {
  species.forEach((s) => {
    s.population = [];
    s.genSinceImprovement++;
  });
};

export const removeEmptySpecies = (species: Specie[]): Specie[] => {
  // Remove specie with no more members
  const result = species.filter((s) => s.population.length !== 0);
  let removalCount = result.length;
  if (removalCount) {
    console.log("removed " + removalCount + " empty species");
  }
  return result;
};

export const removeStagnantSpecies = (
  species: Specie[],
  options: SpeciationOptions
) => {
  // Remove specie that exceed max stagnation gen
  const len = species.length;
  if (len <= 2) {
    // Always keep at least 2
    return species;
  }
  // Only bottom half of performing species are up for removal
  const start = Math.max(2, Math.round(len / 2));

  const result = species
    .sort((a, b) => getHighestFitness(b) - getHighestFitness(a))
    .filter(
      (s, i) => i <= start || s.genSinceImprovement <= options.maxStagnationGens
    );
  const removalCount = len - result.length;
  if (removalCount) {
    console.log("removed " + removalCount + " stagnant species");
  }
  return result;
};

export const updateDynamicCompatibility = (
  species: Specie[],
  generation: number,
  options: SpeciationOptions,
  speciesManager: NeatMeta
) => {
  // let species stabilize for 30 gen before trying to change it
  if (generation < 30) {
    return;
  }
  const len = species.length;
  if (speciesManager.dynamicCompatibilityThreshold === undefined) {
    return;
  }
  if (len < options.targetNumSpecies) {
    // Need more so reduce dynThresh
    speciesManager.dynamicCompatibilityThreshold -=
      options.compatibilityChangeRate;
    speciesManager.dynamicCompatibilityThreshold = Math.max(
      0.01,
      speciesManager.dynamicCompatibilityThreshold
    );
  } else if (len > options.targetNumSpecies) {
    // Need less
    speciesManager.dynamicCompatibilityThreshold +=
      options.compatibilityChangeRate;
  }
};

export const isSameSpecie = (
  specie: Specie,
  individual: EvaluatedIndividual,
  options: SpeciationOptions,
  meta: NeatMeta
) => {
  return (
    (specie.manager.dynamicCompatibilityThreshold ??
      options.compatibilityThreshold) >
    compare(individual, specie.bestSpecimen, options, meta)
  );
};

export const getAdjustedFitness = (specie: Specie) => {
  return (
    _.chain(specie.population)
      .map((i) => i.fitness)
      .sum()
      .value() / specie.population.length
  );
};

export const getHighestFitness = (specie: Specie) => {
  return specie.bestSpecimen.fitness;
};

export const add = (specie: Specie, individual: EvaluatedIndividual) => {
  individual.speciesId = specie.specieId;
  if (individual.fitness > specie.bestSpecimen.fitness) {
    specie.bestSpecimen = individual;

    if (individual.fitness > specie.allTimeBest) {
      specie.allTimeBest = individual.fitness;
      // reset the stagnation count
      specie.genSinceImprovement = 0;
    }
  }
  specie.population.push(individual);
};

export class Specie {
  public population: EvaluatedIndividual[];
  public targetPopulation: number;
  public readonly specieId: number;

  public numSelected: number = 0;
  public numElites: number = 0;
  public bestSpecimen: EvaluatedIndividual;
  public allTimeBest: number = 0;
  public genSinceImprovement: number = 0; // # of generations that have passed since we got a better specimen

  constructor(
    specimen: EvaluatedIndividual,
    public readonly options: SpeciationOptions,
    public readonly manager: NeatMeta
  ) {
    this.population = [];
    this.bestSpecimen = specimen;
    add(this, specimen);
    this.targetPopulation = options.minPopulation;
    this.specieId = ++manager.highestSpecieId;
    // manager.specieIdsMap.set(this.specieId, this);
    if (manager.dynamicCompatibilityThreshold === undefined) {
      manager.dynamicCompatibilityThreshold =
        this.options.compatibilityThreshold;
    }
  }
}

const compareNN = (
  a: NeuralNet,
  b: NeuralNet,
  options: SpeciationOptions,
  meta: NeatMeta
) => {
  const N = Math.max(1, a.genes.length, b.genes.length);
  // const N = 1;
  const allGenes = [...b.genes, ...a.genes];
  const genesByInnovation = _.groupBy(allGenes, (g) => getInnovation(g, meta));
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

const compare = (
  a: EvaluatedIndividual,
  b: EvaluatedIndividual,
  options: SpeciationOptions,
  meta: NeatMeta
) => {
  return compareNN(a.neuralNet, b.neuralNet, options, meta);
};

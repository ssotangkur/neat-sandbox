import _ from "lodash";
import { createSimpleNeuralNet } from "./NeuralNetFactory";
import { NeuralNet } from "./NeuralNet";
import { Gene } from "./Gene";
import { Neuron, NeuronType } from "./Neuron";
import { Kernel } from "./Inference";
import { Specie, SpeciesManager } from "./Speciation";
import { PopulationOptions } from "./Options";

export const initalizePopulation = async (
  options: PopulationOptions,
  speciesManager: SpeciesManager
): Promise<Population> => {
  const newGen = _.range(options.count)
    .map(() => createSimpleNeuralNet(options.inputs, options.outputs))
    .map((nn) => {
      return {
        neuralNet: nn,
        kernel: new Kernel(nn),
      } as Individual;
    });
  const { minFitness, maxFitness, bestOverall, individuals } =
    await options.evaluateIndividuals(newGen, options);
  speciesManager.speciate(individuals, options.speciationOptions);

  return {
    generation: 0,
    maxFitness,
    minFitness,
    best: bestOverall,
    foundSolution: options.endCondition(bestOverall.kernel!, maxFitness),
    speciesManager,
    individuals: speciesManager.species.flatMap((s) => s.population),
    species: speciesManager.species,
  };
};

export type Individual = {
  neuralNet: NeuralNet;
  kernel: Kernel;
  speciesId?: number;
};

export type EvaluatedIndividual = Individual & {
  fitness: number;
};

export type Population = {
  generation: number;
  maxFitness: number;
  minFitness: number;
  best: Individual;
  foundSolution: boolean;
  speciesManager: SpeciesManager;
  individuals: EvaluatedIndividual[];
  species: Specie[];
};

export const nextGeneration = async (
  p: Population,
  options: PopulationOptions
): Promise<Population> => {
  p.speciesManager.setTargetPopulations(p, options);
  const newGeneration = p.speciesManager.reproduce(options);
  const elites = p.speciesManager.copyElites();
  const nextGen = [...newGeneration, ...elites];

  const { minFitness, maxFitness, bestOverall, individuals } =
    await options.evaluateIndividuals(nextGen, options);
  p.speciesManager.clearSpeciesMap(); // Clear out all individuals in Specie before speciation
  p.speciesManager.speciate(individuals, options.speciationOptions);
  p.speciesManager.removeEmptySpecies();
  p.speciesManager.removeStagnantSpecies(options.speciationOptions);
  p.speciesManager.updateDynamicCompatibility(
    p.generation,
    options.speciationOptions
  );

  return {
    generation: p.generation + 1,
    maxFitness,
    minFitness,
    best: bestOverall,
    foundSolution: options.endCondition(bestOverall.kernel!, maxFitness),
    speciesManager: p.speciesManager,
    individuals: p.speciesManager.species.flatMap((s) => s.population),
    species: p.speciesManager.species,
  };
};

export const crossOver = (
  a: NeuralNet,
  aFitness: number,
  b: NeuralNet,
  bFitness: number
): NeuralNet => {
  const aIsMoreOrEquallyFit = aFitness >= bFitness;
  const bIsMoreOrEquallyFit = bFitness >= aFitness;
  let aIndex = 0;
  let bIndex = 0;
  const newGenes: Gene[] = [];
  while (aIndex < a.genes.length && bIndex < b.genes.length) {
    const geneA = a.genes[aIndex];
    const geneB = b.genes[bIndex];

    if (geneA.innovation < geneB.innovation) {
      // geneA is disjoint
      // if it is more or equal fitness then included it
      if (aIsMoreOrEquallyFit) {
        newGenes.push(geneA);
      }
      // increment the lower index no matter what
      aIndex++;
    } else if (geneA.innovation > geneB.innovation) {
      if (bIsMoreOrEquallyFit) {
        newGenes.push(geneB);
      }
      bIndex++;
    } else {
      // innovations are equal, randomly pick
      newGenes.push(_.sample([geneA, geneB])!);
      // increment both indicies
      aIndex++;
      bIndex++;
    }
  }
  // We may have excess genes at this point
  if (aIndex < a.genes.length) {
    // A has excess, add in remaining genes if more fit
    if (aIsMoreOrEquallyFit) {
      newGenes.push(...a.genes.slice(aIndex));
    }
  } else {
    // B has excess, add in remaining genes if more fit
    if (bIsMoreOrEquallyFit) {
      newGenes.push(...b.genes.slice(bIndex));
    }
  }

  // Neurons must be crossed as well since they can have different biases
  // Cross all inputs & outputs, otherwise we'll end up removing them if there
  // is no gene using them.
  const inOutTypes: NeuronType[] = ["input", "output"];
  const isInOutNeuron = (n: Neuron) => inOutTypes.includes(n.neuronType);
  // ids are same for both A & B so only need to check A
  const inOutNeuronIds = a.neurons
    .filter(isInOutNeuron)
    .map((neuron) => neuron.id);

  const usedNeurons = new Set<number>(inOutNeuronIds);
  newGenes.forEach((gene) => {
    usedNeurons.add(gene.inNeuron);
    usedNeurons.add(gene.outNeuron);
  });

  const newNeurons: Neuron[] = [];
  usedNeurons.forEach((neuron) => {
    const neuronA = a.getNeuronById(neuron);
    const neuronB = b.getNeuronById(neuron);

    if (neuronA && neuronB) {
      newNeurons.push(_.sample([neuronA, neuronB])!);
    } else if (neuronA) {
      newNeurons.push(neuronA);
    } else if (neuronB) {
      newNeurons.push(neuronB);
    }
  });

  return new NeuralNet(newNeurons, newGenes);
};

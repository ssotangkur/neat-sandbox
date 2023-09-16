import _ from "lodash";
import { createSimpleNeuralNet } from "./NeuralNetFactory";
import { NeuralNet, getNeuronById } from "./NeuralNet";
import { Gene } from "./Gene";
import { Neuron, NeuronType } from "./Neuron";
import { Kernel } from "./Inference";
import {
  Specie,
  clearSpeciesMap,
  copyElites,
  removeEmptySpecies,
  removeStagnantSpecies,
  reproduce,
  setTargetPopulations,
  speciate,
  updateDynamicCompatibility,
} from "./Speciation";
import {
  PopulationOptions,
  getEndCondition,
  getEvaluateIndividuals,
} from "./Options";
import { NeatMeta, getInnovation } from "./NeatMeta";

export const initalizePopulation = async (
  options: PopulationOptions,
  meta: NeatMeta
): Promise<Population> => {
  const newGen = _.range(options.count)
    .map(() => createSimpleNeuralNet(options.inputs, options.outputs, meta))
    .map((nn) => {
      return {
        neuralNet: nn,
        kernel: new Kernel(nn),
      } as Individual;
    });
  const { minFitness, maxFitness, bestOverall, individuals } =
    await getEvaluateIndividuals(options.evalType)(newGen);
  const species: Specie[] = [];
  speciate(species, individuals, options.speciationOptions, meta);

  return {
    generation: 0,
    maxFitness,
    minFitness,
    best: bestOverall,
    foundSolution: getEndCondition(options.evalType)(
      bestOverall.kernel!,
      maxFitness
    ),
    speciesManager: meta,
    individuals: species.flatMap((s) => s.population),
    species: species,
    meta,
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
  speciesManager: NeatMeta;
  individuals: EvaluatedIndividual[];
  species: Specie[];
  meta: NeatMeta;
};

export const nextGeneration = async (
  p: Population,
  options: PopulationOptions
): Promise<Population> => {
  setTargetPopulations(p, options);
  const newGeneration = reproduce(p.species, options, p.meta);
  const elites = copyElites(p.species);
  const nextGen = [...newGeneration, ...elites];

  const { minFitness, maxFitness, bestOverall, individuals } =
    await getEvaluateIndividuals(options.evalType)(nextGen);
  clearSpeciesMap(p.species); // Clear out all individuals in Specie before speciation
  speciate(p.species, individuals, options.speciationOptions, p.speciesManager);
  p.species = removeEmptySpecies(p.species);
  p.species = removeStagnantSpecies(p.species, options.speciationOptions);
  updateDynamicCompatibility(
    p.species,
    p.generation,
    options.speciationOptions,
    p.speciesManager
  );

  return {
    generation: p.generation + 1,
    maxFitness,
    minFitness,
    best: bestOverall,
    foundSolution: getEndCondition(options.evalType)(
      bestOverall.kernel!,
      maxFitness
    ),
    speciesManager: p.speciesManager,
    individuals: p.species.flatMap((s) => s.population),
    species: p.species,
    meta: p.meta,
  };
};

export const crossOver = (
  a: NeuralNet,
  aFitness: number,
  b: NeuralNet,
  bFitness: number,
  meta: NeatMeta
): NeuralNet => {
  const aIsMoreOrEquallyFit = aFitness >= bFitness;
  const bIsMoreOrEquallyFit = bFitness >= aFitness;
  let aIndex = 0;
  let bIndex = 0;
  const newGenes: Gene[] = [];
  while (aIndex < a.genes.length && bIndex < b.genes.length) {
    const geneA = a.genes[aIndex];
    const geneB = b.genes[bIndex];

    if (getInnovation(geneA, meta) < getInnovation(geneB, meta)) {
      // geneA is disjoint
      // if it is more or equal fitness then included it
      if (aIsMoreOrEquallyFit) {
        newGenes.push(geneA);
      }
      // increment the lower index no matter what
      aIndex++;
    } else if (getInnovation(geneA, meta) > getInnovation(geneB, meta)) {
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
    const neuronA = getNeuronById(a, neuron);
    const neuronB = getNeuronById(b, neuron);

    if (neuronA && neuronB) {
      newNeurons.push(_.sample([neuronA, neuronB])!);
    } else if (neuronA) {
      newNeurons.push(neuronA);
    } else if (neuronB) {
      newNeurons.push(neuronB);
    }
  });

  return new NeuralNet(newNeurons, newGenes, meta);
};

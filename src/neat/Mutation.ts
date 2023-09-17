import { NeuralNet, getEnabledGenes, getMaxIdNeuron } from "./NeuralNet";
import { Activation, Neuron } from "./Neuron";
import { Gene, clone, getTopologicalKey } from "./Gene";
import _ from "lodash";
import { EvaluatedIndividual } from "./Population";
import { MutationOptions, PopulationOptions } from "./Options";
import { NeatMeta, getInnovation, registerGene } from "./NeatMeta";

export type MutationParameters = {
  addGeneRate: number;
  addNeuronRate: number;
  weightChangeRate: number;
  maxWeightChangePercent: number;
};

const willCreateCycle = (nn: NeuralNet, start: number, end: number) => {
  const visited = new Set<number>();
  const ancestor = new Set<number>();
  const testGenes = [...nn.genes, new Gene(start, end, 1)];
  const adjacent = new Map<number, Gene[]>();
  testGenes.forEach((g) => {
    const genes = adjacent.get(g.inNeuron);
    if (genes) {
      genes.push(g);
    } else {
      adjacent.set(g.inNeuron, [g]);
    }
  });

  const hasCycle = (neuron: number) => {
    visited.add(neuron);
    ancestor.add(neuron);
    const genes = adjacent.get(neuron);
    if (genes) {
      for (let gene of genes) {
        const next = gene.outNeuron;
        if (!visited.has(next)) {
          if (hasCycle(next)) {
            return true;
          }
        } else if (ancestor.has(next)) {
          return true;
        }
      }
    }
    ancestor.delete(neuron);
    return false;
  };

  return hasCycle(start);
};

/**
 * Returns a new array of genes replacing the ones
 * that match the genes in the newGenes array
 * @param genes
 * @param newGenes
 * @returns
 */
const replaceGenes = (
  genes: Gene[],
  newGenes: Gene[],
  meta: NeatMeta
): Gene[] => {
  const filtered = genes.filter(
    (origGene) =>
      !newGenes.some(
        (newGene) =>
          getInnovation(origGene, meta) === getInnovation(newGene, meta)
      )
  );
  return [...filtered, ...newGenes];
};

/**
 * Randomly adds a link between neurons
 */
export const addRandomLink = (nn: NeuralNet, meta: NeatMeta): NeuralNet => {
  const geneTopoKeySet = new Set(nn.genes.map((g) => getTopologicalKey(g)));
  let foundNewGene = false;
  let tries = 0;
  const MAX_TRIES = 100;
  while (!foundNewGene && tries < MAX_TRIES) {
    tries++;
    const [start, end] = _.sampleSize(nn.neurons, 2);

    // Cannot start with output (wrong direction)
    if (start.neuronType === "output") {
      continue;
    }

    // Cannot end with an input
    if (end.neuronType === "input") {
      continue;
    }

    // See if we already have the gene
    const key = `${start.id}:${end.id}`;
    if (geneTopoKeySet.has(key)) {
      continue;
    }

    // Ensure this doesn't make cycle
    if (willCreateCycle(nn, start.id, end.id)) {
      continue;
    }

    // Found a suitable gene, let's make it
    foundNewGene = true;
    const newGene = new Gene(start.id, end.id, _.random(-1, 1, true));
    registerGene(newGene, meta);
    // console.log("ADDING GENE " + newGene.topologicalKey);

    return new NeuralNet([...nn.neurons], [...nn.genes, newGene], meta);
  }

  console.error("Unable to mutate link. Too many tries.");
  return nn;
};

/**
 * 1) Randomly selects a gene/edge
 * 2) That gene becomes disabled
 * 3) A new neuron is created
 * 4) The input/output neurons of that gene now become part of 2 new genes:
 *    - gene 1:  [input -> new neuron]
 *    - gene 2:  [new neuron -> output]
 * 5) The weights of the new genes are copied from the disabled gene
 */
export const addRandomNode = (
  nn: NeuralNet,
  activationForNewNeurons: Activation,
  meta: NeatMeta
): NeuralNet => {
  const geneToSplit = _.sample(getEnabledGenes(nn)); // Only allow splitting of enabled genes
  if (!geneToSplit) {
    console.log("No genes to split, cannot add random node");
    return nn;
  }
  const clonedGeneToSplit = clone(geneToSplit, { enabled: false });

  const newNeuron = new Neuron(
    getMaxIdNeuron(nn).id + 1,
    "hidden",
    activationForNewNeurons
  );

  const gene1 = new Gene(
    clonedGeneToSplit.inNeuron,
    newNeuron.id,
    clonedGeneToSplit.weight
  );
  registerGene(gene1, meta);

  const gene2 = new Gene(
    newNeuron.id,
    clonedGeneToSplit.outNeuron,
    clonedGeneToSplit.weight
  );
  registerGene(gene2, meta);

  const newNeurons = [...nn.neurons, newNeuron];
  const newGenes = replaceGenes(
    nn.genes,
    [clonedGeneToSplit, gene1, gene2],
    meta
  );

  return new NeuralNet(newNeurons, newGenes, meta);
};

let _gaussian_previous: boolean = false;
let y2 = 0;
/**
 * Code ported from P5.js's randomGaussian()
 * @param mean
 * @param sd
 * @returns
 */
export const gauss = (mean: number = 0, sd = 1) => {
  let y1, x1, x2, w;
  if (_gaussian_previous) {
    y1 = y2;
    _gaussian_previous = false;
  } else {
    do {
      x1 = _.random(2, true) - 1;
      x2 = _.random(2, true) - 1;
      w = x1 * x1 + x2 * x2;
    } while (w >= 1);
    w = Math.sqrt((-2 * Math.log(w)) / w);
    y1 = x1 * w;
    y2 = x2 * w;
    _gaussian_previous = true;
  }

  const m = mean || 0;
  return y1 * sd + m;
};

/**
 * @param gene gene to potentially mutate
 * @param options
 * @param meta
 * @returns a mutated gene (or undefined if not mutated)
 */
export const mutateGene = (
  gene: Gene,
  options: MutationOptions
): Gene | undefined => {
  const r = Math.random();
  if (r < options.weightMutateRate) {
    const weight = _.clamp(
      gene.weight + gauss(0, options.weightMutatePower),
      options.weightMinValue,
      options.weightMaxValue
    );
    return clone(gene, { weight });
  }

  if (r < options.weightMutateRate + options.weightReplaceRate) {
    const weight = _.clamp(
      gauss(options.weightInitMean, options.weightInitStdev),
      options.weightMinValue,
      options.weightMaxValue
    );
    return clone(gene, { weight });
  }
  // else return undefined
  return undefined;
};

export const mutateWeights = (
  nn: NeuralNet,
  options: MutationOptions,
  meta: NeatMeta
) => {
  const modifiedGenes: Gene[] = [];
  getEnabledGenes(nn).forEach((gene) => {
    const maybeModified = mutateGene(gene, options);
    if (maybeModified) {
      modifiedGenes.push(maybeModified);
    }
  });
  const newGenes = replaceGenes(nn.genes, modifiedGenes, meta);
  return new NeuralNet(nn.neurons, newGenes, meta);
};

/**
 * Mutates a NN using possibly many mutation strategies, returning
 * a new NN if any succeeds or the same NN if not.
 */
export const mutateIndividual = (
  individual: EvaluatedIndividual,
  options: MutationOptions,
  meta: NeatMeta
): EvaluatedIndividual => {
  let result = {
    ...individual,
    neuralNet: mutateNN(individual.neuralNet, options, meta),
  };

  return result;
};

export const mutateNN = (
  nn: NeuralNet,
  options: MutationOptions,
  meta: NeatMeta
): NeuralNet => {
  let result = nn;
  if (Math.random() < options.addGeneRate) {
    result = addRandomLink(result, meta);
  }
  if (Math.random() < options.addNeuronRate) {
    result = addRandomNode(result, options.activationForNewNeurons, meta);
  }
  result = mutateWeights(result, options, meta);
  return result;
};

/**
 * Ensures at least one mutation is tried
 * @param nn
 */
export const mutateSingle = (
  nn: NeuralNet,
  options: MutationOptions,
  meta: NeatMeta
) => {
  const totalPct =
    options.addGeneRate + options.addNeuronRate + options.weightMutateRate;
  let rand = Math.random() * totalPct;

  rand -= options.addGeneRate;
  if (rand <= 0) {
    return addRandomLink(nn, meta);
  }

  rand -= options.addNeuronRate;
  if (rand <= 0) {
    return addRandomNode(nn, options.activationForNewNeurons, meta);
  }

  return mutateWeights(nn, options, meta);
};

export const mutate = (
  individuals: EvaluatedIndividual[],
  options: PopulationOptions,
  meta: NeatMeta
): EvaluatedIndividual[] => {
  return individuals.map((i) =>
    mutateIndividual(i, options.mutationOptions, meta)
  );
};

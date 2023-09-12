import { NeuralNet } from "./NeuralNet";
import { Activation, Neuron } from "./Neuron";
import { Gene } from "./Gene";
import _ from "lodash";
import { Individual } from "./Population";
import { MutationOptions, PopulationOptions } from "./Options";

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
const replaceGenes = (genes: Gene[], newGenes: Gene[]): Gene[] => {
  const filtered = genes.filter(
    (origGene) =>
      !newGenes.some((newGene) => origGene.innovation === newGene.innovation)
  );
  return [...filtered, ...newGenes];
};

/**
 * Randomly adds a link between neurons
 */
export const addRandomLink = (nn: NeuralNet): NeuralNet => {
  const geneTopoKeySet = new Set(nn.genes.map((g) => g.topologicalKey));
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
    // console.log("ADDING GENE " + newGene.topologicalKey);

    return new NeuralNet([...nn.neurons], [...nn.genes, newGene]);
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
  activationForNewNeurons: Activation
): NeuralNet => {
  const geneToSplit = _.sample(nn.enabledGenes); // Only allow splitting of enabled genes
  if (!geneToSplit) {
    console.log("No genes to split, cannot add random node");
    return nn;
  }
  const clonedGeneToSplit = geneToSplit.clone({ enabled: false });

  const newNeuron = new Neuron(
    nn.maxIdNeuron.id + 1,
    "hidden",
    activationForNewNeurons
  );

  const gene1 = new Gene(
    clonedGeneToSplit.inNeuron,
    newNeuron.id,
    clonedGeneToSplit.weight
  );

  const gene2 = new Gene(
    newNeuron.id,
    clonedGeneToSplit.outNeuron,
    clonedGeneToSplit.weight
  );

  const newNeurons = [...nn.neurons, newNeuron];
  const newGenes = replaceGenes(nn.genes, [clonedGeneToSplit, gene1, gene2]);

  // console.log(
  //   "Neuron " +
  //     newNeuron.id +
  //     " added between " +
  //     clonedGeneToSplit.inNeuron +
  //     " and " +
  //     clonedGeneToSplit.outNeuron
  // );

  return new NeuralNet(newNeurons, newGenes);
};

export const mutateWeight = (nn: NeuralNet): NeuralNet => {
  const gene = _.sample(nn.enabledGenes);
  if (!gene) {
    return nn;
  }
  const change = _.random(-1, 1, true);
  const newWeight = gene.weight + change;
  const newGene = new Gene(gene.inNeuron, gene.outNeuron, newWeight);
  const newGenes = replaceGenes(nn.genes, [newGene]);

  // console.log(
  //   "Mutating weight on " +
  //     gene.topologicalKey +
  //     " prev:" +
  //     gene.weight +
  //     " new:" +
  //     newWeight
  // );

  return new NeuralNet(nn.neurons, newGenes);
};

/**
 * Mutates a NN using possibly many mutation strategies, returning
 * a new NN if any succeeds or the same NN if not.
 */
export const mutateIndividual = (
  individual: Individual,
  options: MutationOptions
): Individual => {
  let result = {
    ...individual,
    neuralNet: mutateNN(individual.neuralNet, options),
  };

  return result;
};

export const mutateNN = (
  nn: NeuralNet,
  options: MutationOptions
): NeuralNet => {
  let result = nn;
  if (Math.random() < options.addGeneRate) {
    result = addRandomLink(result);
  }
  if (Math.random() < options.addNeuronRate) {
    result = addRandomNode(result, options.activationForNewNeurons);
  }
  if (Math.random() < options.weightChangeRate) {
    result = mutateWeight(result);
  }
  return result;
};

/**
 * Ensures at least one mutation is tried
 * @param nn
 */
export const mutateSingle = (nn: NeuralNet, options: MutationOptions) => {
  const totalPct =
    options.addGeneRate +
    options.addNeuronRate +
    options.weightChangeRate +
    options.biasChangeRate;
  let rand = Math.random() * totalPct;

  rand -= options.addGeneRate;
  if (rand <= 0) {
    return addRandomLink(nn);
  }

  rand -= options.addNeuronRate;
  if (rand <= 0) {
    return addRandomNode(nn, options.activationForNewNeurons);
  }

  rand -= options.weightChangeRate;
  return mutateWeight(nn);
};

export const mutate = (
  individuals: Individual[],
  options: PopulationOptions
): Individual[] => {
  return individuals.map((i) => mutateIndividual(i, options.mutationOptions));
};

import { Gene } from "./Gene";
import { NeatMeta, getInnovation, registerGene } from "./NeatMeta";
import { Neuron } from "./Neuron";
import _ from "lodash";

export const getNeuronById = (nn: NeuralNet, id: number) => {
  return nn.idToNeuronMap.get(id);
};

export const hasInnovation = (nn: NeuralNet, innovation: number) => {
  return nn.innovationSet.has(innovation);
};

/**
 * @returns the neuron with the highest id
 */
export const getMaxIdNeuron = (nn: NeuralNet) => {
  return nn.neurons.reduce((maxSoFar, neuron) =>
    maxSoFar.id > neuron.id ? maxSoFar : neuron
  );
};

export const getEnabledGenes = (nn: NeuralNet) => {
  return nn.genes.filter((gene) => gene.enabled);
};

export class NeuralNet {
  public idToNeuronMap = new Map<number, Neuron>();
  public innovationSet = new Set<number>();

  constructor(
    public readonly neurons: Neuron[],
    public readonly genes: Gene[],
    meta: NeatMeta
  ) {
    // Sort on creation so nobody else has to
    genes.forEach((g) => registerGene(g, meta));
    neurons.sort((a, b) => a.id - b.id);
    neurons.forEach((n) => this.idToNeuronMap.set(n.id, n));
    genes.sort((a, b) => getInnovation(a, meta) - getInnovation(b, meta));
    genes.forEach((g) => this.innovationSet.add(getInnovation(g, meta)));
  }
}

const n1 = new Neuron(1, "input", "identity");
const n2 = new Neuron(2, "input", "identity");
const n3 = new Neuron(3, "input", "identity");
const n4 = new Neuron(4, "output", "identity");
const n5 = new Neuron(5, "hidden", "identity");
const n6 = new Neuron(6, "hidden", "sigmoid");
const n7 = new Neuron(7, "hidden", "sigmoid");

export const testNeurons: Neuron[] = [n1, n2, n3, n4, n5, n6, n7];

export const testGenes: Gene[] = [
  new Gene(1, 5, 0.5),
  new Gene(2, 6, -0.2),
  new Gene(3, 4, 1.1, false),
  new Gene(5, 4, 3),
  new Gene(6, 5, 0.4),
  new Gene(1, 7, -0.3),
  new Gene(7, 4, 1.4),
];

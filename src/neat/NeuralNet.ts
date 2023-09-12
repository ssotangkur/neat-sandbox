import { Gene } from "./Gene";
import { Neuron } from "./Neuron";
import _ from "lodash";

export class NeuralNet {
  private idToNeuronMap = new Map<number, Neuron>();
  private innovationSet = new Set<number>();

  constructor(
    public readonly neurons: Neuron[],
    public readonly genes: Gene[]
  ) {
    // Sort on creation so nobody else has to
    neurons.sort((a, b) => a.id - b.id);
    neurons.forEach((n) => this.idToNeuronMap.set(n.id, n));
    genes.sort((a, b) => a.innovation - b.innovation);
    genes.forEach((g) => this.innovationSet.add(g.innovation));
  }

  get enabledGenes() {
    return this.genes.filter((gene) => gene.enabled);
  }

  /**
   * @returns the neuron with the highest id
   */
  get maxIdNeuron() {
    return this.neurons.reduce((maxSoFar, neuron) =>
      maxSoFar.id > neuron.id ? maxSoFar : neuron
    );
  }

  public clone(override?: Partial<NeuralNet>) {
    return new NeuralNet(
      override?.neurons ?? this.neurons,
      override?.genes ?? this.genes
    );
  }

  public getNeuronById(id: number) {
    return this.idToNeuronMap.get(id);
  }

  public hasInnovation(innovation: number) {
    return this.innovationSet.has(innovation);
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

export const testNeuralNet = new NeuralNet(testNeurons, testGenes);

export const simpleNet = new NeuralNet(
  [n1, n2, n3, n4, n5],
  [new Gene(1, 5, -2), new Gene(2, 5, 1), new Gene(3, 5, 1), new Gene(5, 4, 1)]
);

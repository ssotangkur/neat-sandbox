export type NeuronType = "input" | "hidden" | "output";

export class Neuron {
  constructor(
    public readonly id: number,
    public readonly neuronType: NeuronType,
    public readonly activation: Activation
  ) {}

  public clone(override?: Partial<Neuron>): Neuron {
    return new Neuron(
      override?.id ?? this.id,
      override?.neuronType ?? this.neuronType,
      override?.activation ?? this.activation
    );
  }
}

export type Activation = "identity" | "sigmoid" | "relu" | "bias";
// Activation Functions
const identity = (x: number) => x;
// Fast Approx of Sigmoid
const sigmoid = (x: number) => 0.5 * (x / (1 + Math.abs(x)) + 1);
const relu = (x: number) => Math.max(0, x);
const bias = (_: number) => 1;

export const getActivationFunction = (neuron: Neuron) => {
  switch (neuron.activation) {
    case "sigmoid":
      return sigmoid;
    case "relu":
      return relu;
    case "identity":
      return identity;
    case "bias":
      return bias;
  }
};

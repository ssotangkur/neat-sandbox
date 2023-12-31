import _ from "lodash";
import { Neuron } from "./Neuron";
import { NeuralNet } from "./NeuralNet";
import { NeatMeta } from "./NeatMeta";

export const createSimpleNeuralNet = (
  numInputs: number,
  numOutputs: number,
  meta: NeatMeta
) => {
  let i = 1;
  const inNeurons = _.range(numInputs).map(
    () => new Neuron(i++, "input", "identity")
  );
  // Add bias as an input
  inNeurons.push(new Neuron(i++, "input", "bias"));
  const outNeurons = _.range(numOutputs).map(
    () => new Neuron(i++, "output", "identity")
  );
  return new NeuralNet([...inNeurons, ...outNeurons], [], meta);
};

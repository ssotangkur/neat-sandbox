import { describe } from "vitest";
import { createSimpleNeuralNet } from "./NeuralNetFactory";
import { Gene } from "./Gene";
import { Kernel, predict } from "./Inference";
import { Neuron } from "./Neuron";
import { getMaxIdNeuron } from "./NeuralNet";
import { NeatMeta } from "./NeatMeta";

describe("Inference", () => {
  it("when no hidden nodes, predicts", () => {
    const nn = createSimpleNeuralNet(2, 1, new NeatMeta());
    const in1 = nn.neurons[0];
    const in2 = nn.neurons[1];
    const out = nn.neurons[3];
    nn.genes.push(new Gene(in1.id, out.id, 1));
    nn.genes.push(new Gene(in2.id, out.id, 1));
    const kernel = new Kernel(nn);

    expect(predict(kernel, [0, 0, 0])).toEqual([0]);
    expect(predict(kernel, [1, 1, 0])).toEqual([2]);
    expect(predict(kernel, [1, 0, 0])).toEqual([1]);
    expect(predict(kernel, [0, 1, 0])).toEqual([1]);
  });

  it("when one hidden node predicts", () => {
    const nn = createSimpleNeuralNet(2, 1, new NeatMeta());
    const in1 = nn.neurons[0];
    const out = nn.neurons[3];
    const hidden = new Neuron(getMaxIdNeuron(nn).id + 1, "hidden", "sigmoid");
    nn.neurons.push(hidden);
    nn.genes.push(new Gene(in1.id, hidden.id, 1));
    nn.genes.push(new Gene(hidden.id, out.id, 1));
    const kernel = new Kernel(nn);

    expect(predict(kernel, [0, 0, 0])).toEqual([0.5]);
    expect(predict(kernel, [1, 1, 0])).toEqual([0.75]);
    expect(predict(kernel, [1, 0, 0])).toEqual([0.75]);
    expect(predict(kernel, [0, 1, 0])).toEqual([0.5]);
  });

  it("when one hidden node and multiple connections", () => {
    const nn = createSimpleNeuralNet(2, 1, new NeatMeta());
    const in1 = nn.neurons[0];
    const in2 = nn.neurons[1];
    const out = nn.neurons[3];
    const hidden = new Neuron(getMaxIdNeuron(nn).id + 1, "hidden", "sigmoid");
    nn.neurons.push(hidden);
    nn.genes.push(new Gene(in1.id, hidden.id, 1));
    nn.genes.push(new Gene(in2.id, hidden.id, 1));
    nn.genes.push(new Gene(hidden.id, out.id, 1));

    const kernel = new Kernel(nn);

    expect(predict(kernel, [0, 0, 0])).toEqual([0.5]);
    expect(predict(kernel, [1, 1, 0])[0]).toBeCloseTo(0.833333333333333);
    expect(predict(kernel, [1, 0, 0])).toEqual([0.75]);
    expect(predict(kernel, [0, 1, 0])).toEqual([0.75]);
  });

  it("when one node has bias", () => {
    const nn = createSimpleNeuralNet(2, 1, new NeatMeta());
    const in1 = nn.neurons[0];
    const out = nn.neurons[3];
    const hidden = new Neuron(getMaxIdNeuron(nn).id + 1, "hidden", "sigmoid");
    nn.neurons.push(hidden);
    nn.genes.push(new Gene(in1.id, hidden.id, 1));
    nn.genes.push(new Gene(hidden.id, out.id, 1));

    const kernel = new Kernel(nn);

    expect(predict(kernel, [0, 0, 0])).toEqual([0.5]);
    expect(predict(kernel, [1, 1, 0])).toEqual([0.75]);
    expect(predict(kernel, [1, 0, 0])).toEqual([0.75]);
    expect(predict(kernel, [0, 1, 0])).toEqual([0.5]);
  });
});

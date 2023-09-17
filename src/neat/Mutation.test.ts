import { describe, it, vi } from "vitest";
import { mutateGene, mutateWeights } from "./Mutation";
import { Gene } from "./Gene";
import { DefaultMutationOptions, MutationOptions } from "./Options";
import { NeuralNet } from "./NeuralNet";
import { createSimpleNeuralNet } from "./NeuralNetFactory";
import { NeatMeta } from "./NeatMeta";
import _ from "lodash";

describe("Mutation", () => {
  it("mutates gene with right random", () => {
    const weightMutateRate = 0.5;
    vi.spyOn(global.Math, "random").mockReturnValue(weightMutateRate - 0.01);
    const gene = new Gene(1, 2, 1.0);
    const options: MutationOptions = {
      ...DefaultMutationOptions,
      weightMutateRate,
    };
    const result = mutateGene(gene, options);
    expect(result).toBeDefined();
    expect(result?.weight).not.toEqual(gene.weight);
  });
  it("does not mutate gene with wrong random", () => {
    const weightMutateRate = 0.5;
    const weightReplaceRate = 0.1;

    const gene = new Gene(1, 2, 1.0);
    const options: MutationOptions = {
      ...DefaultMutationOptions,
      weightMutateRate,
      weightReplaceRate,
    };
    vi.spyOn(global.Math, "random").mockReturnValue(
      weightMutateRate + weightReplaceRate
    );
    const result = mutateGene(gene, options);
    expect(result).toBeUndefined();
  });
  it("tries to mutate all genes in nn", () => {
    const meta = new NeatMeta();
    const nn = createSimpleNeuralNet(5, 3, meta);
    const weightMutateRate = 0.5;
    const options: MutationOptions = {
      ...DefaultMutationOptions,
      weightMutateRate,
    };
    vi.spyOn(global.Math, "random").mockReturnValue(weightMutateRate - 0.01);
    const mutatedNN = mutateWeights(nn, options, meta);
    _.zip(mutatedNN.genes, nn.genes).forEach(([newGene, prevGene]) => {
      expect(newGene).toBeDefined();
      expect(newGene).not.toEqual(prevGene);
      expect(newGene?.weight).not.toEqual(prevGene?.weight);
    });
  });
});

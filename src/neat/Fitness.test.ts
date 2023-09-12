import _ from "lodash";
import { XORFitness, XOR_INPUT, XOR_OUTPUT } from "./Fitness";
import { Kernel } from "./Inference";
import { describe, it, expect } from "vitest";

describe.skip(XORFitness.name, () => {
  const createMockKernel = (
    mockInputs: number[][],
    mockOutputs: number[][]
  ): Kernel => {
    const mockKernel: Partial<Kernel> = {
      predict: (inputs: number[]): number[] => {
        for (let i = 0; i < mockInputs.length; i++) {
          if (_.isEqual(inputs, mockInputs[i])) {
            return mockOutputs[i];
          }
        }
        return mockOutputs[0];
      },
    };
    return mockKernel as Kernel;
  };

  it("returns 0 for perfect prediction", () => {
    const mockKernel: Partial<Kernel> = createMockKernel(XOR_INPUT, XOR_OUTPUT);
    expect(XORFitness(mockKernel as Kernel)).toBeCloseTo(0);
  });

  it("returns -4 if each prediction is off by 1", () => {
    const mockKernel: Partial<Kernel> = createMockKernel(XOR_INPUT, [
      [1],
      [0],
      [0],
      [1],
    ]);
    expect(XORFitness(mockKernel as Kernel)).toBeCloseTo(-4);
  });
});

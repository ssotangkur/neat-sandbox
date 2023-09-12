import _ from "lodash";
import { Kernel } from "./Inference";
import { EvaluateIndividualsFunc, PopulationOptions } from "./Options";
import { EvaluatedIndividual, Individual } from "./Population";

export type FitnessFunction = (kernel: Kernel) => number;
export type EndCondition = (kernel: Kernel, fitness: number) => boolean;

/**
 * First 2 are input
 */
export const XOR_INPUT = [
  [0, 0, 0],
  [0, 1, 0],
  [1, 0, 0],
  [1, 1, 0],
];
export const XOR_OUTPUT = [[0], [1], [1], [0]];
export const XORFitness: FitnessFunction = (kernel: Kernel) => {
  const predictions = XOR_INPUT.map((input) => kernel.predict(input));
  const errors = _.zip(XOR_OUTPUT, predictions).map(
    ([expected_arr, actual_arr]) => {
      const predictionErrors = _.zip(expected_arr!, actual_arr!).map(
        ([expected, actual]) => Math.abs(expected! - actual!)
      );
      return _.sum(predictionErrors);
    }
  );
  const sumErrors = _.sum(errors);
  // Negate the errors since we want less error to mean more fit
  return 4 / (0.0001 + Math.pow(sumErrors, 2));
};

export const XOREndCondition: EndCondition = (kernel) => {
  const predictions = XOR_INPUT.map((input) => kernel.predict(input));
  // Check each pair of output arrays
  return _.zip(XOR_OUTPUT, predictions).every(([expected, actual]) => {
    const rounded = actual?.map(Math.round);
    // Check each number in output array
    return _.zip(expected, rounded).every(([e, a]) => e === a);
  });
};

export const evaluateIndividuals: EvaluateIndividualsFunc = async (
  individuals: Individual[],
  _: PopulationOptions
) => {
  let maxFitness = Number.MIN_SAFE_INTEGER;
  let minFitness = Number.MAX_SAFE_INTEGER;
  const evaled: EvaluatedIndividual[] = individuals.map((i) => {
    const fitness = XORFitness(i.kernel!);
    minFitness = Math.min(minFitness, fitness);
    maxFitness = Math.max(maxFitness, fitness);
    const result: EvaluatedIndividual = {
      ...i,
      fitness,
    };
    return result;
  });

  // sort individuals in descending order
  evaled.sort((a, b) => b.fitness! - a.fitness!);
  const bestOverall = evaled[0];
  return { minFitness, maxFitness, bestOverall, individuals: evaled };
};

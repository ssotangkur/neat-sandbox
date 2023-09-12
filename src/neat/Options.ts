import {
  evaluateRockets,
  rocketEndCondition,
} from "../simulation/EvaluateRockets";
import { EndCondition, XOREndCondition, evaluateIndividuals } from "./Fitness";
import { Activation } from "./Neuron";
import { EvaluatedIndividual, Individual } from "./Population";

export type PartialPopulationOptions = {
  count: number;
  inputs: number;
  outputs: number;
  evaluateIndividuals: EvaluateIndividualsFunc;
  endCondition: EndCondition;
  mutationOptions?: Partial<MutationOptions>;
  speciationOptions?: Partial<SpeciationOptions>;
};

export type MutationOptions = {
  addGeneRate: number;
  addNeuronRate: number;
  activationForNewNeurons: Activation;
  weightChangeRate: number;
  biasChangeRate: number;
};

export const DefaultMutationOptions: MutationOptions = {
  addGeneRate: 0.01,
  addNeuronRate: 0.01,
  activationForNewNeurons: "sigmoid",
  weightChangeRate: 0.3,
  biasChangeRate: 0.05,
};

export type SpeciationOptions = {
  compatibilityThreshold: number;
  compatibilityChangeRate: number; // how much the threshold can change each generation
  targetNumSpecies: number; // how many species to try to have
  excessMissingFactor: number;
  weightsFactor: number;
  minPopulation: number;
  selectionPercent: number; // Percentage of a species that can be parents for offspring
  elitePercent: number; // Percent of selection that will be copied verbatim to the next generation
  minElite: number; // minium number of elites to pass to next gen
  stagnationThreshold: number; // number of generations before stagnation starts
  stagnationPenaltyRate: number; // percent of adjusted fitness to reduce per stagnation generation (capped to 100% total)
  maxStagnationGens: number; // number of generations without progress before the whole specie is eliminated
};

export const defaultSpeciationOptions: SpeciationOptions = {
  compatibilityThreshold: 1.3,
  compatibilityChangeRate: 0.1,
  targetNumSpecies: 3,
  excessMissingFactor: 1,
  weightsFactor: 0.4,
  minPopulation: 4,
  selectionPercent: 0.5,
  elitePercent: 0.1,
  minElite: 1,
  stagnationThreshold: 15,
  stagnationPenaltyRate: 0.02,
  maxStagnationGens: 70,
};

export type EvaluateIndividualsFunc = (
  individuals: Individual[],
  popOptions: PopulationOptions
) => Promise<{
  minFitness: number;
  maxFitness: number;
  bestOverall: EvaluatedIndividual;
  individuals: EvaluatedIndividual[];
}>;

export type PopulationOptions = {
  count: number;
  inputs: number;
  outputs: number;
  evaluateIndividuals: EvaluateIndividualsFunc;
  endCondition: EndCondition;
  mutationOptions: MutationOptions;
  speciationOptions: SpeciationOptions;
};

/**
 *
 * @param p
 * @returns
 */
export const createOptions = (
  p: PartialPopulationOptions
): PopulationOptions => {
  return {
    ...p,
    mutationOptions: { ...DefaultMutationOptions, ...p.mutationOptions },
    speciationOptions: { ...defaultSpeciationOptions, ...p.speciationOptions },
  };
};

export type EvalType = "XOR" | "Rocket";

// Type that removes the functions and substitutes them with a enum: evalType
export type SerializeablePopulationOptions = Omit<
  PopulationOptions,
  "evaluateIndividuals" | "endCondition"
> & {
  evalType: EvalType;
};

export type OptionSet = Record<string, PopulationOptions>;

export const serializeableOption = (options?: PopulationOptions) => {
  if (!options) {
    return;
  }
  const serializeable: SerializeablePopulationOptions = {
    ...options,
    evalType:
      options.evaluateIndividuals === evaluateIndividuals ? "XOR" : "Rocket",
  };
  return serializeable;
};

export const materializeOption = (
  serializeable: SerializeablePopulationOptions
) => {
  const result: PopulationOptions = {
    ...serializeable,
    evaluateIndividuals: getEvaluateIndividuals(serializeable.evalType),
    endCondition: getEndCondition(serializeable.evalType),
  };
  return result;
};

export const serialize = (optionSet: OptionSet) => {
  const serializeable: Record<string, SerializeablePopulationOptions> = {};
  Object.entries(optionSet).forEach(([key, option]) => {
    const serialOption = serializeableOption(option);
    if (serialOption) {
      serializeable[key] = serialOption;
    }
  });
  return JSON.stringify(serializeable);
};

export const deserialize = (optionSetStr: string) => {
  const serializeable: Record<string, SerializeablePopulationOptions> =
    JSON.parse(optionSetStr);
  const result: OptionSet = {};
  Object.entries(serializeable).map(([key, option]) => {
    result[key] = materializeOption(option);
  });
  return result;
};

export const getEvaluateIndividuals = (
  evalType: EvalType
): EvaluateIndividualsFunc => {
  switch (evalType) {
    case "Rocket":
      return evaluateRockets;
    default:
      return evaluateIndividuals;
  }
};

export const getEndCondition = (evalType: EvalType): EndCondition => {
  switch (evalType) {
    case "Rocket":
      return rocketEndCondition;
    default:
      return XOREndCondition;
  }
};

export type OptionsLocalStorage = {
  optionSet: OptionSet;
  currentOption: string | undefined;
};

export const OPTIONS_KEY = "options";
export const CURRENT_OPTION_KEY = "currentOption";

export const readFromLocalStorage = (): OptionsLocalStorage => {
  const optionsStr = localStorage.getItem(OPTIONS_KEY);
  const optionSet = optionsStr ? deserialize(optionsStr) : {};
  const currentOption = localStorage.getItem(CURRENT_OPTION_KEY) ?? undefined;
  return { optionSet, currentOption };
};

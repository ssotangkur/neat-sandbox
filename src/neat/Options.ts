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
  evalType: EvalType;
  mutationOptions?: Partial<MutationOptions>;
  speciationOptions?: Partial<SpeciationOptions>;
};

export type MutationOptions = {
  addGeneRate: number;
  addNeuronRate: number;
  activationForNewNeurons: Activation;
  weightMutateRate: number;
  weightMutatePower: number;
  weightReplaceRate: number;
  weightMaxValue: number;
  weightMinValue: number;
  weightInitMean: number;
  weightInitStdev: number;
};

export const DefaultMutationOptions: MutationOptions = {
  addGeneRate: 0.01,
  addNeuronRate: 0.01,
  activationForNewNeurons: "sigmoid",
  weightMutateRate: 0.8,
  weightMutatePower: 0.5,
  weightReplaceRate: 0.1,
  weightMaxValue: 30,
  weightMinValue: -30,
  weightInitMean: 0.0,
  weightInitStdev: 1.0,
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

export type EvaluateIndividualsFunc = (individuals: Individual[]) => Promise<{
  minFitness: number;
  maxFitness: number;
  bestOverall: EvaluatedIndividual;
  individuals: EvaluatedIndividual[];
}>;

export type PopulationOptions = {
  count: number;
  inputs: number;
  outputs: number;
  evalType: EvalType;
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

export type OptionSet = Record<string, PopulationOptions>;

export const serialize = (optionSet: OptionSet) => {
  return JSON.stringify(optionSet);
};

export const deserialize = (optionSetStr: string) => {
  const result: OptionSet = JSON.parse(optionSetStr);
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

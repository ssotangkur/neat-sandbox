import { EvaluateIndividualsFunc } from "../neat/Options";
import { EndCondition } from "../neat/Fitness";
import _ from "lodash";
import { RocketSimulation, defaultRocketConfig } from "./RocketSimulation";

export const evaluateRockets: EvaluateIndividualsFunc = async (individuals) => {
  const sim = new RocketSimulation(defaultRocketConfig);
  let stepCount = 0;
  await sim.init(individuals);
  while (sim.active()) {
    sim.step();
    stepCount++;
  }
  const evaled = sim.evaluate();

  evaled.sort((a, b) => b.fitness - a.fitness);

  const worst = evaled[evaled.length - 1];
  const best = evaled[0];

  return {
    minFitness: worst.fitness,
    maxFitness: best.fitness,
    bestOverall: best,
    individuals: evaled,
  };
};

export const rocketEndCondition: EndCondition = (_, fitness) => {
  return false;
};

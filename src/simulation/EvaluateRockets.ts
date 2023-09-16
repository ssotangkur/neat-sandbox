import { EvaluateIndividualsFunc } from "../neat/Options";
import { EndCondition } from "../neat/Fitness";
import _ from "lodash";
import {
  RocketSimulation,
  defaultRocketConfig,
  defaultSimConfig,
} from "./RocketSimulation";
import { EvaluatedIndividual } from "../neat/Population";

export const evaluateRockets: EvaluateIndividualsFunc = async (individuals) => {
  // Run simulation 3 times and sum fitness
  const evals: number[] = Array(individuals.length).fill(0);

  for (let phase = 0; phase < 3; phase++) {
    const sim = new RocketSimulation(defaultRocketConfig, defaultSimConfig());
    const maxSteps = sim.simConfig.maxSteps;
    let stepCount = 0;
    await sim.init(individuals);
    while (sim.active() && stepCount < maxSteps) {
      sim.step();
      stepCount++;
    }
    const evaled = sim.evaluate();
    evaled.forEach((e, i) => (evals[i] += e.fitness));
    sim.reset(); // clean up resources
    console.debug("Generation completed in " + stepCount + " steps");
  }

  // turn individuals into evaledIndividuals
  const evaled: EvaluatedIndividual[] = _.zip(individuals, evals).map(
    ([ind, fitness]) => ({ ...ind!, fitness: fitness! })
  );

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

export const rocketEndCondition: EndCondition = () => {
  return false;
};

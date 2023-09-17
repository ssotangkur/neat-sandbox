import { EvaluateIndividualsFunc } from "../neat/Options";
import { EndCondition } from "../neat/Fitness";
import _ from "lodash";
import {
  RocketSimulation,
  defaultRocketConfig,
  defaultSimConfig,
} from "./RocketSimulation";
import { EvaluatedIndividual, Individual } from "../neat/Population";
import { runWorker } from "../utils/runWorker";
import { Rocket, SimulationConfig } from "./Rocket";
import { Vector3 } from "three";

export const evaluateRocketPhase = async (
  individuals: Individual[],
  target: number[]
) => {
  const sim = new RocketSimulation(
    defaultRocketConfig,
    createSimConfig(target, template)
  );
  const maxSteps = sim.simConfig.maxSteps;
  let stepCount = 0;
  await sim.init(individuals);
  while (sim.active() && stepCount < maxSteps) {
    sim.step();
    stepCount++;
  }
  sim.evaluate();
  const agents = sim.agents();
  sim.reset(); // clean up resources
  console.debug("Generation completed in " + stepCount + " steps");
  return agents;
};

const createSimConfig = (target: number[], template: SimulationConfig) => {
  return {
    ...template,
    target: new Vector3(...target),
  };
};

// Create an ordered list of configs so rockets can learn quicker
const template = defaultSimConfig();

// Targets will get progressively harder
export const progressiveConfigs: SimulationConfig[] = [
  createSimConfig([40, 50, 40], template),
  createSimConfig([50, 50, 0], template),
  createSimConfig([-50, 50, 0], template),
  createSimConfig([0, 50, 50], template),
  createSimConfig([0, 50, -50], template),
  createSimConfig([-40, 50, -40], template),
  createSimConfig([40, 50, -40], template),
  createSimConfig([-40, 50, 40], template),
];

export const evaluateRockets: EvaluateIndividualsFunc = async (individuals) => {
  // Run all phases in parallel
  const promises = progressiveConfigs.map((simConfig) =>
    runWorker("evaluateRocketPhase", individuals, simConfig.target.toArray())
  );
  const phases = await Promise.all(promises);

  /**
   * Given a list of simulated rockets, progressively add each
   * score only if all previous phases are "passed"
   * @param phases
   * @returns
   */
  const scorePhasesProgressively = (phases: Rocket[]) => {
    // If the previous phase is "passed" then we add the current
    // score. If the current phase is not passed, we set it to false
    // to prevent score from accumulating anymore
    const { score } = phases.reduce(
      ({ score, passedPrev }, rocket) => {
        const newScore = passedPrev ? score + rocket._fitness : score;
        const newPassedPrev = passedPrev && rocket._passed ? true : false;
        return { score: newScore, passedPrev: newPassedPrev };
      },
      {
        score: 0,
        passedPrev: true,
      }
    );
    return score;
  };

  const scores = _.zip(...phases)
    .map((x) => x as Rocket[])
    .map(scorePhasesProgressively);

  // Convert Individuals to EvaluatedIndividuals
  const evals = _.zip(individuals, scores).map(([ind, score]) => {
    const evalInd: EvaluatedIndividual = {
      ...ind!,
      fitness: score!,
    };
    return evalInd;
  });
  evals.sort((a, b) => b.fitness - a.fitness);

  const worst = evals[evals.length - 1];
  const best = evals[0];

  return {
    minFitness: worst.fitness,
    maxFitness: best.fitness,
    bestOverall: best,
    individuals: evals,
  };
};

export const rocketEndCondition: EndCondition = () => {
  return false;
};

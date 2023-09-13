import { Vector3 } from "three";
import { Individual, EvaluatedIndividual } from "../neat/Population";
import { Rocket, RocketConfig } from "./Rocket";
import { Simulation } from "./Simulation";
import rapier, { World } from "@dimforge/rapier3d-compat";

export const defaultRocketConfig: RocketConfig = {
  mass: 10,
  length: 2,
  radius: 0.1,
  maxAngle: Math.PI / 12,
  maxThrust: 40,
  fuelCapacity: 200,
};

export const createRocket = (
  individual?: Individual,
  config: RocketConfig = defaultRocketConfig
) => {
  return new Rocket(
    new Vector3(0, 2, 0),
    new Vector3(0, 0, 0),
    config,
    {
      target: new Vector3(50, 50, 0),
      boundsRadius: 200,
    },
    individual
  );
};

export class RocketSimulation implements Simulation<Rocket> {
  public minFitness = 0;
  public maxFitness = 0;
  public bestOverall: EvaluatedIndividual | undefined = undefined;

  private world: World | undefined = undefined;
  private rockets: Rocket[] = [];

  constructor(public readonly options: RocketConfig) {
    this.reset();
  }

  public reset() {
    this.minFitness = Number.MAX_SAFE_INTEGER;
    this.maxFitness = Number.MIN_SAFE_INTEGER;
    this.bestOverall = undefined;

    // this.world?.free();
    this.world = undefined;
    this.rockets = [];
  }

  public async init(individuals: Individual[]) {
    await rapier.init();
    let gravity = { x: 0.0, y: -9.81, z: 0.0 };
    this.world = new rapier.World(gravity);
    this.rockets = individuals.map((i) => createRocket(i));
    this.rockets.forEach((r) => r.init(this.world!));
  }

  public agents(): Rocket[] {
    return this.rockets;
  }

  public step() {
    this.world?.step(); // TODO Automate this
    this.rockets.forEach((r) => r.step());
  }

  public active() {
    return this.rockets.some((r) => r.alive);
  }

  public evaluate() {
    return this.rockets.map((r) => {
      return {
        ...r.brain!,
        fitness: r.fitness(),
      };
    });
  }
}

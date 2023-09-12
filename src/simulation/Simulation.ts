import rapier, { RigidBody } from "@dimforge/rapier3d-compat";
import { EvaluatedIndividual, Individual } from "../neat/Population";

export interface Agent {
  init: (world: rapier.World) => void;
  step: () => boolean; // returns whether to continue the simulation
  fitness: () => number;
  rigidBody?: RigidBody;
}

/**
 * Req:
 *  - Agent to render itself in Three
 *  - World/Sim to render itself
 *  - UI can attach to simulation on demand
 *  - Reuse through implementing Simulation and Agent interfaces
 *  - Have different ways of running Simulation:
 *    - Run to completion
 *    - Initialize, but allow stepping through (UI supported)
 *    - Run in realtime or slower/faster (UI supported)
 *
 *  - When UI mounts, it needs to grab the sim and mount the UI for sim and each agent
 *    - UI can drive steps and each movement
 */

export interface Simulation<T extends Agent> {
  init: (individuals: Individual[]) => Promise<void>;
  step: () => void;
  active: () => boolean; // If returns true, simulation can be run for at least one more step
  evaluate: () => EvaluatedIndividual[]; // Called after step returns false
  agents(): T[];
  reset: () => void; // cleanup resources, init will need to be called again
}

import { Canvas, useFrame } from "@react-three/fiber";
import { Agent, Simulation } from "../../simulation/Simulation";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Axes } from "./Axes";
import { useRef, FunctionComponent } from "react";
import _ from "lodash";

const TIME_SLICE = 1 / 15;

export type AgentRendererProps<T extends Agent> = {
  agent: T;
  subscribe: (onStep: () => void) => () => void; // subscribes this agent to each step being rendered, some steps may be skipped
};

export type AgentRenderer<T extends Agent> = FunctionComponent<
  AgentRendererProps<T>
>;

export type SimRendererProps<T extends Agent> = {
  sim: Simulation<T>;
  agentRenderer: AgentRenderer<T>;
};

export const SimRenderer = <T extends Agent>({
  sim,
  agentRenderer,
}: SimRendererProps<T>) => {
  const AgentComp = agentRenderer;
  const lastStepDeltaRef = useRef<number>(0);
  const callbacksRef = useRef<Set<() => void>>(new Set());

  useFrame((_, delta) => {
    // See how long since our last physics step was run
    lastStepDeltaRef.current += delta;
    const elapsed = lastStepDeltaRef.current;
    if (elapsed < TIME_SLICE) {
      return;
    }

    // If we need to run multiple phyics steps due to large delta
    const numStepsToRun = 1; //Math.floor(elapsed / TIME_SLICE);
    lastStepDeltaRef.current = elapsed % TIME_SLICE;

    let active = sim.active();
    for (let step = 0; step < numStepsToRun && active; step++) {
      sim.step();
      active = sim.active();
    }

    // Update the UI to reflect new physical state
    callbacksRef.current.forEach((cb) => cb());
  });

  // Allows agents to become aware of when a step occurs and update their
  // visual state appropriately.
  const subscribe = (onStep: () => void) => {
    callbacksRef.current.add(onStep);
    return () => {
      callbacksRef.current.delete(onStep);
    };
  };

  return (
    <>
      <PerspectiveCamera position={[0, 4, 100]} makeDefault />
      <OrbitControls target={[0, 25, 0]} dampingFactor={0.3}></OrbitControls>
      <directionalLight args={[]} position={[-10, 100, 10]} castShadow={true} />
      <Axes />

      {sim.agents().map((a, i) => (
        <AgentComp key={i} agent={a} subscribe={subscribe} />
      ))}
      {/* <TwoAxisInput onDrag={onGimbal} onRelease={onRelease} />
      <ResetBtn
        onClick={() => {
          setRockets(() => createRockets(individuals));
          setShow(false);
        }}
      />
      <Stats rocket={rockets[0]} /> */}
    </>
  );
};

import { useCallback, useEffect, useRef, useState } from "react";
import { styled } from "styled-components";
import { Button } from "../ui/Button";

import _ from "lodash";
import { Individual } from "../neat/Population";
import { SimRenderer } from "../components/three/SimRenderer";
import {
  RocketSimulation,
  createRandomTarget,
  defaultRocketConfig,
  defaultSimConfig,
} from "../simulation/RocketSimulation";
import { RocketAgentRenderer } from "../components/three/RocketAgentRenderer";
import { Canvas } from "@react-three/fiber";
import { ErrorBoundary } from "react-error-boundary";

const DivRelative = styled.div`
  position: relative;
  flex-grow: 1;
  width: 100%;
`;

const AbsPosBtn = styled(Button)`
  position: absolute;
  bottom: 15px;
  right: 127px;
`;

const ResetBtn = ({ onClick }: { onClick: () => void }) => {
  return <AbsPosBtn onClick={onClick}>Reset</AbsPosBtn>;
};

// const StatsBox = styled(Panel)`
//   position: absolute;
//   left: 15px;
//   bottom: 15px;
// `;

// export const Stats = ({ rocket }: { rocket: Rocket }) => {

//   const data = {
//     "Thrust X": r?.thrustVector.x,
//     "Thrust Y": r?.thrustVector.y,
//     "Thrust Z": r?.thrustVector.z,
//   };
//   const data2 = {
//     Fuel: r?.fuel,
//     DistanceToTarget: r?.distanceToTarget.toFixed(3),
//     Fitness: r?.fitness().toFixed(3),
//     Alive: r?.alive ? "True" : "False",
//   };
//   return (
//     <StatsBox>
//       <Column>
//         <KeyValueTable data={data} />
//         <KeyValueTable data={data2} />
//       </Column>
//     </StatsBox>
//   );
// };

export type SimulationPageProps = {
  individuals: Individual[];
};

export const SimulationPage = ({ individuals }: SimulationPageProps) => {
  const [rocketSim, setRocketSim] = useState<RocketSimulation>();

  // We need to be able to track if the sim is initialized or not
  const initializedRef = useRef(false);

  const resetSim = useCallback(() => {
    const rocketSim = new RocketSimulation(
      defaultRocketConfig,
      defaultSimConfig()
    );
    initializedRef.current = false;
    const initSim = async () => {
      await rocketSim.init(individuals);
      initializedRef.current = true;
      setRocketSim(rocketSim);
    };
    initSim();
    return rocketSim;
  }, [individuals]);

  useEffect(() => {
    const sim = resetSim();
    // Free resources when unmounting
    return () => {
      try {
        sim.reset();
      } catch (error) {
        console.error(error);
      }
    };
  }, [individuals]);

  return (
    <DivRelative>
      <ErrorBoundary fallback={<h1>Error Occured</h1>}>
        {rocketSim ? (
          <Canvas shadows>
            <SimRenderer sim={rocketSim} agentRenderer={RocketAgentRenderer} />
          </Canvas>
        ) : (
          <h1>Initializing...</h1>
        )}
        {/* <Canvas shadows>
        <PerspectiveCamera position={[0, 4, 10]} makeDefault />
        <OrbitControls
          // enableZoom={true}
          // maxPolarAngle={Math.PI / 2}
          // minPolarAngle={Math.PI / 2}
          dampingFactor={0.3}
        ></OrbitControls>
        <directionalLight
          args={[]}
          position={[-10, 100, 10]}
          castShadow={true}
        />
        <Axes />
        {show &&
          rockets.flatMap((r, i) => [
            <RocketViz key={"rocket-" + i} rocket={r} />,
            <Target key={"target-" + i} rocket={r} />,
          ])}
      </Canvas>
      <TwoAxisInput onDrag={onGimbal} onRelease={onRelease} />
      <Stats rocket={rockets[0]} /> 
        */}
        <ResetBtn onClick={resetSim} />
      </ErrorBoundary>
    </DivRelative>
  );
};

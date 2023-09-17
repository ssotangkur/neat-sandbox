import { useCallback, useEffect, useRef, useState } from "react";
import { styled } from "styled-components";
import { Button } from "../ui/Button";

import _ from "lodash";
import { Population } from "../neat/Population";
import { SimRenderer } from "../components/three/SimRenderer";
import {
  RocketSimulation,
  defaultRocketConfig,
} from "../simulation/RocketSimulation";
import { RocketAgentRenderer } from "../components/three/RocketAgentRenderer";
import { Canvas } from "@react-three/fiber";
import { ErrorBoundary } from "react-error-boundary";
import { Row } from "../ui/Row";
import { progressiveConfigs } from "../simulation/EvaluateRockets";

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

const ToggleDiv = styled.div`
  position: absolute;
  bottom: 2px;
  right: 20px;
`;

const OnlyBestToggle = ({
  onToggle,
  state,
}: {
  onToggle: () => void;
  state: boolean;
}) => {
  return (
    <ToggleDiv>
      <Row>
        <h4>Show best:&nbsp;</h4>
        <input type="checkbox" checked={state} onChange={onToggle}></input>
      </Row>
    </ToggleDiv>
  );
};

const PhaseSelectDiv = styled.div`
  position: absolute;
  bottom: 10px;
  right: 200px;
`;
const PhaseSelect = ({
  onPlus,
  onMinus,
  phase,
}: {
  onPlus: () => void;
  onMinus: () => void;
  phase: number;
}) => {
  return (
    <PhaseSelectDiv>
      <Row spacing={1}>
        <Button onClick={onPlus}>+</Button>
        <span>Phase: {phase}</span>
        <Button onClick={onMinus}>-</Button>
      </Row>
    </PhaseSelectDiv>
  );
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
  population?: Population;
};

export const SimulationPage = ({ population }: SimulationPageProps) => {
  const [rocketSim, setRocketSim] = useState<RocketSimulation>();
  const [onlyBest, setOnlyBest] = useState(false);
  const [phase, setPhase] = useState(0);

  // We need to be able to track if the sim is initialized or not
  const initializedRef = useRef(false);

  const resetSim = useCallback(() => {
    if (!population) {
      return;
    }
    const rocketSim = new RocketSimulation(
      defaultRocketConfig,
      progressiveConfigs[phase]
    );
    initializedRef.current = false;
    const initSim = async () => {
      await rocketSim.init(
        onlyBest ? [population.best] : population.individuals
      );
      console.log(population.best);
      initializedRef.current = true;
      setRocketSim(rocketSim);
    };
    initSim();
    return rocketSim;
  }, [population?.individuals, onlyBest, phase]);

  useEffect(() => {
    const sim = resetSim();
    // Free resources when unmounting
    return () => {
      try {
        sim?.reset();
      } catch (error) {
        console.error(error);
      }
    };
  }, [population?.individuals, onlyBest, phase]);

  const onPlus = () => {
    setPhase((prev) => {
      const newPhase = Math.min(progressiveConfigs.length - 1, prev + 1);
      return newPhase;
    });
  };
  const onMinus = () => {
    setPhase((prev) => Math.max(0, prev - 1));
  };

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
        <ResetBtn onClick={() => resetSim()} />
        <OnlyBestToggle
          onToggle={() => setOnlyBest((prev) => !prev)}
          state={onlyBest}
        />
        <PhaseSelect onMinus={onMinus} onPlus={onPlus} phase={phase} />
      </ErrorBoundary>
    </DivRelative>
  );
};

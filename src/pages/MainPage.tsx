import { ChangeEventHandler, useCallback, useEffect, useState } from "react";
import { EvaluatedIndividual, Population } from "../neat/Population";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { Column } from "../ui/Column";
import { Row } from "../ui/Row";
import { FullScreen } from "../ui/FullScreen";
import { Specie } from "../neat/Speciation";
import { InferenceViz } from "../components/InferenceViz";
import { Tabs } from "../ui/Tabs";
import { SpeciationPage } from "./SpeciationPage";
import { Epochs, toEpoch } from "../neat/Epoch";
import { ChartPage } from "./ChartPage";
import { SimulationPage } from "./SimulationPage";
import { OptionsPage, optionAtom } from "./options/OptionsPage";
import { ErrorBoundary } from "react-error-boundary";
import { useWorker } from "../utils/useWorker";
import { NeatMeta } from "../neat/NeatMeta";
import { useAtom } from "jotai";

const meta = new NeatMeta();
const epochs = new Epochs(meta);

type RunUntilSolutionBtnProps = {
  onClick: (runs: number) => void;
  disabled: boolean;
};

const RunUntilSolutionBtn = (props: RunUntilSolutionBtnProps) => {
  const [runs, setRuns] = useState(100);

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const r = Number(e.target.value);
    setRuns(r);
  };
  return (
    <Row spacing={1}>
      <Button onClick={() => props.onClick(runs)} disabled={props.disabled}>
        Run {runs} Generations
      </Button>
      <input value={runs} onChange={onChange}></input>
    </Row>
  );
};

export const MainPage = () => {
  const [population, setPopulation] = useState<Population>();
  const [selected, setSelected] = useState<EvaluatedIndividual>();
  const [selectedSpecie, setSelectedSpecie] = useState<Specie>();
  const [running, setRunning] = useState(false);
  const [options] = useAtom(optionAtom);

  const handleNextGen = useCallback(
    (p: Population) => {
      epochs.epochs.push(toEpoch(p));
      setPopulation(p);
    },
    [epochs]
  );

  const [_, nextGen] = useWorker("nextGeneration", handleNextGen);

  useEffect(() => {
    const setPopAsync = async () => {
      const pop = await epochs.init(options);
      setPopulation(pop);
    };
    setPopAsync();
  }, [options]);

  const onHover = useCallback(
    (i: EvaluatedIndividual) => {
      setSelected(i);
    },
    [setSelected]
  );

  const onHoverSpecie = (specie: Specie) => {
    setSelectedSpecie(specie);
  };

  const InferencePanel = (
    <Panel width="100%">
      <InferenceViz individual={selected} />
    </Panel>
  );

  const tabConfig = {
    Speciation: (
      <SpeciationPage
        onHover={onHover}
        onHoverSpecie={onHoverSpecie}
        selected={selected}
        selectedSpecie={selectedSpecie}
        population={population}
      />
    ),
    Inference: InferencePanel,
    Charts: <ChartPage epochs={epochs} />,
    Simulation: (
      <ErrorBoundary fallback={<h1>Error</h1>}>
        <SimulationPage population={population} />
      </ErrorBoundary>
    ),
    Options: <OptionsPage />,
  };

  return (
    <FullScreen>
      <Column
        $padding={1}
        spacing={1}
        $constrainchildheight
        $constrainchildwidth
        $grow
      >
        <Tabs config={tabConfig} $grow />
        <Row spacing={1} $padding={1}>
          <Button
            onClick={async () => {
              if (population && population.individuals.length > 0) {
                setRunning(true);
                nextGen(population, options);
                setRunning(false);
              }
            }}
            disabled={!!population?.foundSolution || running}
          >
            Next Gen
          </Button>
          <RunUntilSolutionBtn
            onClick={async (runs) => {
              setRunning(true);
              setPopulation(await epochs.newEpochs(options, runs));
              setRunning(false);
            }}
            disabled={population?.foundSolution || running}
          />
        </Row>
      </Column>
    </FullScreen>
  );
};

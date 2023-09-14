import { ChangeEventHandler, useCallback, useEffect, useState } from "react";
import { Individual, Population } from "../neat/Population";
import { Button } from "../ui/Button";
import { Panel } from "../ui/Panel";
import { Column } from "../ui/Column";
import { Row } from "../ui/Row";
import { FullScreen } from "../ui/FullScreen";
import { XOREndCondition, evaluateIndividuals } from "../neat/Fitness";
import { createOptions, readFromLocalStorage } from "../neat/Options";
import { Specie, SpeciesManager } from "../neat/Speciation";
import { InferenceViz } from "../components/InferenceViz";
import { Tabs } from "../ui/Tabs";
import { SpeciationPage } from "./SpeciationPage";
import { Epochs } from "../neat/Epoch";
import { ChartPage } from "./ChartPage";
import { SimulationPage } from "./SimulationPage";
import { OptionsPage } from "./options/OptionsPage";
import { ErrorBoundary } from "react-error-boundary";

// Get current options from local storage or make some as default
const { optionSet, currentOption } = readFromLocalStorage();
const optionKey = currentOption ?? Object.keys(optionSet)[0]; // Fallback to first option if undefined
let options = optionKey
  ? optionSet[optionKey]
  : createOptions({
      count: 150,
      inputs: 2,
      outputs: 1,
      evaluateIndividuals: evaluateIndividuals,
      endCondition: XOREndCondition,
    });

const speciesManager = new SpeciesManager();
const epochs = new Epochs(speciesManager);

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
  const [selected, setSelected] = useState<Individual>();
  const [selectedSpecie, setSelectedSpecie] = useState<Specie>();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const setPopAsync = async () => {
      setPopulation(await epochs.init(options));
    };
    setPopAsync();
  }, []);

  const onHover = useCallback(
    (i: Individual) => {
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
        speciesManager={speciesManager}
      />
    ),
    Inference: InferencePanel,
    Charts: <ChartPage epochs={epochs} />,
    Simulation: (
      <ErrorBoundary fallback={<h1>Error</h1>}>
        <SimulationPage
          individuals={speciesManager.species.flatMap((s) => s.population)}
        />
      </ErrorBoundary>
    ),
    Options: <OptionsPage setCurrentOptions={(o) => (options = o)} />,
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
              setRunning(true);
              setPopulation(await epochs.newEpoch(options));
              setRunning(false);
            }}
            disabled={!!population?.foundSolution || running}
          >
            Mutate Population
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

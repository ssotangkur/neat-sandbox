import { useCallback, useEffect, useState } from "react";
import {
  EvaluatedIndividual,
  Individual,
  Population,
} from "../neat/Population";
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

const epochs = new Epochs();
const speciesManager = new SpeciesManager();

export const MainPage = () => {
  const [population, setPopulation] = useState<Population>();
  const [selected, setSelected] = useState<Individual>();
  const [selectedSpecie, setSelectedSpecie] = useState<Specie>();
  const [generation, setGeneration] = useState<EvaluatedIndividual[]>();

  useEffect(() => {
    const setPopAsync = async () => {
      setPopulation(await epochs.init(options, speciesManager));
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

  const RunUntilSolutionBtn = () => (
    <Button
      onClick={async () => setPopulation(await epochs.newEpochs(options))}
      disabled={population?.foundSolution}
    >
      Run Until Solution
    </Button>
  );

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
      <SimulationPage
        individuals={speciesManager.species.flatMap((s) => s.population)}
      />
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
              setPopulation(await epochs.newEpoch(options));
            }}
            disabled={!!population?.foundSolution}
          >
            Mutate Population
          </Button>
          <RunUntilSolutionBtn />
        </Row>
      </Column>
    </FullScreen>
  );
};

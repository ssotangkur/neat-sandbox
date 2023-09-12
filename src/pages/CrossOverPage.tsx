import { useState } from "react";
import {
  initalizePopulation,
  nextGeneration,
  Individual,
} from "../neat/Population";
import { GenoTypeViz } from "../components/GenoTypeViz";
import { MultiNetViz } from "../components/MultiNetViz";
import { Button } from "../ui/Button";
import { Column } from "../ui/Column";
import { FullScreen } from "../ui/FullScreen";
import { Panel } from "../ui/Panel";
import { Row } from "../ui/Row";
import { NeuralNetViz } from "../components/NeuralNetViz";
import { XOREndCondition, XORFitness } from "../neat/Fitness";
import { createOptions } from "../neat/Options";

const options = createOptions({
  count: 2,
  inputs: 2,
  outputs: 1,
  fitnessFunction: XORFitness,
  endCondition: XOREndCondition,
});

export const CrossOverPage = () => {
  const [_, setPopulation] = useState(() => initalizePopulation(options));
  const [selected, setSelected] = useState<Individual>();
  const [child, setChild] = useState<Individual>();

  const handleCrossOver = () => {
    // const childNN = crossOver(
    //   population.individuals[0].neuralNet,
    //   0,
    //   population.individuals[1].neuralNet,
    //   1
    // );
    // const child: Individual = {
    //   neuralNet: childNN,
    //   kernel: new Kernel(childNN),
    // };

    setChild(child);
  };

  return (
    <FullScreen>
      <Column
        $padding={1}
        spacing={1}
        $constrainchildheight
        $constrainchildwidth
      >
        <Panel overflow="auto" $padding={1} $wrap>
          <MultiNetViz
            individuals={[]}
            onHover={(i) => setSelected(i)}
            selected={selected}
          />
        </Panel>
        <Panel>{child && <NeuralNetViz individual={child} />}</Panel>

        <Panel>
          <Column $constrainchildwidth $padding={1} spacing={1}>
            <Panel $constrainchildwidth>
              <GenoTypeViz />
            </Panel>
            <Panel $constrainchildwidth>
              <GenoTypeViz />
            </Panel>
            <Panel $constrainchildwidth>
              <GenoTypeViz neuralNet={child?.neuralNet} />
            </Panel>

            <Row spacing={1} $padding={1}>
              <Button
                onClick={() =>
                  setPopulation((prev) => nextGeneration(prev, options))
                }
              >
                Mutate
              </Button>
              <Button onClick={handleCrossOver}>CrossOver</Button>
            </Row>
          </Column>
        </Panel>
      </Column>
    </FullScreen>
  );
};

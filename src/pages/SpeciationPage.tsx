import { GenoTypeViz } from "../components/GenoTypeViz";
import { Individual, Population } from "../neat/Population";
import { Panel } from "../ui/Panel";
import { Column } from "../ui/Column";

import { SpeciationViz, SpeciationVizProps } from "../components/SpeciationVis";

import { Specie, SpeciesManager } from "../neat/Speciation";
import { KeyValueTable } from "../ui/KeyValueTable";
import { SpecieStatViz } from "../components/SpecieStatViz";

export type SpeciationPageProps = {
  selected?: Individual;
  selectedSpecie?: Specie;
  population?: Population;
  speciesManager: SpeciesManager;
} & SpeciationVizProps;

export const SpeciationPage = ({
  onHover,
  onHoverSpecie,
  selected,
  selectedSpecie,
  population,
  speciesManager,
}: SpeciationPageProps) => {
  const data = {
    "Max Fitness": population?.maxFitness,
    "Species Count": speciesManager.species.length,
    Population: speciesManager.getTotalPopulation(),
    Generation: population?.generation,
    "Dyn Compatability": speciesManager.dynamicCompatibilityThreshold,
    Solution: population?.foundSolution ? "true" : "false",
  };

  return (
    <Column
      $constrainchildwidth
      $padding={1}
      spacing={1}
      width="100%"
      overflow="auto"
    >
      <Panel overflow="auto" $padding={1} $grow $shrink>
        <SpeciationViz
          onHover={onHover}
          onHoverSpecie={onHoverSpecie}
          speciesManager={speciesManager}
          species={population?.species}
        />
      </Panel>
      <Panel $constrainchildwidth $overflowX="auto" $noshrink>
        <KeyValueTable data={data} />
      </Panel>
      <Panel $constrainchildwidth $overflowX="auto">
        <SpecieStatViz specie={selectedSpecie} />
      </Panel>
      <Panel $constrainchildwidth $noshrink>
        <GenoTypeViz neuralNet={selected?.neuralNet} />
      </Panel>
    </Column>
  );
};

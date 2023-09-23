import { GenoTypeViz } from "../components/GenoTypeViz";
import { EvaluatedIndividual, Population } from "../neat/Population";
import { Panel } from "../ui/Panel";
import { Column } from "../ui/Column";

import { SpeciationViz, SpeciationVizProps } from "../components/SpeciationVis";

import { Specie, getTotalPopulation } from "../neat/Speciation";
import { KeyValueTable } from "../ui/KeyValueTable";
import { SpecieStatViz } from "../components/SpecieStatViz";

export type SpeciationPageProps = {
  selected?: EvaluatedIndividual;
  selectedSpecie?: Specie;
  population?: Population;
} & SpeciationVizProps;

export const SpeciationPage = ({
  onHover,
  onHoverSpecie,
  selected,
  selectedSpecie,
  population,
}: SpeciationPageProps) => {
  const data = {
    "Max Fitness": population?.maxFitness,
    "Species Count": population?.species.length,
    Population: population?.species
      ? getTotalPopulation(population.species)
      : 0,
    Generation: population?.generation,
    "Dyn Compatability": population?.meta.dynamicCompatibilityThreshold,
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
          population={population}
        />
      </Panel>
      <Panel $constrainchildwidth $overflowX="auto" $noshrink>
        <KeyValueTable data={data} />
      </Panel>
      <Panel $constrainchildwidth $overflowX="auto">
        <SpecieStatViz specie={selectedSpecie} />
      </Panel>
      <Panel $constrainchildwidth $noshrink>
        {population?.meta ? (
          <GenoTypeViz individual={selected} meta={population.meta} />
        ) : null}
      </Panel>
    </Column>
  );
};

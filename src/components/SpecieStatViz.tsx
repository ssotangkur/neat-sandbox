import { KeyValueTable } from "../ui/KeyValueTable";
import { Specie } from "../neat/Speciation";

export type SpecieStatVizProps = {
  specie?: Specie;
};
export const SpecieStatViz = ({ specie }: SpecieStatVizProps) => {
  const data = {
    SpecieID: specie?.specieId,
    Population: specie?.population.length,
    "Max Fitness": specie?.bestSpecimen.fitness,
    "Gen No Progress": specie?.genSinceImprovement,
  };

  return <KeyValueTable data={data} />;
};

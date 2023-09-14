import { useState } from "react";
import { Column } from "../ui/Column";
import { Row } from "../ui/Row";
import { HoverAwareProps, MultiNetViz } from "./MultiNetViz";
import { Individual } from "../neat/Population";
import { Specie, SpeciesManager } from "../neat/Speciation";
import _ from "lodash";

export type SpeciationVizProps = {
  onHoverSpecie?: (specie: Specie) => void;
  speciesManager: SpeciesManager;
  species?: Specie[];
} & HoverAwareProps;

export const SpeciationViz = (props: SpeciationVizProps) => {
  const [selected, setSelected] = useState<Individual>();

  const onHover = (i: Individual) => {
    props.onHover?.(i);
    setSelected(i);
  };

  return (
    <Column spacing={1} $grow $shrink>
      {props.species &&
        props.species.map((s, i) => (
          <Row key={i} onMouseEnter={() => props.onHoverSpecie?.(s)}>
            <MultiNetViz
              {...props}
              individuals={s.population}
              onHover={onHover}
              selected={selected}
            />
          </Row>
        ))}
    </Column>
  );
};

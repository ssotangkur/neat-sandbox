import { useState } from "react";
import { Column } from "../ui/Column";
import { Row } from "../ui/Row";
import { HoverAwareProps, MultiNetViz } from "./MultiNetViz";
import { EvaluatedIndividual, Population } from "../neat/Population";
import { Specie } from "../neat/Speciation";
import _ from "lodash";

export type SpeciationVizProps = {
  onHoverSpecie?: (specie: Specie) => void;
  population?: Population;
} & HoverAwareProps;

export const SpeciationViz = (props: SpeciationVizProps) => {
  const [selected, setSelected] = useState<EvaluatedIndividual>();

  const onHover = (i: EvaluatedIndividual) => {
    props.onHover?.(i);
    setSelected(i);
  };

  if (!props.population) {
    return null;
  }
  const { species, meta } = props.population;

  return (
    <Column spacing={1} $grow $shrink>
      {species &&
        species.map((s, i) => (
          <Row key={i} onMouseEnter={() => props.onHoverSpecie?.(s)}>
            <MultiNetViz
              {...props}
              individuals={s.population}
              onHover={onHover}
              selected={selected}
              meta={meta}
            />
          </Row>
        ))}
    </Column>
  );
};

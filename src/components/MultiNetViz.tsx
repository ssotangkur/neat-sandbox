import styled from "styled-components";
import { NeuralNetViz } from "./NeuralNetViz";
import { EvaluatedIndividual } from "../neat/Population";
import { NeatMeta } from "../neat/NeatMeta";

const Bordered = styled.div<{ selected?: boolean }>`
  border: solid 1px black;
  outline: solid 4px ${(props) => (props.selected ? "blue" : "transparent")};
  flex-shrink: 0;
`;

export type HoverAwareProps = {
  onHover?: (i: EvaluatedIndividual) => void;
  offHover?: (i: EvaluatedIndividual) => void;
};

const HoverAwareNeuralNet = ({
  individual,
  meta,
  selected,
  onHover,
  offHover,
}: {
  individual: EvaluatedIndividual;
  selected?: boolean;
  meta: NeatMeta;
} & HoverAwareProps) => {
  return (
    <Bordered
      selected={selected}
      onMouseEnter={() => {
        onHover?.(individual);
      }}
      onMouseLeave={() => {
        offHover?.(individual);
      }}
    >
      <NeuralNetViz individual={individual} meta={meta} />
    </Bordered>
  );
};

export type MultiNetVixProps = {
  individuals: EvaluatedIndividual[];
  selected?: EvaluatedIndividual;
  meta: NeatMeta;
} & HoverAwareProps;

export const MultiNetViz = ({
  individuals,
  selected,
  meta,
  onHover,
  offHover,
}: MultiNetVixProps) => {
  return (
    <>
      {individuals.map((i, index) => (
        <HoverAwareNeuralNet
          key={index}
          individual={i}
          onHover={onHover}
          offHover={offHover}
          selected={i === selected}
          meta={meta}
        />
      ))}
    </>
  );
};

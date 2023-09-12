import styled from "styled-components";
import { NeuralNetViz } from "./NeuralNetViz";
import { Individual } from "../neat/Population";

const Bordered = styled.div<{ selected?: boolean }>`
  border: solid 1px black;
  outline: solid 4px ${(props) => (props.selected ? "blue" : "transparent")};
  flex-shrink: 0;
`;

export type HoverAwareProps = {
  onHover?: (i: Individual) => void;
  offHover?: (i: Individual) => void;
};

const HoverAwareNeuralNet = ({
  individual,
  selected,
  onHover,
  offHover,
}: {
  individual: Individual;
  selected?: boolean;
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
      <NeuralNetViz individual={individual} />
    </Bordered>
  );
};

export type MultiNetVixProps = {
  individuals: Individual[];
  selected?: Individual;
} & HoverAwareProps;

export const MultiNetViz = ({
  individuals,
  selected,
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
        />
      ))}
    </>
  );
};

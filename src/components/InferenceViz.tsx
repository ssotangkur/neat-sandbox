import _ from "lodash";
import { Column } from "../ui/Column";
import { Row } from "../ui/Row";
import { useState } from "react";
import { Individual } from "../neat/Population";
import { predict } from "../neat/Inference";

export type InferenceVizProps = {
  individual?: Individual;
};

export const InferenceViz = ({ individual }: InferenceVizProps) => {
  const numInputs =
    individual?.neuralNet.neurons.filter((n) => n.neuronType === "input")
      .length ?? 0;
  const [inputs, setInputs] = useState<number[]>(Array(numInputs).fill(0));

  const createOnChange = (index: number) => {
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputs((prev) => {
        const result = [...prev];
        result[index] = parseInt(e.target.value, 10);
        return result;
      });
    };
    return onChange;
  };

  const outputs = individual?.kernel ? predict(individual.kernel, inputs) : [];

  return (
    <>
      <Column>
        <Row spacing={1}>
          {_.range(numInputs).map((i) => (
            <input
              key={i}
              onChange={createOnChange(i)}
              value={inputs[i]}
            ></input>
          ))}
          {outputs}
        </Row>
      </Column>
    </>
  );
};

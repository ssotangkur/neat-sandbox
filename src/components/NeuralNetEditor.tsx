import { useState } from "react";
import { createSimpleNeuralNet } from "../neat/NeuralNetFactory";
import { NeuralNetViz } from "./NeuralNetViz";
import { GenoTypeViz } from "./GenoTypeViz";
import { styled } from "styled-components";
import { Button } from "../ui/Button";
import { addRandomLink, addRandomNode, mutateWeight } from "../neat/Mutation";
import { Kernel } from "../neat/Inference";
import { Column } from "../ui/Column";
import { Individual } from "../neat/Population";

const Container = styled.div`
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const HorizontalScrollable = styled.div`
  overflow-x: auto;
  width: 100%;
`;

const ButtonRow = styled(HorizontalScrollable)`
  padding: 0.5rem;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
`;

export const NeuralNetEditor = ({
  inputs,
  outputs,
}: {
  inputs: number;
  outputs: number;
}) => {
  const [individual, setIndividual] = useState<Individual>(() => {
    const nn = createSimpleNeuralNet(inputs, outputs);
    return {
      neuralNet: nn,
      kernel: new Kernel(nn),
    };
  });

  return (
    <Container>
      <HorizontalScrollable>
        <NeuralNetViz individual={individual} />
      </HorizontalScrollable>
      <HorizontalScrollable>
        <GenoTypeViz neuralNet={individual.neuralNet} />
      </HorizontalScrollable>
      <ButtonRow>
        <Column spacing={1}>
          <Button
            onClick={() => {
              setIndividual((prev) => {
                const nn = addRandomLink(prev.neuralNet);
                return {
                  neuralNet: nn,
                  kernel: new Kernel(nn),
                };
              });
            }}
          >
            Mutate Link
          </Button>
          <Button
            onClick={() => {
              setIndividual((prev) => {
                const nn = addRandomNode(prev.neuralNet, "sigmoid");
                return {
                  neuralNet: nn,
                  kernel: new Kernel(nn),
                };
              });
            }}
          >
            Mutate Node
          </Button>
          <Button
            onClick={() => {
              setIndividual((prev) => {
                const nn = mutateWeight(prev.neuralNet);
                return {
                  neuralNet: nn,
                  kernel: new Kernel(nn),
                };
              });
            }}
          >
            Mutate Weight
          </Button>
          <Button
            onClick={() => {
              console.log(individual.kernel.predict([1, 2, 3]));
            }}
          >
            Predict
          </Button>
        </Column>
      </ButtonRow>
    </Container>
  );
};

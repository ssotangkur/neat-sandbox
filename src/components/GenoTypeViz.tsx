import { Gene, getTopologicalKey } from "../neat/Gene";
import { styled } from "styled-components";
import { Neuron } from "../neat/Neuron";
import { Row } from "../ui/Row";
import { Column } from "../ui/Column";
import { NeatMeta, getInnovation } from "../neat/NeatMeta";
import { KeyValueTable } from "../ui/KeyValueTable";
import { EvaluatedIndividual } from "../neat/Population";

const RowNames = styled.div`
  display: flex;
  flex-direction: column;
  background-color: var(--accent-background-color);
  color: var(--accent-text-color);
  width: fit-content;
  padding: 0.5rem;
  white-space: nowrap;
  border: solid 1px black;
  align-items: start;
`;

const CellContainer = styled.div<{ $enabled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
  background-color: ${(props) => (props.$enabled ? "white" : "grey")};
  border: solid 1px black;
  padding: 0.5rem;
  white-space: nowrap;
`;

const GeneComp = ({ gene, meta }: { gene: Gene; meta: NeatMeta }) => {
  return (
    <CellContainer $enabled={gene.enabled}>
      <div>{getInnovation(gene, meta)}</div>
      <div>{getTopologicalKey(gene)}</div>
      <div>{gene.weight.toFixed(2)}</div>
      <div>{gene.enabled ? "true" : "false"}</div>
    </CellContainer>
  );
};

const NeuronComp = ({ neuron }: { neuron: Neuron }) => {
  return (
    <CellContainer $enabled={true}>
      <div>{neuron.id}</div>
      <div>{neuron.neuronType}</div>
      <div>{neuron.activation}</div>
    </CellContainer>
  );
};

export const GenoTypeViz = ({
  individual,
  meta,
}: {
  individual?: EvaluatedIndividual;
  meta: NeatMeta;
}) => {
  const genes: Gene[] = individual?.neuralNet.genes ?? [];
  const neurons: Neuron[] = individual?.neuralNet.neurons ?? [];

  const data = {
    age: individual?.age,
    fitness: individual?.fitness,
    specieId: individual?.speciesId,
  };

  return (
    <Column $constrainchildwidth>
      <Row $constrainchildwidth>
        <KeyValueTable data={data} />
      </Row>
      <Row $constrainchildwidth>
        <RowNames>
          <div>Innovation:</div>
          <div>Topology Key:</div>
          <div>Weight:</div>
          <div>Enabled:</div>
        </RowNames>
        <Row overflow="auto">
          {genes.map((gene) => (
            <GeneComp key={getInnovation(gene, meta)} gene={gene} meta={meta} />
          ))}
        </Row>
      </Row>
      <Row>
        <RowNames>
          <div>Id:</div>
          <div>NeuronType:</div>
          <div>Activation:</div>
          <div>Bias:</div>
        </RowNames>
        <Row overflow="auto">
          {neurons.map((neuron) => (
            <NeuronComp key={neuron.id} neuron={neuron} />
          ))}
        </Row>
      </Row>
    </Column>
  );
};

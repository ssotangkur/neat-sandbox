import { NeatMeta, getInnovation } from "../neat/NeatMeta";
import { getEnabledGenes } from "../neat/NeuralNet";
import { EvaluatedIndividual } from "../neat/Population";

const NODE_SIZE_PX = 30;
const WEIGHTS_WIDTH_PX = 60;
const VERTICAL_SPACING_BETWEEN_NODES_PX = 40;

// SVG* components must be children of <svg> tag
const SVGNeuronCircle = ({
  x,
  y,
  text,
  bias,
}: {
  x: number;
  y: number;
  text: string | number;
  bias?: number;
}) => {
  return (
    <>
      <circle
        cx={x}
        cy={y}
        r={NODE_SIZE_PX / 2}
        fillOpacity={1}
        fill="white"
        stroke="black"
      ></circle>
      <text
        x={x}
        y={y}
        stroke="black"
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {text}
      </text>
      <text
        x={x}
        y={y}
        stroke="black"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={0.5}
      >
        {bias}
      </text>
    </>
  );
};

const SVGWeightLine = ({
  x1,
  y1,
  x2,
  y2,
  normalizedWeight,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  normalizedWeight: number;
}) => {
  const color = normalizedWeight >= 0 ? "green" : "red";
  const thickness = Math.max(Math.abs(normalizedWeight * 10), 1);
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={thickness}
    />
  );
};

const layerHeight = (nodeCount: number) => {
  return (
    nodeCount * NODE_SIZE_PX +
    (nodeCount - 1) * VERTICAL_SPACING_BETWEEN_NODES_PX
  );
};

export type NeuralNetVizProps = {
  individual: EvaluatedIndividual;
  meta: NeatMeta;
};

export const NeuralNetViz = ({ individual, meta }: NeuralNetVizProps) => {
  const { kernel } = individual;
  if (!kernel) {
    return null;
  }
  const { neuralNet, layers } = kernel;
  const enabledGenes = getEnabledGenes(neuralNet);

  const maxNodesInAnyLayer = layers.reduce(
    (maxNodes, layerNodes) => Math.max(layerNodes.length, maxNodes),
    0
  );
  const maxHeightPx = layerHeight(maxNodesInAnyLayer);
  const widthPx =
    layers.length * NODE_SIZE_PX + (layers.length - 1) * WEIGHTS_WIDTH_PX;

  const neuronPositions: [number, [number, number]][] = [];
  layers.forEach((layer, layerIndex) => {
    const x = NODE_SIZE_PX / 2 + layerIndex * (NODE_SIZE_PX + WEIGHTS_WIDTH_PX);
    const yOffset = (maxHeightPx - layerHeight(layer.length)) / 2;
    layer.forEach((node, nodeIndex) => {
      const y =
        yOffset +
        NODE_SIZE_PX / 2 +
        nodeIndex * (NODE_SIZE_PX + VERTICAL_SPACING_BETWEEN_NODES_PX);
      neuronPositions.push([node.neuron.id, [x, y]]);
    });
  });
  const neuronPositionsMap = new Map<number, [number, number]>(neuronPositions);
  const minMaxWeight = enabledGenes.reduce(
    ({ minWeight, maxWeight }, gene) => {
      return {
        minWeight: Math.min(minWeight, gene.weight),
        maxWeight: Math.max(maxWeight, gene.weight),
      };
    },
    { minWeight: 0, maxWeight: 0 }
  );
  const denominator =
    Math.max(
      Math.abs(minMaxWeight.minWeight),
      Math.abs(minMaxWeight.maxWeight)
    ) || 1; // prevent divide by 0

  const normalizedWeightsMap = new Map(
    enabledGenes.map((gene) => {
      return [gene, gene.weight / denominator];
    })
  );

  return (
    <svg
      width={widthPx}
      height={maxHeightPx}
      viewBox={`-1 -1 ${widthPx + 2} ${maxHeightPx + 2}`}
    >
      {individual.fitness && (
        <text x={widthPx / 2} y={12} fontSize={12}>
          {individual.fitness.toFixed(2)}
        </text>
      )}
      {enabledGenes.map((gene) => {
        const startPos = neuronPositionsMap.get(gene.inNeuron);
        if (startPos == undefined) {
          console.log("No position for startPos of gene...");
          console.log(gene);
          return;
        }
        const endPos = neuronPositionsMap.get(gene.outNeuron)!;
        if (endPos == undefined) {
          console.log("No position for endPos of gene...");
          console.log(gene);
          return;
        }
        return (
          <SVGWeightLine
            key={getInnovation(gene, meta)}
            x1={startPos[0]}
            y1={startPos[1]}
            x2={endPos[0]}
            y2={endPos[1]}
            normalizedWeight={normalizedWeightsMap.get(gene)!}
          />
        );
      })}
      {[...neuronPositionsMap.entries()].map(([neuron, [x, y]]) => {
        return <SVGNeuronCircle key={neuron} x={x} y={y} text={neuron} />;
      })}
    </svg>
  );
};

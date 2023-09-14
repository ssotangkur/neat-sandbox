/**
 * Inference is responsible for taking a NeuralNet and
 * creating all the efficient data structures to do
 * predictions (aka inference) as well as the prediction
 * it self.
 */

import _ from "lodash";
import { Gene } from "./Gene";
import { Neuron, getActivationFunction } from "./Neuron";
import { NeuralNet } from "./NeuralNet";

type Node = {
  dependencies: number[];
  neuron: Neuron;
  inWeights: number[];
  inNodeIdx: number[];
  inNodes: Node[];
};

/**
 * Creates an array in the shape of
 * [
 *   [Input Nodes],
 *   [Hidden Nodes],
 *   ...,
 *   [Hidden Nodes],
 *   [Outputs Nodes],
 * ]
 *
 * Such that each layer's nodes only depend on nodes in layers preceeding it.
 *
 * @param neurons
 * @param enabledGenes
 * @returns
 */
export const segmentIntoLayers = (neurons: Neuron[], enabledGenes: Gene[]) => {
  // Create nodes so we know dependencies for each neuron
  const nodes: Node[] = neurons.map((neuron) => {
    return {
      neuron,
      dependencies: [],
      inWeights: [],
      inNodeIdx: [],
      inNodes: [],
    };
  });
  const idToNodeMap = new Map<number, Node>(
    nodes.map((node) => {
      return [node.neuron.id, node];
    })
  );
  // Update dependencies based on genes
  enabledGenes.forEach((gene) => {
    const node = idToNodeMap.get(gene.outNeuron);
    node?.dependencies.push(gene.inNeuron);
    node?.inWeights.push(gene.weight);
    const inNode = idToNodeMap.get(gene.inNeuron);
    if (inNode) {
      node?.inNodes.push(inNode);
    }
  });

  // We'll only work on nonOuputNodes for now and add all the outputs at the end
  const [outputNodes, nonOutputNodes] = _.partition(
    nodes,
    (node) => node.neuron.neuronType === "output"
  );
  // Layers are formed when all dependencies have been resolved (in prev layers)
  let [noDepsNodes, remainingNodes] = _.partition(
    nonOutputNodes,
    (node) => node.neuron.neuronType === "input"
  );
  const layers = [noDepsNodes]; // first layer
  const resolved = new Set(noDepsNodes.map((node) => node.neuron.id));

  while (remainingNodes.length) {
    const currentLayer: Node[] = [];
    const currentLayerSet = new Set();
    remainingNodes.forEach((node) => {
      if (node.dependencies.every((dependency) => resolved.has(dependency))) {
        currentLayer.push(node);
        currentLayerSet.add(node);
      }
    });

    // If there's nothing in the current layer, then we have some misconfigured genes
    if (!currentLayer.length) {
      console.error(
        "CurrentLayer should not be empty. Please check that all genes are valid"
      );
      throw Error("CurrentLayer should not be empty.");
    }

    // Remove current layer nodes from remaining nodes
    remainingNodes = remainingNodes.filter(
      (node) => !currentLayerSet.has(node)
    );
    layers.push(currentLayer);
    currentLayer.forEach((node) => resolved.add(node.neuron.id));
  }
  // now push all the outputs
  layers.push(outputNodes);

  // Once we know the layers, we can populate the inNodeIdx array in each node
  const neuronToIdxMap = new Map<number, number>();
  let idx = 0;
  layers.forEach((layer) => {
    layer.forEach((node) => {
      neuronToIdxMap.set(node.neuron.id, idx++);

      node.dependencies.forEach((neuron) => {
        const idx = neuronToIdxMap.get(neuron);
        if (idx === undefined) {
          throw Error("Index for Neuron " + neuron + " not found");
        }
        node.inNodeIdx.push(idx);
      });
    });
  });

  return layers;
};

export class Kernel {
  public layers: Node[][];

  constructor(public neuralNet: NeuralNet) {
    this.layers = segmentIntoLayers(neuralNet.neurons, neuralNet.enabledGenes);
  }

  // public predict(inputs: number[]): number[] {
  //   // Use a single array for all activations/inputs. This will become a tensor later
  //   const activations = Array(this.neuralNet.neurons.length).fill(0);
  //   const totalLayers = this.layers.length;

  //   let activationIdx = 0;
  //   for (let currentLayer = 0; currentLayer < totalLayers; currentLayer++) {
  //     if (currentLayer === 0) {
  //       // initialize with the inputs
  //       inputs.forEach((input, i) => {
  //         const activationFn = getActivationFunction(
  //           this.layers[currentLayer][i].neuron
  //         );
  //         activations[activationIdx++] = activationFn(input);
  //       });
  //       // increment activationIdx for the bias input, which acts like a hidden input
  //       activationIdx++;
  //     } else {
  //       const layer = this.layers[currentLayer];
  //       layer.forEach((node) => {
  //         // dot product weights and activations of dependencies
  //         const dotProduct = node.inWeights.reduce((sum, weight, i) => {
  //           return sum + weight * activations[node.inNodeIdx[i]];
  //         }, 0);
  //         const activationFn = getActivationFunction(node.neuron);
  //         activations[activationIdx++] = activationFn(dotProduct);
  //       });
  //     }
  //   }

  //   // get activations of output nodes
  //   return activations.slice(-1 * this.layers[this.layers.length - 1].length);
  // }
}

export const predict = (kernel: Kernel, inputs: number[]) => {
  // Use a single array for all activations/inputs. This will become a tensor later
  const activations = Array(kernel.neuralNet.neurons.length).fill(0);
  const totalLayers = kernel.layers.length;

  let activationIdx = 0;
  for (let currentLayer = 0; currentLayer < totalLayers; currentLayer++) {
    if (currentLayer === 0) {
      // initialize with the inputs
      inputs.forEach((input, i) => {
        const activationFn = getActivationFunction(
          kernel.layers[currentLayer][i].neuron
        );
        activations[activationIdx++] = activationFn(input);
      });
      // increment activationIdx for the bias input, which acts like a hidden input
      activationIdx++;
    } else {
      const layer = kernel.layers[currentLayer];
      layer.forEach((node) => {
        // dot product weights and activations of dependencies
        const dotProduct = node.inWeights.reduce((sum, weight, i) => {
          return sum + weight * activations[node.inNodeIdx[i]];
        }, 0);
        const activationFn = getActivationFunction(node.neuron);
        activations[activationIdx++] = activationFn(dotProduct);
      });
    }
  }

  // get activations of output nodes
  return activations.slice(-1 * kernel.layers[kernel.layers.length - 1].length);
};

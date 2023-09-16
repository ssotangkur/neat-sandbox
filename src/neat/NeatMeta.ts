import { Gene, getTopologicalKey } from "./Gene";

export const getInnovation = (gene: Gene, meta: NeatMeta): number => {
  return meta.geneToInnovationMap.get(getTopologicalKey(gene))!;
};

export const registerGene = (gene: Gene, meta: NeatMeta) => {
  const key = getTopologicalKey(gene);
  const innovation = meta.geneToInnovationMap.get(key);
  if (!innovation) {
    meta.geneToInnovationMap.set(key, ++meta.highestInnovation);
  }
};

export class NeatMeta {
  public highestSpecieId = 0;
  public dynamicCompatibilityThreshold: undefined | number;
  public highestInnovation = 0;
  public geneToInnovationMap = new Map<string, number>();
  // Replaces the entire population in each species with just the elites
}

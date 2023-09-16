export const getTopologicalKey = (gene: Gene) => {
  return `${gene.inNeuron}:${gene.outNeuron}`;
};

export const clone = (gene: Gene, override?: Partial<Gene>) => {
  return new Gene(
    override?.inNeuron ?? gene.inNeuron,
    override?.outNeuron ?? gene.outNeuron,
    override?.weight ?? gene.weight,
    override?.enabled ?? gene.enabled
  );
};

export class Gene {
  constructor(
    public readonly inNeuron: number,
    public readonly outNeuron: number,
    public readonly weight: number,
    public readonly enabled: boolean = true
  ) {}
}

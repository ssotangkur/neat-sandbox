export class Gene {
  private static highestInnovation = 0;
  private static geneToInnovationMap = new Map<string, number>();

  constructor(
    public readonly inNeuron: number,
    public readonly outNeuron: number,
    public readonly weight: number,
    public readonly enabled: boolean = true
  ) {
    const key = this.topologicalKey;
    // If this Gene key hasn't been seen before,
    // then it must have a new (higher) innovation number
    const innovation = Gene.geneToInnovationMap.get(key);
    if (!innovation) {
      Gene.geneToInnovationMap.set(key, ++Gene.highestInnovation);
    }
  }

  public get topologicalKey() {
    return `${this.inNeuron}:${this.outNeuron}`;
  }

  public get innovation(): number {
    return Gene.geneToInnovationMap.get(this.topologicalKey)!;
  }

  public clone(override?: Partial<Gene>) {
    return new Gene(
      override?.inNeuron ?? this.inNeuron,
      override?.outNeuron ?? this.outNeuron,
      override?.weight ?? this.weight,
      override?.enabled ?? this.enabled
    );
  }
}

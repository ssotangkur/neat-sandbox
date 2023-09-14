import { PopulationOptions } from "./Options";
import { Population, initalizePopulation, nextGeneration } from "./Population";
import { SpeciesManager } from "./Speciation";

export class Epochs {
  public epochs: Epoch[];
  public currentPopulation: Population | undefined;

  constructor(private readonly speciesManager: SpeciesManager) {
    this.epochs = [];
  }

  public async init(options: PopulationOptions) {
    if (!this.currentPopulation) {
      const newPop = await initalizePopulation(options, this.speciesManager);
      this.epochs.push(this.toEpoch(newPop));
      this.currentPopulation = newPop;
    }
    return this.currentPopulation;
  }

  private toEpoch(p: Population): Epoch {
    return {
      generation: p.generation,
      best: p.best,
      foundSolution: p.foundSolution,
      minFitness: p.minFitness,
      maxFitness: p.maxFitness,
    };
  }

  public async newEpoch(options: PopulationOptions) {
    const newPop = await nextGeneration(this.currentPopulation!, options);
    this.epochs.push(this.toEpoch(newPop));
    this.currentPopulation = newPop;
    return newPop;
  }

  public async newEpochs(options: PopulationOptions, numEpochs: number = 100) {
    let count = 0;
    let e = this.currentPopulation;
    while (!e?.foundSolution && count < numEpochs) {
      e = await this.newEpoch(options);
      count++;
    }
    return e;
  }

  public clearEpochs() {
    this.epochs = [];
  }
}

// A stripped down version of Population that we can keep in memory
export type Epoch = Omit<
  Population,
  "speciesManager" | "individuals" | "species"
>;

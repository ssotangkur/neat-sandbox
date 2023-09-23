import { NeatMeta } from "./NeatMeta";
import { PopulationOptions } from "./Options";
import { Population, initalizePopulation, nextGeneration } from "./Population";

export class Epochs {
  public epochs: Epoch[];
  public currentPopulation: Population | undefined;

  constructor(private readonly meta: NeatMeta) {
    this.epochs = [];
  }

  public async init(options: PopulationOptions) {
    this.reset();

    const newPop = await initalizePopulation(options, this.meta);
    this.epochs.push(toEpoch(newPop));
    this.currentPopulation = newPop;

    return this.currentPopulation;
  }

  public async newEpoch(options: PopulationOptions) {
    const newPop = await nextGeneration(this.currentPopulation!, options);
    // const newPop = await runWorker(
    //   "nextGeneration",
    //   this.currentPopulation!,
    //   options
    // );
    this.epochs.push(toEpoch(newPop));
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

  public reset() {
    this.epochs = [];
    this.currentPopulation = undefined;
  }
}

export const toEpoch = (p: Population): Epoch => {
  return {
    generation: p.generation,
    best: p.best,
    foundSolution: p.foundSolution,
    minFitness: p.minFitness,
    maxFitness: p.maxFitness,
    meta: p.meta,
  };
};

// A stripped down version of Population that we can keep in memory
export type Epoch = Omit<
  Population,
  "speciesManager" | "individuals" | "species"
>;

import { PopulationOptions } from "./Options";
import { Population, initalizePopulation, nextGeneration } from "./Population";
import { SpeciesManager } from "./Speciation";

export class Epochs {
  public epochs: Population[];

  constructor() {
    this.epochs = [];
  }

  public async init(
    options: PopulationOptions,
    speciesManager: SpeciesManager
  ) {
    if (this.epochs.length === 0) {
      this.epochs.push(await initalizePopulation(options, speciesManager));
    }
    return this.currentEpoch!;
  }

  public async newEpoch(options: PopulationOptions) {
    const newEpoch = await nextGeneration(this.currentEpoch!, options);
    this.epochs.push(newEpoch);
    return newEpoch;
  }

  public async newEpochs(options: PopulationOptions, numEpochs: number = 100) {
    let count = 0;
    let e = this.currentEpoch;
    while (!e?.foundSolution && count < numEpochs) {
      e = await this.newEpoch(options);
      count++;
    }
    return e;
  }

  public clearEpochs() {
    this.epochs = [];
  }

  public get currentEpoch(): Population | undefined {
    return this.epochs[this.epochs.length - 1];
  }
}

import { nextGeneration } from "../neat/Population";
import MyWorker from "../workers/asyncWorkers?worker";
import { SumFunc } from "./useWorker";

export type AsyncWorker = {
  sum: SumFunc;
  nextGeneration: typeof nextGeneration;
  terminate: () => void;
};

// Wraps a type in a Promise if it is not already a promise
export type SmartWrapPromise<T> = T extends Promise<infer P>
  ? Promise<P>
  : Promise<T>;

export const terminateAction = { action: "terminate", args: undefined };

const reserveCount = 2; // Don't clean more than these
const availableWorkers: Worker[] = [];

const getOrMakeWorker = () => {
  if (availableWorkers.length) {
    return availableWorkers.pop()!;
  }
  return new MyWorker();
};

/// Prepares worker for reuse
const cleanWorker = (worker: Worker) => {
  worker.onmessage = null;
};

/// Destroys worker to free up memory
const cleanAndKillWorker = (worker: Worker) => {
  cleanWorker(worker);
  worker.postMessage(terminateAction);
  worker.terminate();
};

const returnWorker = (worker: Worker) => {
  if (availableWorkers.length >= reserveCount) {
    cleanAndKillWorker(worker);
  } else {
    cleanWorker(worker);
    availableWorkers.push(worker);
  }
};

export const runWorker = <K extends keyof AsyncWorker>(
  func: K,
  ...args: Parameters<AsyncWorker[K]>
): SmartWrapPromise<ReturnType<AsyncWorker[K]>> => {
  const promise = new Promise<ReturnType<AsyncWorker[K]>>((resolve) => {
    const worker = getOrMakeWorker();
    worker.onmessage = (
      e: MessageEvent<Awaited<ReturnType<AsyncWorker[K]>>>
    ) => {
      resolve(e.data);
      returnWorker(worker);
    };
    const invokeMsg = {
      action: func,
      args,
    };
    worker.postMessage(invokeMsg);
  });
  return promise as SmartWrapPromise<ReturnType<AsyncWorker[K]>>;
};

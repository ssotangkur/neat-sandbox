import { useCallback, useEffect, useRef, useState } from "react";
import MyWorker from "../workers/EvalRockets?worker";
import { EvaluateIndividualsFunc } from "../neat/Options";
import { nextGeneration } from "../neat/Population";

export type HelloFunc = (a0: string) => string;
export type SumFunc = (a0: number, a1: number) => number;

export type WorkerAction = {
  Hello: HelloFunc;
  Sum: SumFunc;
  EvalRockets: EvaluateIndividualsFunc;
  nextGeneration: typeof nextGeneration;
};

export type WorkerInvocationMsg<K extends keyof WorkerAction> = {
  action: K;
  args: Parameters<WorkerAction[K]>;
};

export const useWorker = <K extends keyof WorkerAction>(
  action: K,
  callback: (results: Awaited<ReturnType<WorkerAction[K]>>) => void
): [
  ReturnType<WorkerAction[K]> | undefined,
  (...params: Parameters<WorkerAction[K]>) => void
] => {
  const [result, setResult] = useState<ReturnType<WorkerAction[K]>>();
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new MyWorker();
    workerRef.current.onmessage = (
      e: MessageEvent<Awaited<ReturnType<WorkerAction[K]>>>
    ) => {
      setResult(e.data);
      callback(e.data);
    };
    return () => {
      if (workerRef.current) {
        workerRef.current.onmessage = null;
      }
    };
  }, []);

  const invoke = useCallback((...args: Parameters<WorkerAction[K]>) => {
    const invokeMsg = {
      action,
      args,
    };
    workerRef.current?.postMessage(invokeMsg);
  }, []);

  return [result, invoke];
};

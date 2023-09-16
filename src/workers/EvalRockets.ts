import { EvaluateIndividualsFunc } from "../neat/Options";
import { nextGeneration } from "../neat/Population";
import { evaluateRockets } from "../simulation/EvaluateRockets";
import { HelloFunc, SumFunc, WorkerAction } from "../utils/useWorker";

const helloFunc: HelloFunc = (a) => a + "World";
export const sumFunc: SumFunc = (a, b) => a + b;

self.onmessage = <T extends keyof WorkerAction>(
  e: MessageEvent<{ action: T; args: Parameters<WorkerAction[T]> }>
) => {
  switch (e.data.action) {
    case "Hello":
      setTimeout(
        () =>
          self.postMessage(
            helloFunc(...(e.data.args as Parameters<HelloFunc>))
          ),
        1000
      );
      break;
    case "Sum":
      self.postMessage(sumFunc(...(e.data.args as Parameters<SumFunc>)));
      break;
    case "EvalRockets":
      evaluateRockets(
        ...(e.data.args as Parameters<EvaluateIndividualsFunc>)
      ).then((result) => self.postMessage(result));
      break;
    case "nextGeneration":
      nextGeneration(
        ...(e.data.args as Parameters<typeof nextGeneration>)
      ).then(self.postMessage);
  }
};

export default {};

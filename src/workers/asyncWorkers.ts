import { nextGeneration } from "../neat/Population";
import { AsyncWorker } from "../utils/runWorker";
import { sumFunc } from "./EvalRockets";

self.onmessage = <T extends keyof AsyncWorker>(
  e: MessageEvent<{ action: T; args: Parameters<AsyncWorker[T]> }>
) => {
  switch (e.data.action) {
    case "nextGeneration":
      nextGeneration(
        ...(e.data.args as Parameters<typeof nextGeneration>)
      ).then(self.postMessage);
      break;
    case "sum":
      self.postMessage(sumFunc(...(e.data.args as Parameters<typeof sumFunc>)));
      break;
    case "terminate":
      self.onmessage = null;
      self.close();
      break;
  }
};

export default {};

import { useEffect, useState } from "react";
import MyWorker from "../workers/EvalRockets?worker";

export const useWorker = () => {
  const [result, setResult] = useState<string>();
  const worker = new MyWorker();

  useEffect(() => {
    worker.onmessage = (e: MessageEvent<string>) => {
      console.log(e.data);
      setResult(e.data);
    };
    return () => {
      worker.onmessage = null;
    };
  });
  worker.postMessage("Hello");

  return result;
};

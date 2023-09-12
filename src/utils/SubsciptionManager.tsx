import { useEffect, useState } from "react";

export class SubscriptionManager<T> {
  private callbacks: ((value: T) => void)[] = [];
  constructor() {}

  public subscribe(callback: (value: T) => void) {
    this.callbacks.push(callback);
    const unsubscribe = () => {
      this.callbacks = [...this.callbacks.filter((cb) => cb !== callback)];
    };
    return unsubscribe;
  }

  public notify(value: T) {
    this.callbacks.forEach((cb) => cb(value));
  }
}

export const useSubscription = <T extends Object>(
  mgr: SubscriptionManager<T>,
  forceUpdate = false
) => {
  const [value, setValue] = useState<T>();
  const [_, rerender] = useState({});
  useEffect(() => {
    return mgr.subscribe((v) => {
      setValue(v);
      if (forceUpdate) {
        rerender({});
      }
    });
  }, [mgr]);
  return value;
};

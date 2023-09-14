self.onmessage = (e: MessageEvent<string>) => {
  if (e.data === "Hello") {
    setTimeout(() => self.postMessage("World"), 1000);
  }
};

export default {};

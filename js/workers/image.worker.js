self.onmessage = (event) => {
  self.postMessage({ id: event.data?.id, type: "ready", message: "Image worker scaffold is ready." });
};


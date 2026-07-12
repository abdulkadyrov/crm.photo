self.onmessage = (event) => {
  self.postMessage({ id: event.data?.id, type: "ready", message: "PDF worker scaffold is ready." });
};


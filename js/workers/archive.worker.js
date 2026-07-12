self.onmessage = (event) => {
  self.postMessage({ id: event.data?.id, type: "ready", message: "Archive worker scaffold is ready." });
};


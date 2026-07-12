import { sha256Hex } from "../services/integrity-service.js";

self.onmessage = async (event) => {
  const { id, data } = event.data || {};
  try {
    self.postMessage({ id, ok: true, sha256: await sha256Hex(data) });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error.message });
  }
};


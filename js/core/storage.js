export function readJson(key, fallback = null, storage = localStorage) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value, storage = localStorage) {
  storage.setItem(key, JSON.stringify(value));
}

export function removeItem(key, storage = localStorage) {
  storage.removeItem(key);
}

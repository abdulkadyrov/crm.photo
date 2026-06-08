export function confirmDialog(message) {
  return Promise.resolve(window.confirm(message));
}

export function promptDialog(message, fallback = "") {
  return Promise.resolve(window.prompt(message, fallback));
}

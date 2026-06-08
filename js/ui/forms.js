export function formDataObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

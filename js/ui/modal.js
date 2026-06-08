export function openModal(content, { className = "qr-panel-backdrop", labelledBy = "" } = {}) {
  const backdrop = document.createElement("div");
  backdrop.className = className;
  if (labelledBy) backdrop.setAttribute("aria-labelledby", labelledBy);
  backdrop.innerHTML = content;
  document.body.append(backdrop);
  return backdrop;
}

export function closeModal(node) {
  node?.remove();
}

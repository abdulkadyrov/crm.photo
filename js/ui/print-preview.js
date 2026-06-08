export function openPrintPreview(html) {
  const win = window.open("", "_blank");
  if (!win) return null;
  win.document.write(html);
  win.document.close();
  return win;
}

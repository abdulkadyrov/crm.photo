export function openPrintPreview(html) {
  document.querySelector("[data-print-preview-root]")?.remove();
  const root = document.createElement("div");
  root.dataset.printPreviewRoot = "";
  root.style.cssText = "position:fixed;inset:0;z-index:9999;display:grid;grid-template-rows:auto minmax(0,1fr);gap:10px;padding:12px;background:rgba(15,23,42,.7);";
  root.innerHTML = `
    <div style="display:flex;justify-content:flex-end;gap:8px;">
      <button data-print-preview-print type="button">Печать</button>
      <button data-print-preview-close type="button">Закрыть</button>
    </div>
    <iframe title="Предпросмотр печати" style="width:100%;height:100%;border:0;background:#fff;"></iframe>
  `;
  const frame = root.querySelector("iframe");
  if (frame) frame.srcdoc = html;
  root.querySelector("[data-print-preview-close]")?.addEventListener("click", () => root.remove());
  root.querySelector("[data-print-preview-print]")?.addEventListener("click", () => {
    frame?.contentWindow?.focus();
    frame?.contentWindow?.print();
  });
  document.body.append(root);
  return frame?.contentWindow || null;
}

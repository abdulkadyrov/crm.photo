export function generatePrintHtml(pagesHtml) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}.print-page{page-break-after:always;width:100vw;height:100vh;display:grid;place-items:center}.print-page img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body>${pagesHtml}</body></html>`;
}

export async function applyQrOverlay({ image, qrImage, position = "bottom-right", size = 120, margin = 10 }) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const x = position.endsWith("right") ? canvas.width - size - margin : margin;
  const y = position.startsWith("bottom") ? canvas.height - size - margin : margin;
  ctx.drawImage(qrImage, x, y, size, size);
  return canvas;
}

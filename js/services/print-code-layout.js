export function printCodeLayout(width, height, settings) {
  const size = Math.max(48, Math.min(600, Number(settings.qrPixelSize) || 72));
  const barcode = settings.codeType === 'barcode';
  const margin = Math.max(0, Math.min(300, Number.parseFloat(settings.qrMargin) || 0));
  const padding = Math.max(12, Math.round(size * 0.12));
  const codeWidth = Math.min(barcode ? size * 4 : size, width - margin * 2 - padding * 2);
  const codeHeight = Math.min(size, height - margin * 2 - padding * 2);
  const boxWidth = codeWidth + padding * 2, boxHeight = codeHeight + padding * 2;
  const position = settings.qrPosition || 'bottom-right';
  return {
    x: position.endsWith('left') ? margin : width - boxWidth - margin,
    y: position.startsWith('top') ? margin : height - boxHeight - margin,
    codeWidth, codeHeight, boxWidth, boxHeight, padding,
    opacity: Math.max(0.1, Math.min(1, Number(settings.codeOpacity) || 1))
  };
}

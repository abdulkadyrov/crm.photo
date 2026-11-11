// Crop centrally without enlarging the captured image. Portrait uses the inverse ratio.
export function cameraCrop(width, height, aspect, landscape = width > height) {
  const ratio = landscape ? aspect : 1 / aspect;
  const cropWidth = Math.min(width, height * ratio);
  const cropHeight = cropWidth / ratio;
  return { x: (width - Math.round(cropWidth)) / 2, y: (height - Math.round(cropHeight)) / 2,
    width: Math.round(cropWidth), height: Math.round(cropHeight) };
}

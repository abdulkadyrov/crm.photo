// Shared fallback for camera frames and imported photographs.
export function decodeCode128ImageData(image, library) {
  if (!library || !image?.width || !image?.height) return '';
  try {
    const luminance = new Uint8ClampedArray(image.width * image.height);
    for (let i = 0; i < luminance.length; i++) {
      const p = i * 4, alpha = image.data[p + 3] / 255;
      luminance[i] = (image.data[p] * 0.299 + image.data[p + 1] * 0.587 + image.data[p + 2] * 0.114) * alpha + 255 * (1 - alpha);
    }
    const reader = new library.MultiFormatReader();
    reader.setHints(new Map([[library.DecodeHintType.POSSIBLE_FORMATS, [library.BarcodeFormat.CODE_128]], [library.DecodeHintType.TRY_HARDER, true]]));
    const source = new library.RGBLuminanceSource(luminance, image.width, image.height);
    return reader.decodeWithState(new library.BinaryBitmap(new library.HybridBinarizer(source))).getText();
  } catch { return ''; }
}

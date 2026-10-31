export const PHOTO_A4 = Object.freeze({ width: 595.28, height: 841.89 });

export function coverImageRect(sourceWidth, sourceHeight, width, height) {
  if (![sourceWidth, sourceHeight, width, height].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error("Invalid image dimensions");
  }
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  return { x: (width - drawWidth) / 2, y: (height - drawHeight) / 2, width: drawWidth, height: drawHeight };
}

// JPEG blobs are retained directly, without decoding every page into memory at once.
export async function createPhotoPagesPdf(pages) {
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  const pageIds = [];
  let length = 0;
  function append(part) {
    const chunk = typeof part === "string" ? encoder.encode(part) : part;
    chunks.push(chunk);
    length += chunk instanceof Blob ? chunk.size : chunk.byteLength;
  }
  function object(id, parts) {
    offsets[id] = length;
    append(`${id} 0 obj\n`);
    parts.forEach(append);
    append("\nendobj\n");
  }
  append("%PDF-1.4\n");
  for await (const { jpeg, width, height } of pages) {
    if (!(jpeg instanceof Blob) || jpeg.type !== "image/jpeg" || !jpeg.size
      || ![width, height].every(value => Number.isInteger(value) && value > 0)) {
      throw new Error("Expected a JPEG page with valid pixel dimensions");
    }
    const id = 3 + pageIds.length * 3;
    pageIds.push(id);
    const contents = `q\n${PHOTO_A4.width} 0 0 ${PHOTO_A4.height} 0 0 cm\n/Photo Do\nQ`;
    object(id, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PHOTO_A4.width} ${PHOTO_A4.height}] /Resources << /XObject << /Photo ${id + 1} 0 R >> >> /Contents ${id + 2} 0 R >>`]);
    object(id + 1, [`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.size} >>\nstream\n`, jpeg, "\nendstream"]);
    object(id + 2, [`<< /Length ${encoder.encode(contents).length} >>\nstream\n${contents}\nendstream`]);
  }
  if (!pageIds.length) throw new Error("No photos to export");
  object(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  object(2, [`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] >>`]);
  const xref = length;
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let id = 1; id < offsets.length; id += 1) append(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, { type: "application/pdf" });
}

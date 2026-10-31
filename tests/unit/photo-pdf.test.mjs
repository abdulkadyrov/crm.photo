import test from "node:test";
import assert from "node:assert/strict";
import { PHOTO_A4, coverImageRect, createPhotoPagesPdf } from "../../js/services/photo-pdf-service.js";

test("cover fills A4 without margins or distortion for portrait, square and landscape photos", () => {
  for (const [width, height] of [[3072, 3840], [1000, 1000], [1920, 1080], [900, 1800]]) {
    const rect = coverImageRect(width, height, PHOTO_A4.width, PHOTO_A4.height);
    assert(rect.x <= 0 && rect.y <= 0);
    assert(rect.width >= PHOTO_A4.width - 1e-9);
    assert(rect.height >= PHOTO_A4.height - 1e-9);
    assert(Math.abs(rect.width / rect.height - width / height) < 1e-9);
    assert(Math.abs(rect.x * 2 + rect.width - PHOTO_A4.width) < 1e-9);
    assert(Math.abs(rect.y * 2 + rect.height - PHOTO_A4.height) < 1e-9);
  }
  assert.throws(() => coverImageRect(0, 100, 595, 842));
});

test("multi-page photo PDF embeds one full-bleed A4 image per page and correct binary offsets", async () => {
  const bytes = new Uint8Array([255, 216, 255, 0, 130, 255, 217]);
  let generated = 0;
  async function* pages() {
    for (let i = 0; i < 3; i++) {
      generated++;
      yield { jpeg: new Blob([bytes], { type: "image/jpeg" }), width: 2480, height: 3508 };
    }
  }
  const pdf = await createPhotoPagesPdf(pages());
  const buffer = Buffer.from(await pdf.arrayBuffer());
  const text = buffer.toString("latin1");
  assert.equal(generated, 3);
  assert.equal(pdf.type, "application/pdf");
  assert.match(text, /\/Count 3 \/Kids \[3 0 R 6 0 R 9 0 R\]/);
  assert.equal((text.match(/\/MediaBox \[0 0 595.28 841.89\]/g) || []).length, 3);
  assert.equal((text.match(/595.28 0 0 841.89 0 0 cm/g) || []).length, 3);
  const xref = Number(text.match(/startxref\n(\d+)/)[1]);
  assert.equal(buffer.subarray(xref, xref + 4).toString(), "xref");
  const entries = text.slice(xref).split("\n").slice(3, 14);
  entries.forEach((line, index) => {
    const offset = Number(line.slice(0, 10));
    assert(buffer.subarray(offset).toString("latin1").startsWith(`${index + 1} 0 obj\n`));
  });
});

test("empty or invalid page collections cannot produce a misleading PDF", async () => {
  await assert.rejects(createPhotoPagesPdf([]), /No photos/);
  await assert.rejects(createPhotoPagesPdf([{ jpeg: new Blob([], { type: "image/jpeg" }), width: 1, height: 1 }]));
  await assert.rejects(createPhotoPagesPdf([{ jpeg: new Blob(["png"], { type: "image/png" }), width: 1, height: 1 }]));
});

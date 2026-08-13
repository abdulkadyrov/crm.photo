import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  CHILD_PORTRAIT_TEMPLATES,
  SELECTED_CHILD_PORTRAIT_TEMPLATE_IDS,
  childPortraitCatalogRecord
} from "../../js/data/child-portrait-templates.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function assetFile(item, name) {
  return path.join(root, "assets", "templates", "children", item.id, name);
}

async function pngSize(file) {
  const bytes = await readFile(file);
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function webpSize(file) {
  const bytes = await readFile(file);
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
  const type = bytes.subarray(12, 16).toString("ascii");
  if (type === "VP8X") {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3)
    };
  }
  if (type === "VP8 ") {
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff
    };
  }
  if (type === "VP8L") {
    const b0 = bytes[21];
    const b1 = bytes[22];
    const b2 = bytes[23];
    const b3 = bytes[24];
    return {
      width: 1 + b0 + ((b1 & 0x3f) << 8),
      height: 1 + (b1 >> 6) + (b2 << 2) + ((b3 & 0x0f) << 10)
    };
  }
  assert.fail(`Unsupported WebP chunk ${type}`);
}

async function jpegSize(file) {
  const bytes = await readFile(file);
  assert.equal(bytes[0], 0xff);
  assert.equal(bytes[1], 0xd8);
  let offset = 2;
  while (offset < bytes.length) {
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = bytes.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  assert.fail("JPEG dimensions not found");
}

test("child portrait registry adds 40 A4 templates and keeps a balanced catalog", () => {
  assert.equal(CHILD_PORTRAIT_TEMPLATES.length, 72);
  assert.equal(new Set(CHILD_PORTRAIT_TEMPLATES.map((item) => item.id)).size, 72);
  assert.equal(CHILD_PORTRAIT_TEMPLATES.filter((item) => item.gender === "boy").length, 36);
  assert.equal(CHILD_PORTRAIT_TEMPLATES.filter((item) => item.gender === "girl").length, 36);
  assert.equal(SELECTED_CHILD_PORTRAIT_TEMPLATE_IDS.length, 64);
  const a4 = CHILD_PORTRAIT_TEMPLATES.filter((item) => item.canvas.format === "A4");
  assert.equal(a4.length, 40);
  assert.equal(a4.filter((item) => item.gender === "boy").length, 20);
  assert.equal(a4.filter((item) => item.gender === "girl").length, 20);
  assert.deepEqual(
    CHILD_PORTRAIT_TEMPLATES.filter((item) => item.enabled).map((item) => item.id).sort(),
    [...SELECTED_CHILD_PORTRAIT_TEMPLATE_IDS].sort()
  );
  for (const item of CHILD_PORTRAIT_TEMPLATES) {
    assert.ok([0, 1, 2, 3, 4].includes(item.grade));
    assert.ok(["none", "headscarf", "hijab", "traditional-hat"].includes(item.headwear));
    assert.equal(typeof item.enabled, "boolean");
    assert.ok(item.canvas.width > 0 && item.canvas.height > 0);
    assert.ok(item.canvas.previewWidth > 0 && item.canvas.previewHeight > 0);
    for (const key of ["centerX", "centerY", "width", "height", "feather"]) {
      assert.ok(item.faceGuide[key] > 0 && item.faceGuide[key] < 1, `${item.id}: ${key}`);
    }
  }
});

test("every child portrait has master, preview, face mask and matching metadata", async () => {
  for (const item of CHILD_PORTRAIT_TEMPLATES) {
    const master = assetFile(item, item.canvas.masterFile);
    const preview = assetFile(item, "preview.webp");
    const mask = assetFile(item, "face-mask.png");
    const metadata = assetFile(item, "metadata.json");
    for (const file of [master, preview, mask, metadata]) {
      assert.ok((await stat(file)).size > 0, `${item.id}: ${path.basename(file)} is empty`);
    }
    const masterSize = item.canvas.masterFile.endsWith(".jpg") ? await jpegSize(master) : await pngSize(master);
    assert.deepEqual(masterSize, { width: item.canvas.width, height: item.canvas.height });
    assert.deepEqual(await webpSize(preview), { width: item.canvas.previewWidth, height: item.canvas.previewHeight });
    assert.deepEqual(await pngSize(mask), { width: item.canvas.width, height: item.canvas.height });
    const parsed = JSON.parse(await readFile(metadata, "utf8"));
    assert.equal(parsed.id, item.id);
    assert.equal(parsed.title, item.title);
    assert.equal(parsed.enabled, item.enabled);
    assert.equal(parsed.version, item.version);
    assert.deepEqual(parsed.faceGuide, item.faceGuide);
    if (item.canvas.format === "A4") assert.deepEqual(parsed.canvas, item.canvas);
    assert.equal(parsed.aiAdapter, "face-swap-v1");
  }
});

test("child portrait templates map into the existing service catalog and montage contract", () => {
  CHILD_PORTRAIT_TEMPLATES.forEach((item, index) => {
    const service = childPortraitCatalogRecord(item, index);
    assert.equal(service.id, item.id);
    assert.equal(service.childTemplate, true);
    assert.equal(service.systemTemplate, true);
    assert.equal(service.previewSrc, item.previewSrc);
    assert.equal(service.masterSrc, item.masterSrc);
    assert.equal(service.faceMaskSrc, item.faceMaskSrc);
    assert.deepEqual(service.faceGuide, item.faceGuide);
    assert.deepEqual(service.canvas, item.canvas);
    assert.equal(service.angles[0].id, "portrait");
    assert.match(service.prompt, /Сохрани лицо/);
  });
});

test("all 40 A4 portraits are active assignable services", () => {
  const a4Services = CHILD_PORTRAIT_TEMPLATES
    .filter((item) => item.canvas.format === "A4")
    .map(childPortraitCatalogRecord);

  assert.equal(a4Services.length, 40);
  assert.equal(a4Services.filter((item) => item.gender === "boys").length, 20);
  assert.equal(a4Services.filter((item) => item.gender === "girls").length, 20);
  for (const service of a4Services) {
    assert.equal(service.enabled, true);
    assert.equal(service.childTemplate, true);
    assert.equal(service.systemTemplate, true);
    assert.equal(service.printFormat, "A4");
    assert.equal(service.angles.length, 1);
    assert.ok(service.previewSrc);
    assert.ok(service.masterSrc);
    assert.ok(service.faceMaskSrc);
  }
});

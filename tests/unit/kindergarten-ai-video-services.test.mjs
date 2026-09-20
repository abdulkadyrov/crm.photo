import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  KINDERGARTEN_AI_VIDEO_CATEGORY,
  KINDERGARTEN_AI_VIDEO_SERVICES,
  KINDERGARTEN_DEMO_CHILDREN,
  KINDERGARTEN_INTERVIEW_PROMPTS
} from "../../js/data/kindergarten-ai-video-services.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function localAsset(src) {
  return path.join(root, src.replace(/^\.\//, ""));
}

function jpegSize(bytes) {
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

test("kindergarten gallery contains ten boys and ten girls from ages three to six", async () => {
  assert.equal(KINDERGARTEN_DEMO_CHILDREN.length, 20);
  assert.equal(new Set(KINDERGARTEN_DEMO_CHILDREN.map((item) => item.id)).size, 20);
  assert.equal(KINDERGARTEN_DEMO_CHILDREN.filter((item) => item.gender === "boy").length, 10);
  assert.equal(KINDERGARTEN_DEMO_CHILDREN.filter((item) => item.gender === "girl").length, 10);
  assert.deepEqual([...new Set(KINDERGARTEN_DEMO_CHILDREN.map((item) => item.age))].sort(), [3, 4, 5, 6]);

  for (const child of KINDERGARTEN_DEMO_CHILDREN) {
    assert.ok(child.age >= 3 && child.age <= 6);
    const file = localAsset(child.src);
    assert.ok((await stat(file)).size > 100_000, `${child.id}: image is unexpectedly small`);
    const size = jpegSize(await readFile(file));
    assert.deepEqual(size, { width: 941, height: 1672 });
  }
});

test("four Seedance services include one interview and three no-dialogue stories", async () => {
  assert.equal(KINDERGARTEN_AI_VIDEO_SERVICES.length, 4);
  assert.equal(new Set(KINDERGARTEN_AI_VIDEO_SERVICES.map((item) => item.id)).size, 4);
  const interview = KINDERGARTEN_AI_VIDEO_SERVICES.find((item) => item.id === "kindergarten-video-interview");
  assert.ok(interview);
  assert.equal(interview.promptVariants.length, 20);
  assert.equal(KINDERGARTEN_INTERVIEW_PROMPTS.length, 20);

  for (const service of KINDERGARTEN_AI_VIDEO_SERVICES) {
    assert.equal(service.category, KINDERGARTEN_AI_VIDEO_CATEGORY);
    assert.equal(service.mediaKind, "video");
    assert.equal(service.durationSeconds, 15);
    assert.equal(service.videoModel, "Seedance 2.0");
    assert.equal(service.kindergartenAiVideo, true);
    assert.equal(service.systemTemplate, true);
    assert.equal(service.enabled, true);
    assert.equal(service.angles.length, 1);
    assert.equal(service.angles[0].id, "video");
    const preview = localAsset(service.previewSrc);
    assert.ok((await stat(preview)).size > 100_000, `${service.id}: preview is unexpectedly small`);
    assert.deepEqual(jpegSize(await readFile(preview)), { width: 941, height: 1672 });
  }

  const silent = KINDERGARTEN_AI_VIDEO_SERVICES.filter((item) => item.id !== interview.id);
  assert.equal(silent.length, 3);
  for (const service of silent) {
    assert.match(service.prompt, /Без речи, без голосов/);
    assert.match(service.prompt, /сохраняй возраст, форму лица/);
  }
});

test("every interview scenario has distinct exact Russian dialogue and off-camera educator", () => {
  assert.equal(new Set(KINDERGARTEN_INTERVIEW_PROMPTS.map((item) => item.title)).size, 20);
  assert.equal(new Set(KINDERGARTEN_INTERVIEW_PROMPTS.map((item) => item.prompt)).size, 20);
  for (const item of KINDERGARTEN_INTERVIEW_PROMPTS) {
    assert.match(item.prompt, /ровно 15 секунд/);
    assert.match(item.prompt, /голос за кадром/);
    assert.match(item.prompt, /Точная русская артикуляция/);
    assert.match(item.prompt, /не появляется в кадре/);
    assert.match(item.prompt, /@Image 1/);
  }
});

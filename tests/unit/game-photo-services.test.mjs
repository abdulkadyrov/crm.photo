import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { GAME_PHOTO_CATEGORY, GAME_PHOTO_SERVICES } from "../../js/data/game-photo-services.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("game photo services are assignable A4 system services", async () => {
  assert.equal(GAME_PHOTO_SERVICES.length, 4);
  assert.equal(new Set(GAME_PHOTO_SERVICES.map((item) => item.id)).size, 4);
  assert.deepEqual(GAME_PHOTO_SERVICES.map((item) => item.gender), ["boys", "boys", "boys", "girls"]);
  for (const item of GAME_PHOTO_SERVICES) {
    assert.equal(item.category, GAME_PHOTO_CATEGORY);
    assert.equal(item.price, "350");
    assert.equal(item.mediaKind, "photo");
    assert.equal(item.printFormat, "A4");
    assert.equal(item.parentPreviewMode, "print");
    assert.equal(item.gamePhotoService, true);
    assert.equal(item.systemTemplate, true);
    assert.equal(item.enabled, true);
    assert.ok((await stat(path.join(root, item.previewSrc))).size > 0);
    assert.ok((await stat(path.join(root, item.originalSrc))).size > 0);
  }
});

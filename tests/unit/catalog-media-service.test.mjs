import test from "node:test";
import assert from "node:assert/strict";
import { catalogVideoFormat, normalizeServicePrintOrientation } from "../../js/services/catalog-media-service.js";

test("service print orientation accepts auto, vertical and horizontal", () => {
  assert.equal(normalizeServicePrintOrientation("auto"), "auto");
  assert.equal(normalizeServicePrintOrientation("vertical"), "vertical");
  assert.equal(normalizeServicePrintOrientation("horizontal"), "horizontal");
  assert.equal(normalizeServicePrintOrientation("unknown"), "auto");
});

test("QuickTime videos are rejected with an actionable mobile message", () => {
  assert.equal(catalogVideoFormat({ type: "video/quicktime", name: "clip.mov" }).playable, false);
  assert.match(catalogVideoFormat({ src: "data:video/quicktime;base64,AAAA" }).message, /MP4/);
});

test("MP4 and WebM previews remain playable", () => {
  assert.equal(catalogVideoFormat({ type: "video/mp4", name: "clip.mp4" }).playable, true);
  assert.equal(catalogVideoFormat({ type: "video/webm", name: "clip.webm" }).playable, true);
});

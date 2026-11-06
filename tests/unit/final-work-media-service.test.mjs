import test from "node:test";
import assert from "node:assert/strict";
import { clampImageZoom, runWithMediaFallback } from "../../js/services/final-work-media-service.js";

test("media fallback continues after an undecodable candidate", async () => {
  const corrupt = new Blob(["corrupt"]);
  const valid = new Blob(["valid"]);
  const visited = [];
  const result = await runWithMediaFallback([
    { blob: corrupt, kind: "original" },
    { blob: valid, kind: "ready-result" }
  ], async (candidate) => {
    visited.push(candidate.kind);
    if (candidate.blob === corrupt) throw new DOMException("Could not decode", "InvalidStateError");
    return candidate.kind;
  });
  assert.equal(result, "ready-result");
  assert.deepEqual(visited, ["original", "ready-result"]);
});

test("media fallback skips duplicate blob references", async () => {
  const shared = new Blob(["same"]);
  let attempts = 0;
  await assert.rejects(
    runWithMediaFallback([{ blob: shared }, { blob: shared }], async () => {
      attempts += 1;
      throw new Error("bad image");
    }),
    /bad image/
  );
  assert.equal(attempts, 1);
});

test("media fallback throws the last decoding error", async () => {
  await assert.rejects(
    runWithMediaFallback([
      { blob: new Blob(["one"]) },
      { blob: new Blob(["two"]) }
    ], async (_candidate, index) => {
      throw new Error(`decode ${index}`);
    }),
    /decode undefined/
  );
});

test("image zoom is clamped and rejects non-numeric values", () => {
  assert.equal(clampImageZoom(0.2), 1);
  assert.equal(clampImageZoom(2.5), 2.5);
  assert.equal(clampImageZoom(9), 5);
  assert.equal(clampImageZoom("not-a-number"), 1);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../../js/core/legacy-app.js", import.meta.url), "utf8");

test("final work viewer survives A4 preparation failure and keeps result accessible", () => {
  assert.match(source, /try\s*{\s*preparedWork = await ensureFinalWorkA4Assets/);
  assert.match(source, /catch \(error\)[\s\S]*Готовую работу всё равно можно открыть и увеличить/);
  assert.match(source, /data-final-work-view="a4"/);
});

test("result, source and A4 images open the full-screen zoom viewer", () => {
  assert.match(source, /data-zoom-final-image/g);
  assert.match(source, /showImageZoom\(\{ url: image\.src/);
  assert.match(source, /mountDialogHistory\(\{ id: uid\("image-zoom"\)/);
});

test("A4 regeneration prefers a clean source before flattened legacy results", () => {
  const candidates = source.slice(
    source.indexOf("function finalWorkA4SourceCandidates("),
    source.indexOf("\nfunction cleanOriginalForCandidate(")
  );
  assert.ok(candidates.indexOf('kind: "source-media"') < candidates.indexOf('kind: "ready-result"'));
  assert.ok(candidates.indexOf('kind: "source-media"') < candidates.indexOf('kind: "merged-result"'));
  assert.match(source, /originalFinalImage: cleanOriginalForCandidate\(latestWork, candidate\)/);
});

test("A4 viewer identifies the currently rendered code type", () => {
  assert.match(source, /finalWorkPrintSettings\(\)\.codeType === "barcode" \? "Code 128" : "QR-код"/);
});

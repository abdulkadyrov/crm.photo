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

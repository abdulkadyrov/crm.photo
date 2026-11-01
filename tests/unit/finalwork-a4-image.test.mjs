import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../../js/core/legacy-app.js', import.meta.url), 'utf8');
const merged = source.slice(source.indexOf('async function buildFinalWorkMergedAsset('), source.indexOf('\nasync function drawFinalWorkQrOverlay('));
const cover = source.slice(source.indexOf('function findFinalWorkEmbeddedQr('), source.indexOf('\nasync function drawFinalWorkA4QrOverlay('));
test('ready images fill portrait and landscape A4 before downloading, preserving source proportions', async () => {
  for (const [width, height, expected] of [[1000, 1250, [2480,3508]], [1600,900,[3508,2480]]]) {
    let drawn;
    const canvas = { getContext: () => ({drawImage: (...args) => drawn = args}) };
    const output = new Blob(['prepared'], {type:'image/jpeg'});
    const context = vm.createContext({
      window: {}, A4_HORIZONTAL_PX:{width:3508,height:2480}, A4_VERTICAL_PX:{width:2480,height:3508},
      document:{createElement: () => canvas},
      loadImageForCanvas: async () => ({width,height}),
      drawFinalWorkQrOverlay: async () => {},
      canvasToImageBlob: async () => output
    });
    vm.runInContext(cover + '\n' + merged, context);
    const result = await context.buildFinalWorkMergedAsset(new Blob(['source'], {type:'image/jpeg'}), 'qr');
    assert.deepEqual([canvas.width,canvas.height], expected);
    assert(drawn[1] <= 0 && drawn[2] <= 0);
    assert(drawn[3] >= canvas.width && drawn[4] >= canvas.height);
    assert(Math.abs(drawn[3]/drawn[4] - width/height) < 1e-9);
    assert.equal(result.blob, output);
  }
});


test('an embedded corner QR stays inside the A4 crop and is not overlaid again', async () => {
  let drawn, overlays = 0;
  const canvas = { getContext: () => ({drawImage: (...args) => drawn = args}) };
  const context = vm.createContext({
    A4_HORIZONTAL_PX:{width:3508,height:2480}, A4_VERTICAL_PX:{width:2480,height:3508},
    document:{createElement: () => canvas}, loadImageForCanvas: async () => ({width:1000,height:1250}),
    drawFinalWorkQrOverlay: async () => overlays++, canvasToImageBlob: async () => new Blob(['result']),
    window: {}, finalWorkPrintSettings: () => ({qrPosition:'bottom-right'})
  });
  vm.runInContext(cover + '\n' + merged, context);
  await context.buildFinalWorkMergedAsset(new Blob(['source']), 'qr', null, true);
  assert.equal(overlays, 0);
  assert(Math.abs(drawn[1] + drawn[3] - canvas.width) <= 1);
  assert(Math.abs(drawn[2] + drawn[4] - canvas.height) <= 1);
});

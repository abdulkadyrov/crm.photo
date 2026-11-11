import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraCrop} from '../../js/services/camera-framing.js';
test('camera formats stay centered, inside the source, and keep the selected orientation', () => {
  for (const [w,h] of [[4032,3024],[3024,4032],[1920,1080]]) {
    for (const ratio of [1,4/3,16/9]) {
      const crop = cameraCrop(w,h,ratio);
      assert(Math.abs(crop.width / crop.height - (w > h ? ratio : 1/ratio)) < 0.001);
      assert(crop.width <= w && crop.height <= h);
      assert.equal(crop.x * 2 + crop.width,w);
      assert.equal(crop.y * 2 + crop.height,h);
    }
  }
});

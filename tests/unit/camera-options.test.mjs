import test from 'node:test';
import assert from 'node:assert/strict';
import {describeCamera, chooseCameraRecordingType, recordedCameraBlob} from '../../js/services/camera-options.js';
test('camera labels explain the lenses exposed by iPhone without claiming a specific sensor', () => {
 assert.equal(describeCamera('Камера на передней панели').name,'Фронтальная');
 assert.equal(describeCamera('Задняя сверхширокоугольная камера').name,'Сверхширокая');
 assert.equal(describeCamera('Задняя тройная камера').name,'Задняя · три объектива');
 assert.equal(describeCamera('Back Telephoto Camera').name,'Телекамера');
});
test('recording format must be both recordable and playable', () => {
 assert.equal(chooseCameraRecordingType(()=>true, type=>type==='video/mp4'),'video/mp4');
 assert.equal(chooseCameraRecordingType(type=>type==='video/webm',()=>true),'video/webm');
 assert.equal(chooseCameraRecordingType(()=>false,()=>true),'');
});
test('recording uses actual chunk MIME and preserves every nonempty chunk', async () => {
 const blob = recordedCameraBlob([new Blob([]),new Blob(['first'],{type:'video/mp4'}),new Blob(['last'])],'video/webm');
 assert.equal(blob.type,'video/mp4');assert.equal(await blob.text(),'firstlast');
 assert.throws(()=>recordedCameraBlob([],'video/mp4'));
});

const {snapCameraZoom, CAMERA_ZOOM_STOPS} = await import('../../js/services/camera-options.js');
test('zoom detents catch all five main stops without removing intermediate zoom', () => {
 const range = {min:.5,max:10};
 for (const stop of CAMERA_ZOOM_STOPS) {
  assert.equal(snapCameraZoom(stop*1.025,range).value,stop);
  assert.equal(snapCameraZoom(stop/1.025,range).value,stop);
 }
 assert.equal(snapCameraZoom(2.4,range).value,2.4);
});
test('zoom detents resist finger jitter and release on deliberate motion', () => {
 const range={min:.5,max:10};
 const first=snapCameraZoom(1.03,range);
 assert.equal(first.anchor,1);
 assert.equal(snapCameraZoom(1.06,range,first.anchor).value,1);
 assert.equal(snapCameraZoom(1.09,range,first.anchor).anchor,null);
 assert.equal(snapCameraZoom(.52,{min:1,max:4}).value,1);
 assert.equal(snapCameraZoom(5,{min:1,max:4}).value,4);
});

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

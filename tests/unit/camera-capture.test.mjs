import test from 'node:test';
import assert from 'node:assert/strict';
import {freezeCameraFrame,encodeCameraFrame,bindCameraShutter} from '../../js/services/camera-capture.js';
test('pixels are frozen synchronously before asynchronous JPEG encoding',async()=>{
 const video={readyState:4,videoWidth:1600,videoHeight:900,frame:'eyes-open'};
 let frozen;let draws=0;let encoded=0;
 const canvas={getContext:()=>({drawImage:(source,...crop)=>{draws++;frozen={frame:source.frame,crop};}}),toBlob:callback=>{encoded++;queueMicrotask(()=>callback(new Blob([frozen.frame])));}};
 const frame=freezeCameraFrame(video,4/3,()=>canvas);
 assert.equal(frozen.frame,'eyes-open');assert.equal(draws,1);assert.equal(encoded,0);
 assert.deepEqual([canvas.width,canvas.height],[1200,900]);
 video.frame='blink';const blob=await encodeCameraFrame(frame);
 assert.equal(await blob.text(),'eyes-open');assert.equal(encoded,1);assert.equal(draws,1);
});
test('unready stream and failed encoder report recoverable capture errors',async()=>{
 assert.throws(()=>freezeCameraFrame({readyState:1,videoWidth:0,videoHeight:0},4/3),/не готов/);
 await assert.rejects(encodeCameraFrame({toBlob:cb=>cb(null)}),/сохранить/);
});
test('pointer press captures once, while keyboard and video clicks remain available',()=>{
 const button={};let photos=true,count=0;
 bindCameraShutter(button,{shoot:()=>count++,isPhoto:()=>photos,pointerEvents:true});
 button.onpointerdown({pointerType:'touch',isPrimary:true});assert.equal(count,1);
 button.onclick({detail:1});assert.equal(count,1);
 button.onclick({detail:0});assert.equal(count,2);
 button.onpointerdown({pointerType:'mouse',button:2,isPrimary:true});assert.equal(count,2);
 button.onpointerdown({pointerType:'touch',isPrimary:false});assert.equal(count,2);
 photos=false;button.onpointerdown({pointerType:'touch',isPrimary:true});assert.equal(count,2);
 button.onclick({detail:1});assert.equal(count,3);
});
test('browsers without Pointer Events retain click capture',()=>{
 const button={};let count=0;bindCameraShutter(button,{shoot:()=>count++,isPhoto:()=>true,pointerEvents:false});
 assert.equal(button.onpointerdown,undefined);button.onclick({detail:1});assert.equal(count,1);
});

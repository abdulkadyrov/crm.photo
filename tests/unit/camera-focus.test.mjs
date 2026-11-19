import test from 'node:test';import assert from 'node:assert/strict';
import {cameraFocusPoint,createCameraFocus} from '../../js/services/camera-focus.js';
test('tap maps through portrait cover crop and rejects contain letterboxing',()=>{
 const rect={left:10,top:20,width:300,height:400};
 assert.deepEqual(cameraFocusPoint({x:160,y:220,rect,width:1920,height:1080}),{x:.5,y:.5});
 assert.equal(cameraFocusPoint({x:160,y:25,rect,width:1920,height:1080,fit:'contain'}),null);
 const p=cameraFocusPoint({x:10,y:20,rect,width:1920,height:1080});assert.ok(p.x>0&&p.x<.5);assert.equal(p.y,0);
});
test('shutter requests the selected point, preserves unrelated constraints, then allows settling before capture',async()=>{
 const events=[],messages=[];const track={readyState:'live',getCapabilities:()=>({focusMode:['continuous','single-shot']}),applyConstraints:async v=>events.push(v)};
 const focus=createCameraFocus({getTrack:()=>track,getSupported:()=>({pointsOfInterest:true}),sleep:async ms=>events.push(ms),onStatus:m=>messages.push(m)});
 await focus.tap({x:.2,y:.8});await focus.prepare();events.push('capture');
 assert.deepEqual(events,[{advanced:[{focusMode:'single-shot',pointsOfInterest:[{x:.2,y:.8}]}]},{advanced:[{focusMode:'single-shot',pointsOfInterest:[{x:.2,y:.8}]}]},500,'capture']);
 assert.equal(messages.some(m=>m.includes('недоступен')),false);
});
test('unsupported point focus is reported honestly, while auto-focus capture still waits',async()=>{
 const messages=[],events=[];const track={readyState:'live',getCapabilities:()=>({})};
 const focus=createCameraFocus({getTrack:()=>track,getSupported:()=>({}),onStatus:m=>messages.push(m),sleep:async n=>events.push(n)});
 await focus.tap({x:.5,y:.5});await focus.prepare();assert.ok(messages.some(m=>m.includes('недоступен')));assert.deepEqual(events,[500]);
});
test('closing or switching camera during focus prevents a late photograph',async()=>{
 let track={readyState:'live',getCapabilities:()=>({})};const focus=createCameraFocus({getTrack:()=>track,sleep:async()=>{track=null;}});
 await assert.rejects(focus.prepare(),/переключена/);
 focus.dispose();await assert.rejects(focus.prepare(),/выключена/);
});

test('focus updates retain camera zoom, torch and requested preview resolution',async()=>{
 let applied;const track={getCapabilities:()=>({focusMode:['continuous']}),getConstraints:()=>({width:{ideal:2560},frameRate:{ideal:30},advanced:[{torch:true,zoom:2,focusMode:'manual'}]}),applyConstraints:async v=>{applied=v;}};
 await createCameraFocus({getTrack:()=>track,getSupported:()=>({pointsOfInterest:true})}).tap({x:.4,y:.6});
 assert.deepEqual(applied,{width:{ideal:2560},frameRate:{ideal:30},advanced:[{torch:true,zoom:2},{focusMode:'continuous',pointsOfInterest:[{x:.4,y:.6}]}]});
});

test('a failed tap request can be retried by the next shutter press',async()=>{
 let calls=0;const track={readyState:'live',getCapabilities:()=>({focusMode:['single-shot']}),applyConstraints:async()=>{if(++calls===1)throw new Error('temporary camera error');}};
 const focus=createCameraFocus({getTrack:()=>track,getSupported:()=>({pointsOfInterest:true}),sleep:async()=>{}});
 await focus.tap({x:.5,y:.5});await focus.prepare();assert.equal(calls,2);
});

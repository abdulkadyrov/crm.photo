import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('async function originalPhotoForPrintReview'),source.indexOf('async function reviewFinalWorksForPrint'));
function original(media,loadRecord){return vm.runInNewContext(`(${fn})`,{Blob,mediaById:()=>media,recordSync:{loadRecord},console:{error(){}}});}
test('print review hydrates the camera source from the server, rather than displaying the generated portrait',async()=>{
 const camera=new Blob(['camera']);let requested;
 const result=await original({id:'photo',blob:{$syncBlob:'hash'}},async(store,id)=>{requested=[store,id];return {record:{blob:camera}};})({sourceMediaId:'photo',originalFinalImage:new Blob(['generated'])});
 assert.equal(result,camera);assert.deepEqual(requested,['media','photo']);
});
test('missing or failed original stays missing, never falls back to the generated picture',async()=>{
 assert.equal(await original(null)({originalFinalImage:new Blob(['generated'])}),null);
 assert.equal(await original({id:'photo',blob:{$syncBlob:'hash'}},async()=>{throw Error('offline');})({sourceMediaId:'photo'}),null);
});
test('an explicitly selected QR survives a legacy layout version',()=>{
 const fn=source.slice(source.indexOf('function finalWorkPrintSettings()'),source.indexOf('\nfunction printSettingsFromView'));
 const settings=vm.runInNewContext(`(${fn})`,{state:{data:{settings:[{id:'print',codeType:'qr',codeColor:'#d9d9d9'}]}},SETTING_IDS:{finalWorkPrint:'print'},clampNumber:(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback})();
 assert.equal(settings.codeType,'qr');assert.equal(settings.codeColor,'#d9d9d9');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../js/core/legacy-app.js', import.meta.url), 'utf8');
const functionSource = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`\n${next}`, source.indexOf(`function ${name}(`)));
const helpers = [
  functionSource('finalWorkOriginalBlob', 'function finalWorkA4SourceCandidates('),
  functionSource('finalWorkA4SourceCandidates', 'function cleanOriginalForCandidate('),
  functionSource('finalWorkSourceHasEmbeddedQr', 'function findFinalWorkEmbeddedQr(')
].join('\n');
const shoot = new Blob(['camera-original'], {type:'image/jpeg'});
const generated = new Blob(['generated-wolf-scene'], {type:'image/png'});
const printed = new Blob(['generated-wolf-with-print-code'], {type:'image/png'});
function contextFor(media = {}) {
  const context = vm.createContext({Blob, mediaById:id => media[id]});
  vm.runInContext(helpers, context);
  return context;
}

test('a ready fantasy portrait is used before its camera source and legacy shoot blob', () => {
  const context = contextFor({shoot:{blob:shoot}});
  const work = {sourceMediaId:'shoot', originalFinalImage:generated, image:printed, blob:shoot, sourceHasEmbeddedQr:false};
  assert.equal(context.finalWorkOriginalBlob(work), generated);
  assert.equal(context.finalWorkOriginalBlob({...work, originalFinalImage:null}), printed);
});

test('rendered result media wins over camera media when an imported work has no image fields', () => {
  const context = contextFor({shoot:{blob:shoot}, result:{blob:generated}});
  assert.equal(context.finalWorkOriginalBlob({sourceMediaId:'shoot',resultMediaId:'result'}), generated);
  assert.equal(context.finalWorkOriginalBlob({sourceMediaId:'shoot',mergedPrintImage:printed}), printed);
});

test('legacy embedded-code ordering uses the ready result before an original matching the shoot', () => {
  const context = contextFor({shoot:{blob:shoot}});
  assert.equal(context.finalWorkOriginalBlob({sourceMediaId:'shoot',originalFinalImage:shoot,image:printed,sourceHasEmbeddedQr:true}), printed);
  assert.equal(context.finalWorkOriginalBlob({blob:printed,sourceHasEmbeddedQr:true}), printed);
});

test('an original field matching the camera file cannot displace a finished image', () => {
  const context = contextFor({shoot:{blob:shoot}});
  const duplicateShoot = new Blob(['camera-original'], {type:'image/jpeg'});
  assert.equal(context.finalWorkOriginalBlob({sourceMediaId:'shoot',originalFinalImage:duplicateShoot,image:printed,sourceHasEmbeddedQr:false}), printed);
});

test('a camera-only work is not a finished print result', () => {
  const context = contextFor({shoot:{blob:shoot}});
  assert.equal(context.finalWorkOriginalBlob({sourceMediaId:'shoot'}), null);
  assert.equal(context.finalWorkOriginalBlob({}), null);
});

test('class print review passes the generated portrait to A4 preparation, not sourceMedia', async () => {
  const work = {id:'finished',studentId:'child',groupId:'class',sourceMediaId:'shoot',originalFinalImage:generated,image:printed,sourceHasEmbeddedQr:false};
  const context = contextFor({shoot:{blob:shoot}});
  const stop = new Error('stop after selecting the actual print image');
  let selected;
  Object.assign(context, {
    document:{querySelector:()=>null},printAssetCache:{get:async()=>null},printAssetCacheKey:'test:user',cloudDatabase:()=>"test",cloudAccount:()=>({id:'user'}),printAssetSignature:()=>"signature",
    state:{data:{finalWorks:[work]}}, classById:() => ({id:'class',name:'1а'}),
    finalWorkImageBlob:w => w.image, finalWorkA4Mode:() => 'vertical',
    finalWorkPrintSettings:() => ({codeType:'barcode'}), finalWorkArViewerUrl:() => '', finalWorkTextQrPayload:() => 'qr-payload',
    withBusy:async (_, action) => action(),
    buildFinalWorkA4Assets:async options => {selected=options;throw stop;}
  });
  const start=source.indexOf('async function reviewFinalWorksForPrint(');
  const end=source.indexOf('\nfunction finalWorkPrintPageHtml(',start);
  vm.runInContext(source.slice(start,end),context);
  await assert.rejects(context.reviewFinalWorksForPrint({classId:'class'}), error => error===stop);
  assert.equal(selected.file,generated);
  assert.equal(selected.sourceHasEmbeddedQr,false);
  assert.equal(selected.forceQr,true);
  assert.equal(selected.qrPayload,'qr-payload');
});

test('a deferred camera record never makes its raw original win over the ready template',()=>{
 const context=contextFor({shoot:{blob:{$syncBlob:'camera'}}});
 const work={sourceMediaId:'shoot',originalFinalImage:shoot,image:generated};
 assert.equal(context.finalWorkOriginalBlob(work),generated);
});
test('regenerating print layouts preserves the clean generated original',()=>{
 const begin=source.indexOf('function cleanOriginalForCandidate('),end=source.indexOf('\nasync function buildFinalWorkMergedAssetForWork(',begin);
 const context=vm.createContext({Blob,mediaById:()=>({blob:shoot})});vm.runInContext(source.slice(begin,end),context);
 assert.equal(context.cleanOriginalForCandidate({sourceMediaId:'shoot',originalFinalImage:generated},{blob:printed,sourceHasEmbeddedQr:false}),generated);
});

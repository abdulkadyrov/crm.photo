import test from 'node:test';import assert from 'node:assert/strict';import {IDBFactory} from 'fake-indexeddb';
import {createPrintAssetCache,printAssetSignature} from '../../js/services/print-asset-cache.js';
test('A4 and camera comparison survive reopening IndexedDB without network or rebuilding',async()=>{
 const factory=new IDBFactory(),assets={jpgBlob:new Blob(['ready-template']),orientation:'vertical'};
 await createPrintAssetCache('user1',factory).put('work','revision',assets,new Blob(['camera-original']));
 const cached=await createPrintAssetCache('user1',factory).get('work','revision');
 assert.equal(await cached.assets.jpgBlob.text(),'ready-template');assert.equal(await cached.original.text(),'camera-original');
 assert.equal(await createPrintAssetCache('user2',factory).get('work','revision'),null);
 assert.equal(await createPrintAssetCache('user1',factory).get('work','changed'),null);
});
test('changing result revision, QR or orientation invalidates the A4 cache',()=>{
 const work={id:'a',updatedAt:'one',a4OrientationMode:'vertical'};const key=printAssetSignature(work,{qrPixelSize:48},'qr');
 for(const [next,settings,payload] of [[{...work,updatedAt:'two'},{qrPixelSize:48},'qr'],[{...work,a4OrientationMode:'horizontal'},{qrPixelSize:48},'qr'],[work,{qrPixelSize:160},'qr'],[work,{qrPixelSize:48},'new-qr']])assert.notEqual(printAssetSignature(next,settings,payload),key);
});

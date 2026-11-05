import test from 'node:test';
import assert from 'node:assert/strict';
import {createTransferAssetLoader, isBundledTransferAsset} from '../../js/services/transfer-asset-loader.js';
const baseURI='https://example.org/crm.photo/';
test('quick backup skips only bundled assets in this installation', async()=>{
 let fetched=0;
 const load=createTransferAssetLoader({baseURI,includeBundled:false,cacheStorage:null,fetchImpl:async()=>{fetched++;return new Response('user media');}});
 assert.equal(await load('./assets/template.mp4'),null);
 assert.equal(isBundledTransferAsset('https://other.org/assets/photo.jpg',baseURI),false);
 assert.equal(isBundledTransferAsset('../assets/photo.jpg',baseURI),false);
 assert.equal(new TextDecoder().decode((await load('/uploads/photo.jpg')).bytes),'user media');
 assert.equal(fetched,1);
});
test('backup reads offline cached assets and deduplicates repeated reads',async()=>{
 let reads=0;
 const load=createTransferAssetLoader({baseURI,cacheStorage:{match:async()=>{reads++;return new Response('cached');}},fetchImpl:()=>{throw Error('network unavailable');}});
 const [a,b]=await Promise.all([load('./assets/a.jpg'),load('assets/a.jpg')]);
 assert.equal(a,b); assert.equal(reads,1);
});
test('missing or empty user files fail backup rather than silently omit data',async()=>{
 for(const response of [new Response('',{status:404}),new Response('')]){
  const load=createTransferAssetLoader({baseURI,cacheStorage:null,fetchImpl:async(_url,options)=>{assert(options.signal instanceof AbortSignal);return response;}});
  await assert.rejects(load('/uploads/photo.jpg'));
 }
});

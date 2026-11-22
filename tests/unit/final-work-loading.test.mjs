import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
const snippet=source.slice(source.indexOf('const finalWorkLoads=new Map();'),source.indexOf('\nfunction finalWorkRemoteImageUrl'));
test('concurrent final-work requests share one download and can retry after failure',async()=>{
 const work={image:{$syncBlob:'a'}};let calls=0,finish;
 const recordSync={loadRecord:()=>{calls++;return new Promise(resolve=>finish=resolve);}};
 const load=new Function('finalWorkById','hasDeferredBlobs','recordSync',snippet+';return ensureFinalWorkLoaded;')(()=>work,w=>!!w.image?.$syncBlob,recordSync);
 const a=load('work'),b=load('work');assert.equal(calls,1);
 finish({wire:{image:{$syncBlob:'a'}},record:{image:new Blob(['photo'])}});
 assert.equal(await a,work);assert.equal(await b,work);await load('work');assert.equal(calls,1);
 work.image={$syncBlob:'b'};recordSync.loadRecord=async()=>{calls++;throw new Error('offline');};await assert.rejects(load('work'),/offline/);await assert.rejects(load('work'),/offline/);assert.equal(calls,3);
});

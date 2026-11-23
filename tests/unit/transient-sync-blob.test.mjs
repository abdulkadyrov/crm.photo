import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadTransientSyncBlob} from '../../js/services/transient-sync-blob.js';
const sha256=async b=>createHash('sha256').update(new Uint8Array(await b.arrayBuffer())).digest('hex');
test('print download succeeds when local blob storage throws IOError, without persisting bytes',async()=>{
 const file=new Blob(['full resolution print pixels']);const hash=await sha256(file);let downloads=0;
 const got=await loadTransientSyncBlob(hash,{readCached:async()=>{throw new DOMException('Failed to write blobs (IOError)','UnknownError');},fetchBlob:async h=>{assert.equal(h,hash);downloads++;return file;},sha256});
 assert.equal(await got.text(),await file.text());assert.equal(downloads,1);
});
test('a transient print download still rejects corrupted server bytes',async()=>{
 await assert.rejects(loadTransientSyncBlob('expected',{readCached:async()=>null,fetchBlob:async()=>new Blob(['wrong']),sha256}),/Контрольная сумма/);
});
test('available local original avoids a network download',async()=>{
 const file=new Blob(['cached']);assert.equal(await loadTransientSyncBlob('h',{readCached:async()=>file,fetchBlob:()=>assert.fail('unexpected network'),sha256}),file);
});

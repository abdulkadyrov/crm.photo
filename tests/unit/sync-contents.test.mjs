import {test} from 'node:test';import assert from 'node:assert/strict';import {indexedDB} from 'fake-indexeddb';
import {localSyncContents,syncTransferText} from '../../js/services/sync-contents.js';
const req=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
test('local contents separates stored originals from metadata-only and empty attachments',async()=>{
 const r=indexedDB.open(crypto.randomUUID());r.onupgradeneeded=()=>{for(const name of ['projects','classes','students','orders','media'])r.result.createObjectStore(name,{keyPath:'id'});};const db=await req(r);
 const tx=db.transaction(['projects','classes','students','orders','media'],'readwrite');tx.objectStore('projects').put({id:'p'});tx.objectStore('students').put({id:'s'});
 for(const value of [{id:'photo',type:'photo',blob:new Blob(['photo'])},{id:'video',type:'video',blob:new Blob(['video'])},{id:'metadata',type:'photo',blob:{$syncBlob:'remote'}},{id:'empty',type:'photo',blob:new Blob([])}])tx.objectStore('media').put(value);
 await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
 assert.deepEqual(await localSyncContents(db),{projects:1,classes:0,students:1,orders:0,photos:1,videos:1});db.close();
});
test('transfer text distinguishes sending, school lists, receiving and absent completion time',()=>{
 assert.match(syncTransferText({phase:'send',sent:2,total:4},true),/2 из 4/);assert.match(syncTransferText({phase:'structure',scope:2,scopes:3},true),/Списки школ: 2 из 3/);
 assert.match(syncTransferText({phase:'receive',scope:1,scopes:4},true),/данные и файлы/);assert.match(syncTransferText({},false),/ещё не завершалась/);assert.match(syncTransferText({lastCheckedAt:1700000000000},false),/Последняя полная проверка/);
});

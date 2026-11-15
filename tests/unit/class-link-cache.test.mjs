import {test} from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {createClassLinkCache,currentClassLink} from '../../js/services/class-link-cache.js';
const open=()=>new Promise((resolve,reject)=>{const r=indexedDB.open(crypto.randomUUID(),1);r.onupgradeneeded=()=>r.result.createObjectStore('syncMeta',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const url='https://zakaz.khanzama.ru/p/'+'a'.repeat(43);
test('authoritative class link persists across PWA restart and skips repeat requests',async()=>{
 const db=await open();let calls=0;const load=async()=>{calls++;return {url};};
 const first=createClassLinkCache({db:()=>db,load,online:()=>true});
 assert.deepEqual(await Promise.all([first.resolve('c'),first.resolve('c')]),[url,url]);assert.equal(calls,1);
 const reloaded=createClassLinkCache({db:()=>db,load,online:()=>true});assert.equal(await reloaded.resolve('c'),url);assert.equal(calls,1);
 const offline=createClassLinkCache({db:()=>db,load:()=>{throw Error('must not fetch');},online:()=>false});assert.equal(await offline.resolve('c'),url);db.close();
});
test('old GitHub tokens and unrelated URLs are never guessed into new class links',()=>{
 for(const value of ['https://waystudia.github.io/vakha.studia/?/p/'+'a'.repeat(43),'https://example.com/p/'+'a'.repeat(43),'javascript:alert(1)'])assert.equal(currentClassLink(value),'');
 assert.equal(currentClassLink(url),url);
});

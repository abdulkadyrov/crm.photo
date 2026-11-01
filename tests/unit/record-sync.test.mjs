import {test} from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {createRecordSync} from '../../js/services/record-sync.js';
import {SYNC_STORES,SYNC_LOCAL_STORES,rebaseLocal,sha256,encodeRecord,decodeRecord} from '../../js/services/sync-codec.js';
import {createHash} from 'node:crypto';
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
const req=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const all=(db,store)=>req(db.transaction(store).objectStore(store).getAll());
const get=(db,store,id)=>req(db.transaction(store).objectStore(store).get(id));
async function database(){const r=indexedDB.open(crypto.randomUUID(),7);r.onupgradeneeded=()=>{for(const store of [...SYNC_STORES,...SYNC_LOCAL_STORES])r.result.createObjectStore(store,{keyPath:'id'});};return req(r);}
const user={id:'owner',role:'admin'};
function server(){
 const receipts=new Map(),changes=[],files=new Map();let drop=false,hook=null;
 globalThis.fetch=async(url,opts={})=>{
  const parsed=new URL(url,'https://crm.khanzama.ru'),path=parsed.pathname.replace('/api/v1','');
  const response=v=>new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json'}});
  if(path==='/me')return response(user);
  if(path==='/projects')return response([{id:'p'}]);
  if(path.startsWith('/sync/changes/')){const scope=path.split('/').at(-1),after=Number(parsed.searchParams.get('after')||0),rows=changes.filter(c=>c.scope===scope&&c.seq>after);return response({changes:rows,cursor:rows.at(-1)?.seq||after,more:false});}
  if(path.startsWith('/sync/blob/')){const hash=path.split('/').at(-1);if(opts.method==='POST'){files.set(hash,opts.body);return response({saved:true});}if(parsed.searchParams.has('check'))return response({exists:files.has(hash)});return new Response(files.get(hash));}
  if(path==='/sync/push'){
   const op=JSON.parse(opts.body);let saved=receipts.get(op.op);
   if(!saved){saved={saved:true,store:op.store,id:op.id,record:op.next,seq:changes.length+1};receipts.set(op.op,saved);changes.push({...saved,scope:op.scope});}
   if(hook){const fn=hook;hook=null;await fn(op);}
   if(drop){drop=false;throw new TypeError('response lost after commit');}return response(saved);
  }
  throw new Error(path);
 };
 return {receipts,changes,files,drop:()=>drop=true,hook:fn=>hook=fn};
}
function engine(db){return createRecordSync({db,user,enabled:true,notify:()=>{},onRemote:async()=>{}});}
test('offline edits and outbox commit together, then survive a reload and lost ACK without duplicates',async()=>{
 navigator.onLine=false;const db=await database(),s=server(),first=engine(db);
 await first.start({ui:false,background:false});
 await first.put('projects',{id:'p',name:'School'});
 await first.put('projects',{id:'p',name:'Changed offline'});
 assert.equal((await all(db,'syncQueue')).length,1);assert.equal((await get(db,'projects','p')).name,'Changed offline');
 navigator.onLine=true;s.drop();await first.sync();assert.equal((await all(db,'syncQueue')).length,1);
 const reloaded=engine(db);await reloaded.start({ui:false,background:false});
 assert.equal((await all(db,'syncQueue')).length,0);assert.equal(s.receipts.size,1);assert.equal(s.changes.length,1);db.close();
});
test('editing while upload is in flight preserves newer local data and rebases the pending operation',async()=>{
 navigator.onLine=false;const db=await database(),s=server(),client=engine(db);await client.start({ui:false,background:false});
 await client.put('projects',{id:'p',name:'first'});
 s.hook(async()=>{await client.put('projects',{id:'p',name:'second'});});navigator.onLine=true;await client.sync();
 assert.equal((await get(db,'projects','p')).name,'second');assert.equal((await all(db,'syncQueue')).length,1);
 await client.sync();assert.equal(s.changes.at(-1).record.name,'second');assert.equal((await all(db,'syncQueue')).length,0);db.close();
});
test('binary attachments retain bytes and identical files share a digest',async()=>{
 const blob=new Blob([new Uint8Array(5*1024*1024).fill(173)],{type:'image/jpeg'});
 const digest=await sha256(blob);assert.equal(digest,createHash('sha256').update(new Uint8Array(await blob.arrayBuffer())).digest('hex'));
 const objects=new Map(),encoded=await encodeRecord({id:'m',blob},async b=>{const h=await sha256(b);objects.set(h,b);return h;});
 const decoded=await decodeRecord(encoded,h=>objects.get(h));assert.equal(decoded.blob.size,blob.size);assert.equal(await sha256(decoded.blob),digest);
});
test('choosing local conflicting edits retains unrelated server changes and checklist tasks',()=>{
 const base={name:'A',note:'',items:[{id:'one',status:'pending'},{id:'two',status:'pending'}]};
 const local={...base,name:'B',items:[{id:'one',status:'done'},{id:'two',status:'pending'}]};
 const remote={...base,name:'C',note:'server note',items:[{id:'one',status:'pending'},{id:'two',status:'done'}]};
 const merged=rebaseLocal(base,local,remote);assert.equal(merged.name,'B');assert.equal(merged.note,'server note');assert.deepEqual(merged.items.map(i=>i.status),['done','done']);
});
test('a failed batch rolls back both records and their outbox entries',async()=>{
 navigator.onLine=false;const db=await database(),client=engine(db);
 await assert.rejects(client.writeBatch([{store:'projects',value:{id:'p',name:'Must roll back'}},{store:'catalog',value:{id:'bad',fn:()=>{}}}]));
 assert.equal((await all(db,'projects')).length,0);assert.equal((await all(db,'syncQueue')).length,0);db.close();
});
test('independent photo additions are retained when resolving another field conflict',()=>{
 assert.deepEqual(rebaseLocal({fileIds:['old']},{fileIds:['old','local']},{fileIds:['old','remote']}).fileIds,['old','remote','local']);
});
test('bulk child creation resolves parent records from the same atomic batch',async()=>{
 navigator.onLine=false;const db=await database(),client=engine(db);
 await client.writeBatch([
  {store:'projects',value:{id:'p',name:'School'}},
  {store:'classes',value:{id:'c',projectId:'p',name:'1A'}},
  {store:'students',value:{id:'s',classId:'c',firstName:'Test'}},
  {store:'orders',value:{id:'o',studentId:'s',items:[]}}
 ]);
 const queue=await all(db,'syncQueue');assert.equal(queue.length,4);assert.ok(queue.every(q=>q.scope==='p'));
 assert.equal((await get(db,'orders','o')).studentId,'s');db.close();
});

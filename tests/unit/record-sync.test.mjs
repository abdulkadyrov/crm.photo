import {test} from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB,IDBKeyRange} from 'fake-indexeddb';
globalThis.IDBKeyRange=IDBKeyRange;
import {createRecordSync,canApplyRemoteChanges} from '../../js/services/record-sync.js';
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
  if(path.startsWith('/sync/photo-index/')){const scope=path.split('/').at(-1),latest=new Map(changes.filter(c=>c.scope===scope&&c.store==='media').map(c=>[c.id,c.record]));return response({photos:[...latest.values()].filter(r=>r&&['photo','image'].includes(r.type)&&r.blob?.size>0).map(r=>({id:r.id,studentId:r.studentId,type:r.type,size:r.blob.size}))});}
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
test('sync engine can switch to a reopened database after the old connection closes',async()=>{
 navigator.onLine=false;const first=await database(),name=first.name,client=engine(first);first.close();
 await assert.rejects(client.put('projects',{id:'p',name:'Closed connection'}),error=>error?.name==='InvalidStateError');
 const second=await req(indexedDB.open(name,7));client.setDatabase(second);
 await client.put('projects',{id:'p',name:'Recovered'});
 assert.equal((await get(second,'projects','p')).name,'Recovered');second.close();
});

test('AR result reaches a child work with a paused video preview and waits during playback',async()=>{
 navigator.onLine=false;const db=await database(),s=server(),video={paused:true,ended:false};let refreshed=0;
 const doc={querySelector:()=>null,querySelectorAll:()=>[video]};
 const client=createRecordSync({db,user,enabled:true,notify:()=>{},canApply:()=>canApplyRemoteChanges(doc),onRemote:async()=>{refreshed++;}});
 await client.start({ui:false,background:false});
 await client.put('projects',{id:'p',name:'AR acceptance'});
 await client.put('classes',{id:'c',projectId:'p'});
 await client.put('students',{id:'child',classId:'c'});
 await client.put('finalWorks',{id:'work',studentId:'child',arStatus:'queued'});
 navigator.onLine=true;await client.sync();
 const ready={id:'work',studentId:'child',arStatus:'ready',viewerUrl:'https://khanzama.ru/ar.photo/ar/test-stable-viewer',qrPayload:'https://khanzama.ru/ar.photo/ar/test-stable-viewer'};
 s.changes.push({store:'finalWorks',id:'work',scope:'p',seq:s.changes.length+1,record:ready});
 await client.sync();assert.equal((await get(db,'finalWorks','work')).qrPayload,ready.viewerUrl);assert.equal(refreshed,1);
 video.paused=false;s.changes.push({store:'finalWorks',id:'work',scope:'p',seq:s.changes.length+1,record:{...ready,serverNote:'arrived during playback'}});
 await client.sync();assert.equal((await get(db,'finalWorks','work')).serverNote,undefined);assert.equal(refreshed,1);
 video.paused=true;await client.sync();assert.equal((await get(db,'finalWorks','work')).serverNote,'arrived during playback');assert.equal(refreshed,2);
 db.close();
});

test('unchanged server acknowledgement preserves local A4 JPEG and PDF caches',async()=>{
 navigator.onLine=false;const db=await database(),s=server(),client=engine(db);
 await client.start({ui:false,background:false});
 await client.put('projects',{id:'p',name:'Print cache'});
 await client.put('classes',{id:'c',projectId:'p'});
 await client.put('students',{id:'child',classId:'c'});
 const jpg=new Blob(['local JPG'],{type:'image/jpeg'}),pdf=new Blob(['local PDF'],{type:'application/pdf'});
 await client.put('finalWorks',{id:'work',studentId:'child',arStatus:'ready',a4PrintImage:jpg,a4PrintPdf:pdf});
 navigator.onLine=true;await client.sync();
 const saved=await get(db,'finalWorks','work');
 assert.equal(await saved.a4PrintImage.text(),'local JPG');assert.equal(await saved.a4PrintPdf.text(),'local PDF');
 const wire=s.changes.find(row=>row.store==='finalWorks').record;
 assert.equal(wire.a4PrintImage,undefined);assert.equal(wire.a4PrintPdf,undefined);
 assert.equal((await all(db,'syncQueue')).length,0);db.close();
});

test('import repairs a missing server project before uploading root attachments and children',async()=>{
 navigator.onLine=false;const db=await database();server();const fallback=globalThis.fetch;let registered=false;const calls=[];
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url,'https://crm.khanzama.ru').pathname;
  if(path==='/api/v1/projects'){
   if(opts.method==='POST'){registered=true;calls.push('register');return new Response(JSON.stringify(JSON.parse(opts.body)));}
   return new Response(JSON.stringify(registered?[{id:'imported'}]:[]));
  }
  if(path.includes('/sync/blob/')){assert.equal(registered,true,'scope exists before attachment upload');calls.push('blob');}
  return fallback(url,opts);
 };
 const client=engine(db);await client.start({ui:false,background:false});
 await client.writeBatch([{store:'projects',value:{id:'imported',name:'Imported school',cover:new Blob(['cover'])}},{store:'classes',value:{id:'class1',projectId:'imported',name:'1 А'}}]);
 navigator.onLine=true;await client.sync();assert.equal((await all(db,'syncQueue')).length,0);assert.equal(calls[0],'register');assert.ok(calls.includes('blob'));db.close();
});

test('background sync reopens a closing database and keeps the durable queue',async()=>{
 navigator.onLine=false;const db=await database();server();let reopened=0;
 const client=createRecordSync({db,user,enabled:true,onRemote:async()=>{},reconnect:async()=>{reopened++;const request=indexedDB.open(db.name,7);return req(request);}});
 await client.start({ui:false,background:false});await client.put('projects',{id:'p',name:'Survives closure'});db.close();navigator.onLine=true;await client.sync();
 assert.equal(reopened,1);const check=await req(indexedDB.open(db.name,7));assert.equal((await all(check,'syncQueue')).length,0);assert.equal((await get(check,'projects','p')).name,'Survives closure');check.close();
});

test('deleted project changes still reach a client when the active project list is empty',async()=>{
 navigator.onLine=false;const db=await database(),s=server(),original=globalThis.fetch;let deleted=false;
 globalThis.fetch=async(url,opts={})=>{
  const parsed=new URL(url,'https://crm.khanzama.ru');
  if(parsed.pathname==='/api/v1/projects'&&opts.method!=='POST')return new Response(JSON.stringify(!deleted||parsed.searchParams.get('includeDeleted')==='1'?[{id:'p'}]:[]));
  return original(url,opts);
 };
 const client=engine(db);await client.start({ui:false,background:false});await client.put('projects',{id:'p',name:'Old project'});navigator.onLine=true;await client.sync();
 deleted=true;s.changes.push({store:'projects',id:'p',scope:'p',seq:2,record:null});await client.sync();
 assert.equal(await get(db,'projects','p'),undefined);assert.equal((await all(db,'syncQueue')).length,0);db.close();
});

test('persisted IndexedDB blobs and upload acknowledgements survive reload without repeat transfer',async()=>{
 navigator.onLine=false;const db=await database(),s=server(),first=engine(db);
 let binaryRequests=0;const fetchServer=globalThis.fetch;
 globalThis.fetch=(url,options)=>{if(String(url).includes('/sync/blob/'))binaryRequests++;return fetchServer(url,options);};
 await first.start({ui:false,background:false});
 await first.writeBatch([{store:'projects',value:{id:'p',name:'School'}},{store:'classes',value:{id:'c',projectId:'p'}},{store:'students',value:{id:'s',classId:'c'}},{store:'media',value:{id:'m',studentId:'s',blob:new Blob(['original photo'],{type:'image/jpeg'})}}]);
 navigator.onLine=true;await first.sync();assert.equal(binaryRequests,2,'one existence check and one upload');
 const reloaded=engine(db);await reloaded.start({ui:false,background:false});
 const local=await get(db,'media','m');await reloaded.put('media',{...local,note:'Metadata only'});await reloaded.sync();
 assert.equal(binaryRequests,2,'metadata edit does not resend the photo or repeat its check');
 const latest=s.changes.filter(row=>row.store==='media').at(-1);
 s.changes.push({...latest,seq:s.changes.length+1,record:{...latest.record,note:'Remote edit'}});
 await reloaded.sync();assert.equal((await get(db,'media','m')).note,'Remote edit');assert.equal(binaryRequests,2,'same remote photo comes from persistent cache');
 const receipts=s.receipts.size;await reloaded.put('media',await get(db,'media','m'));await reloaded.sync();
 assert.equal(s.receipts.size,receipts,'unchanged record is not sent');assert.equal((await all(db,'syncQueue')).length,0);db.close();
});
test('existing IndexedDB photos seed cache without downloading the same bytes again',async()=>{
 navigator.onLine=false;const db=await database(),s=server(),client=engine(db);
 await client.start({ui:false,background:false});const blob=new Blob(['already on device'],{type:'image/jpeg'});
 await client.writeBatch([{store:'projects',value:{id:'p'}},{store:'classes',value:{id:'c',projectId:'p'}},{store:'students',value:{id:'s',classId:'c'}},{store:'media',value:{id:'m',studentId:'s',blob}}],{queue:false});
 const wire=await encodeRecord({id:'m',studentId:'s',blob,note:'new metadata'},sha256);
 s.changes.push({store:'media',id:'m',scope:'p',record:wire,seq:1});
 let downloads=0;const fetchServer=globalThis.fetch;globalThis.fetch=(url,opts)=>{if(String(url).includes('/sync/blob/'))downloads++;return fetchServer(url,opts);};
 navigator.onLine=true;await client.sync();assert.equal(downloads,0);assert.equal(await (await get(db,'media','m')).blob.text(),'already on device');db.close();
});
test('server missing-blob rejection invalidates upload acknowledgements and repairs the durable retry',async()=>{
 navigator.onLine=false;const db=await database(),s=server(),client=engine(db);await client.start({ui:false,background:false});
 await client.writeBatch([{store:'projects',value:{id:'p'}},{store:'classes',value:{id:'c',projectId:'p'}},{store:'students',value:{id:'s',classId:'c'}},{store:'media',value:{id:'m',studentId:'s',blob:new Blob(['recoverable'])}}]);
 navigator.onLine=true;await client.sync();const local=await get(db,'media','m');s.files.clear();
 const fetchServer=globalThis.fetch;let rejectOnce=true,uploads=0;
 globalThis.fetch=(url,opts={})=>{
  if(String(url).includes('/sync/blob/')&&opts.method==='POST')uploads++;
  if(String(url).endsWith('/sync/push')&&rejectOnce){rejectOnce=false;return Promise.resolve(new Response(JSON.stringify({error:'Missing blob'}),{status:425}));}
  return fetchServer(url,opts);
 };
 await client.put('media',{...local,note:'new'});await client.sync();assert.equal((await all(db,'syncQueue')).length,1);
 await client.sync();assert.equal(uploads,1);assert.equal((await all(db,'syncQueue')).length,0);assert.equal(s.files.size,1);db.close();
});

test('photo index is available before original download and respects pending deletes/account changes',async()=>{
 navigator.onLine=false;const db=await database(),s=server();let actor={...user};let indexSeenBeforeDownload=false;
 const photo={id:'remote-photo',studentId:'child',type:'photo',blob:{$syncBlob:'0'.repeat(64),kind:'blob',mime:'image/jpeg',size:9}};
 s.changes.push({store:'media',id:photo.id,scope:'p',seq:1,record:photo});
 const fetchServer=globalThis.fetch;
 globalThis.fetch=async(url,opts)=>{if(String(url).includes('/sync/blob/')){indexSeenBeforeDownload=client.photoIndex().length===1;throw new TypeError('simulate original download offline');}return fetchServer(url,opts);};
 const client=createRecordSync({db,user:()=>actor,enabled:true,notify:()=>{},onRemote:async()=>{}});
 await client.start({ui:false,background:false});navigator.onLine=true;await client.sync();
 assert(indexSeenBeforeDownload);assert.equal((await all(db,'media')).length,0);
 assert.deepEqual(client.photoIndex(),[{id:'remote-photo',studentId:'child',type:'photo',size:9}]);
 navigator.onLine=false;
 const offline=createRecordSync({db,user:()=>actor,enabled:true,notify:()=>{},onRemote:async()=>{}});
 await offline.start({ui:false,background:false});assert.equal(offline.photoIndex().length,1,'metadata survives offline reload without original blob');

 await req(db.transaction('syncMeta','readwrite').objectStore('syncMeta').put({id:'entity:media:'+photo.id,scope:'p',record:photo,seq:1}));
 navigator.onLine=false;await client.del('media',photo.id);assert.equal(client.photoIndex().length,0);
 const afterDelete=createRecordSync({db,user:()=>actor,enabled:true,notify:()=>{},onRemote:async()=>{}});await afterDelete.start({ui:false,background:false});assert.equal(afterDelete.photoIndex().length,0,'offline pending deletion overrides persisted server index');
 actor={id:'other-account',role:'admin'};assert.equal(client.photoIndex().length,0);
 db.close();
});

test('all assigned schools load their structure before attachments and a feed exceeds twenty pages',async()=>{
 navigator.onLine=true;const db=await database(),s=server(),baseFetch=globalThis.fetch;let blobRequested=false;
 const pages=[];
 globalThis.fetch=async(url,opts={})=>{
  const parsed=new URL(url,'https://crm.khanzama.ru'),path=parsed.pathname.replace('/api/v1','');
  const response=v=>new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json'}});
  if(path==='/projects')return response([{id:'p'},{id:'second'},{id:'third'}]);
  if(path.startsWith('/sync/changes/')){
   const scope=path.split('/').at(-1),after=Number(parsed.searchParams.get('after')||0),structure=parsed.searchParams.has('structure');
   if(structure){
    pages.push(scope+':'+after);
    const total=scope==='p'?2105:1,end=Math.min(total,after+100),changes=[];
    for(let i=after+1;i<=end;i++)changes.push({store:i===1?'projects':'students',id:i===1?scope:scope+'-'+i,scope,seq:i,record:i===1?{id:scope,name:scope}:{id:scope+'-'+i,classId:'c',firstName:'Student'}});
    return response({changes,cursor:end,more:end<total});
   }
   assert.ok(await get(db,'projects','third'),'third school exists before full asset feed');
   assert.ok(await get(db,'students','p-2105'),'no artificial twenty-page truncation');
   if(scope==='global')return response({changes:[{store:'catalog',id:'file',scope,seq:1,record:{id:'file',blob:{$syncBlob:'a'.repeat(64),size:1,mime:'image/jpeg'}}}],cursor:1,more:false});
   return response({changes:[],cursor:after,more:false});
  }
  if(path.startsWith('/sync/blob/')){blobRequested=true;throw new TypeError('Slow media connection');}
  return baseFetch(url,opts);
 };
 const client=engine(db);await client.start({ui:false,background:false});
 assert.equal((await all(db,'projects')).length,3);assert.ok(pages.includes('p:2000'));assert.ok(blobRequested);db.close();
});
test('deferred receive never claims completion and read-only saving dialog permits receive',async()=>{
 const seen=[];let editable=true;const doc={querySelector:selector=>{seen.push(selector);return editable?{}:null;},querySelectorAll:()=>[]};
 assert.equal(canApplyRemoteChanges(doc),false);editable=false;assert.equal(canApplyRemoteChanges(doc),true);assert.match(seen[0],/dialog\[open\]:not\(\.sync-dialog\)/);
 navigator.onLine=true;const db=await database();server();let allowed=false,button;
 const previous=globalThis.document;globalThis.document={createElement:()=>({}),querySelector:()=>({append:value=>{button=value;}})};
 try{
  const client=createRecordSync({db,user,enabled:true,canApply:()=>allowed});await client.start({ui:true,background:false});
  assert.match(button.textContent,/Получение данных отложено/);
  allowed=true;await client.sync();assert.equal(button.textContent,'Сохранено онлайн');
 }finally{globalThis.document=previous;db.close();}
});

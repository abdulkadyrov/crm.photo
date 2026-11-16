import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB,IDBKeyRange} from 'fake-indexeddb';
import {createRecordSync} from '../../js/services/record-sync.js';
import {SYNC_STORES,SYNC_LOCAL_STORES,sha256} from '../../js/services/sync-codec.js';
import {hasDeferredBlobs,mergeDeferredRecord,deferredFinalImageUrl} from '../../js/services/deferred-final-work.js';
globalThis.IDBKeyRange=IDBKeyRange;
const req=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const get=(db,s,id)=>req(db.transaction(s).objectStore(s).get(id));
async function database(){const r=indexedDB.open(crypto.randomUUID(),7);r.onupgradeneeded=()=>{for(const s of [...SYNC_STORES,...SYNC_LOCAL_STORES])r.result.createObjectStore(s,{keyPath:'id'});};return req(r);}
test('fresh admin receives ready works before originals/global feed; opens only requested files',async()=>{
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
 const blob=new Blob(['approved-finished-portrait'],{type:'image/png'}),hash=await sha256(blob),ref={$syncBlob:hash,size:blob.size,mime:blob.type,kind:'blob'};
 const work={id:'work',projectId:'p',groupId:'c',studentId:'s',serviceId:'princess',status:'ready',image:ref,originalFinalImage:ref,mergedPrintImage:ref};
 const rows=[['projects',{id:'p'}],['classes',{id:'c',projectId:'p'}],['students',{id:'s',classId:'c'}],['finalWorks',work]].map(([store,record],i)=>({store,id:record.id,scope:'p',seq:i+1,record}));
 const db=await database();let fileRequests=0,shownBeforeBulk=false,pushed;
 const reply=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json'}});
 const previous=globalThis.fetch;
 globalThis.fetch=async(url,opts={})=>{
  const u=new URL(url,'https://crm.khanzama.ru'),path=u.pathname.replace('/api/v1','');
  if(path==='/me')return reply({id:'admin',role:'admin'});
  if(path==='/projects')return reply([{id:'p'}]);
  if(path.startsWith('/sync/photo-index/'))return reply({photos:[]});
  if(path==='/sync/push'){pushed=JSON.parse(opts.body);return reply({saved:true,seq:5,record:pushed.next});}
  if(path.startsWith('/sync/changes/')){
   if(u.searchParams.get('results')==='metadata')return reply({changes:rows.filter(r=>r.seq>Number(u.searchParams.get('after'))),cursor:4,more:false});
   if(u.searchParams.has('structure'))return reply({changes:[],cursor:4,more:false});
   shownBeforeBulk=Boolean(await get(db,'finalWorks','work'));return reply({error:'Large unrelated feed unavailable'},500);
  }
  if(path.startsWith('/sync/blob/')){fileRequests++;return new Response(blob);}
  throw new Error(path);
 };
 try{
  const engine=createRecordSync({db,user:{id:'admin',role:'admin'},enabled:true,onRemote:async()=>{}});await engine.start({ui:false,background:false});
  const saved=await get(db,'finalWorks','work');assert.ok(shownBeforeBulk);assert.equal(saved.image.$syncBlob,hash);assert.equal(fileRequests,0);assert.match(deferredFinalImageUrl(saved),new RegExp('/sync/blob/p/'+hash));
  const loaded=await engine.loadRecord('finalWorks','work');assert.equal(fileRequests,1);assert.ok(loaded.record.image instanceof Blob);assert.equal(await sha256(loaded.record.image),hash);assert.equal(loaded.wire.image.$syncBlob,hash);
  await engine.put('finalWorks',{...saved,status:'printed'});await engine.sync();assert.equal(pushed.next.status,'printed');assert.deepEqual(pushed.next.image,ref);assert.deepEqual(pushed.base.image,ref);
 }finally{globalThis.fetch=previous;db.close();}
});
test('metadata refresh retains cached offline images and A4 only while their identities match',()=>{
 const ref={$syncBlob:'a'.repeat(64)},blob=new Blob(['cached']),a4=new Blob(['A4']);const base={id:'w',image:ref};
 const same=mergeDeferredRecord({...base,status:'printed'},{...base,image:blob,a4PrintImage:a4},base);assert.equal(same.image,blob);assert.equal(same.a4PrintImage,a4);assert.equal(hasDeferredBlobs(same),false);
 const changed=mergeDeferredRecord({id:'w',image:{$syncBlob:'b'.repeat(64)}},{...base,image:blob,a4PrintImage:a4},base);assert.equal(changed.image.$syncBlob,'b'.repeat(64));assert.equal(changed.a4PrintImage,undefined);assert.equal(hasDeferredBlobs(changed),true);
 assert.equal(deferredFinalImageUrl({projectId:'../../evil',image:ref}),'');
});
test('ready result cards render authenticated server images and hydrate files without replacing newer metadata',async()=>{
 const {readFileSync}=await import('node:fs');const vm=await import('node:vm');const source=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
 const hash='a'.repeat(64),ref={$syncBlob:hash},wire={id:'w',projectId:'p',image:ref,status:'ready'},blob=new Blob(['approved']);
 const context=vm.createContext({Blob,URL,hasDeferredBlobs,deferredFinalImageUrl,finalWorkById:()=>wire,classById:()=>null,document:{querySelector:()=>null},withBusy:async(_,action)=>action(),recordSync:{loadRecord:async()=>({wire:{...wire,image:ref},record:{...wire,image:blob}})},finalWorkTitle:()=> 'Princess',finalWorkImageBlob:()=>null,escapeAttr:x=>String(x),escapeHtml:x=>String(x),finalWorkStatusClass:()=> 'ready',finalWorkStatusLabel:()=> 'Готов'});
 const helperStart=source.indexOf('async function ensureFinalWorkLoaded('),helperEnd=source.indexOf('\nfunction finalWorkImageBlob(',helperStart);vm.runInContext(source.slice(helperStart,helperEnd),context);
 const cardStart=source.indexOf('function finalResultCard('),cardEnd=source.indexOf('\nfunction finalPrintA4Card(',cardStart);vm.runInContext(source.slice(cardStart,cardEnd),context);
 assert.match(context.finalResultCard(wire),new RegExp('src="/api/v1/sync/blob/p/'+hash+'"'));assert.doesNotMatch(context.finalResultCard(wire),/Нет preview/);
 const loaded=await context.ensureFinalWorkLoaded('w');assert.equal(loaded.image,blob);assert.equal(loaded.status,'ready');
});

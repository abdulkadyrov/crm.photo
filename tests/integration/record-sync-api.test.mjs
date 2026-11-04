import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {indexedDB} from 'fake-indexeddb';
import {createRecordSync} from '../../js/services/record-sync.js';
import {SYNC_STORES,SYNC_LOCAL_STORES} from '../../js/services/sync-codec.js';
const read=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const get=(db,s,id)=>read(db.transaction(s).objectStore(s).get(id));
const all=(db,s)=>read(db.transaction(s).objectStore(s).getAll());
async function database(){const r=indexedDB.open(crypto.randomUUID(),7);r.onupgradeneeded=()=>[...SYNC_STORES,...SYNC_LOCAL_STORES].forEach(s=>r.result.createObjectStore(s,{keyPath:'id'}));return read(r);}
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
test('two real API clients reconcile offline payments, notes, photos and conflicts with lost responses',async()=>{
 const temp=await mkdtemp(path.join(tmpdir(),'crm-sync-e2e-'));
 const child=spawn('python3',['tests/server/sync_fixture.py'],{env:{...process.env,CRM_DATA_DIR:temp},stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',b=>stderr+=b);
 const rawFetch=globalThis.fetch;let cookie='',drop=false;
 const databases=[];
 try{
  const port=await new Promise((resolve,reject)=>{child.stdout.once('data',b=>resolve(Number(String(b).trim())));child.once('error',reject);child.once('exit',code=>reject(new Error('fixture '+code+stderr)));});
  const origin='http://127.0.0.1:'+port;
  async function login(role){const r=await rawFetch(origin+'/api/v1/login',{method:'POST',headers:{Origin:'https://crm.khanzama.ru','Content-Type':'application/json'},body:JSON.stringify({login:role,password:'Integration-only-password'})});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
  const ownerCookie=await login('admin'),workerCookie=await login('photographer');
  globalThis.fetch=async(url,options={})=>{
   if(String(url).startsWith('data:'))return rawFetch(url,options);
   const response=await rawFetch(new URL(url,origin),{...options,headers:{...options.headers,Origin:'https://crm.khanzama.ru',Cookie:cookie}});
   if(drop&&String(url).endsWith('/sync/push')&&response.ok){drop=false;await response.text();throw new TypeError('lost successful response');}return response;
  };
  async function client(role,session){const db=await database();databases.push(db);const sync=createRecordSync({db,user:{id:role,role},enabled:true,notify:()=>{}});cookie=session;await sync.start({ui:false,background:false});return {db,sync,session};}
  const owner=await client('admin',ownerCookie);
  const project={id:'p',name:'School'},group={id:'g',projectId:'p',name:'1A'},student={id:'s',classId:'g',firstName:'Иван',lastName:'Тестовый',comment:'',paymentStatus:'unpaid',paidAmount:0},order={id:'o',studentId:'s',items:[{type:'portrait',status:'pending',fileIds:[]}]};
  await owner.sync.writeBatch([['projects',project],['classes',group],['students',student],['orders',order]].map(([store,value])=>({store,value})));
  await owner.sync.sync();assert.equal((await all(owner.db,'syncQueue')).length,0);
  const worker=await client('photographer',workerCookie);assert.equal((await get(worker.db,'students','s')).firstName,'Иван');assert.equal((await get(worker.db,'students','s')).paidAmount,undefined);
  navigator.onLine=false;
  const base=await get(worker.db,'students','s');await worker.sync.put('students',{...base,paymentStatus:'paid'},base);
  const image=new Blob(['real-api-image-bytes'],{type:'image/jpeg'});await worker.sync.put('media',{id:'m',studentId:'s',blob:image});
  const oldOrder=await get(worker.db,'orders','o');await worker.sync.put('orders',{...oldOrder,items:[{type:'portrait',status:'done',fileIds:['m']}]},oldOrder);
  await owner.sync.put('students',{...student,comment:'Записано владельцем офлайн'},student);
  navigator.onLine=true;cookie=workerCookie;drop=true;await worker.sync.sync();assert.ok((await all(worker.db,'syncQueue')).length>0);await worker.sync.sync();assert.deepEqual(await all(worker.db,'syncQueue'),[]);
  cookie=ownerCookie;await owner.sync.sync();assert.equal((await all(owner.db,'syncQueue')).length,0);
  const merged=await get(owner.db,'students','s');assert.equal(merged.comment,'Записано владельцем офлайн');assert.equal(merged.paymentStatus,'paid');assert.equal(merged.paidAmount,0);assert.equal(await(await get(owner.db,'media','m')).blob.text(),'real-api-image-bytes');
  const other=await client('admin',ownerCookie);const b=await get(other.db,'students','s');await owner.sync.put('students',{...merged,firstName:'Имя А'},merged);await owner.sync.sync();
  await other.sync.put('students',{...b,firstName:'Имя Б'},b);await other.sync.sync();const q=(await all(other.db,'syncQueue'))[0];assert.ok(q.conflict);assert.equal((await get(other.db,'students','s')).firstName,'Имя Б');
  await other.sync.resolveConflict(q,'local');await other.sync.sync();assert.equal((await all(other.db,'syncQueue')).length,0);assert.equal((await all(other.db,'syncHistory')).length,1);await owner.sync.sync();assert.equal((await get(owner.db,'students','s')).firstName,'Имя Б');
  const history=await(await globalThis.fetch('/api/v1/sync/changes/p')).json();assert.equal(history.changes.filter(v=>v.store==='media'&&v.id==='m').length,1);
 }finally{globalThis.fetch=rawFetch;for(const db of databases)db.close();const exit=once(child,'exit');child.kill();await exit;await rm(temp,{recursive:true,force:true});}
});

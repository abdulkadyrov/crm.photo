import {mountProjectProgress} from './sync-project-progress.js';
import {syncTransferText} from './sync-contents.js';
import {syncPanelState} from './sync-panel-state.js';
import {SYNC_STORES,SYNC_LOCAL_STORES,encodeRecord,decodeRecord,sha256,rebaseLocal} from './sync-codec.js';
import {createSyncBlobCache} from './sync-blob-cache.js';
import {captureDialogReturn} from './dialog-return.js';
export {SYNC_LOCAL_STORES};
export function canApplyRemoteChanges(doc) {
 if(doc.querySelector('dialog[open]:not(.sync-dialog), [role="dialog"]:not(.sync-dialog), input:focus, textarea:focus, select:focus, form[data-sync-editing], .transfer-import-backdrop'))return false;
 return !Array.from(doc.querySelectorAll('video')).some(video=>!video.paused&&!video.ended);
}
const keyOf=(store,id)=>store+':'+id;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Сохранение отменено'));});
const result=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
export function createRecordSync({db,user,enabled,notify,onRemote,canApply=()=>true,prepareRecord=async(store,value)=>value,reconnect}) {
 let running=false,started=false,background=true,changed=false,timer,status='Изменения сохраняются на устройстве',button;
 const blobs=new Map(),downloads=new Map(),blobCache=createSyncBlobCache(()=>db);
 let activity={phase:'idle',sent:0,received:0,downloaded:0,lastCheckedAt:null};
 const get=(store,id)=>result(db.transaction(store).objectStore(store).get(id));
 const all=store=>result(db.transaction(store).objectStore(store).getAll());
 const account=()=>typeof user==='function'?user():user;
 let photoActor='',photoScopes=new Map(),photoDeletes=new Set(),photoIndexChanged=false;
 const actorKey=()=>{const actor=account();return actor?actor.id+':'+actor.role:'';};
 function resetPhotoAccount(){const actor=actorKey();if(actor!==photoActor){photoActor=actor;photoScopes.clear();photoDeletes.clear();photoIndexChanged=false;}return actor;}
 function photoIndex(){resetPhotoAccount();return [...photoScopes.values()].flat().filter(item=>!photoDeletes.has(item.id));}
 const photoCachePrefix=actor=>'photo-index:'+encodeURIComponent(actor)+':';
 async function restorePhotoIndex(){
  const actor=resetPhotoAccount(),prefix=photoCachePrefix(actor);
  const cached=await result(db.transaction('syncMeta').objectStore('syncMeta').getAll(IDBKeyRange.bound(prefix,prefix+'\uffff')));
  if(actor!==actorKey()){resetPhotoAccount();return;}
  photoScopes=new Map(cached.map(row=>[row.scope,row.photos||[]]));
  photoDeletes=new Set((await all('syncQueue')).filter(q=>q.actor===account()?.id&&q.store==='media'&&q.deleted).map(q=>q.rid));
  if(photoScopes.size){photoIndexChanged=true;if(canApply()){await onRemote?.();photoIndexChanged=false;}}
 }
 async function persistPhotoIndex(actor){
  const prefix=photoCachePrefix(actor),cached=await result(db.transaction('syncMeta').objectStore('syncMeta').getAllKeys(IDBKeyRange.bound(prefix,prefix+'\uffff')));
  if(actor!==actorKey()){resetPhotoAccount();return;}
  const tx=db.transaction('syncMeta','readwrite'),complete=done(tx),store=tx.objectStore('syncMeta');
  for(const id of cached)if(!photoScopes.has(String(id).slice(prefix.length)))store.delete(id);
  for(const [scope,photos] of photoScopes)store.put({id:prefix+scope,scope,photos});
  await complete;
 }

 async function refreshPhotoIndex(scopes){
  const actor=resetPhotoAccount();
  photoDeletes=new Set((await all('syncQueue')).filter(q=>q.actor===account()?.id&&q.store==='media'&&q.deleted).map(q=>q.rid));
  const next=new Map();
  for(const scope of scopes){
   try {const reply=await json(`/sync/photo-index/${scope}`);if(reply.photos?.length)next.set(scope,reply.photos);}
   catch(error){if(![403,404].includes(error.status))throw error;}
   if(actor!==actorKey()){resetPhotoAccount();throw new Error('Аккаунт или роль изменились. Перезагрузите CRM; очередь сохранена.');}
  }
  if(JSON.stringify([...photoScopes])!==JSON.stringify([...next]))photoIndexChanged=true;
  photoScopes=next;
  await persistPhotoIndex(actor);
  if(photoIndexChanged&&canApply()){await onRemote?.();photoIndexChanged=false;}
 }

 async function api(path,body){
  const response=await fetch('/api/v1'+path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(body instanceof Blob||path.startsWith('/sync/blob/')?600000:30000),headers:body&&!(body instanceof Blob)?{'Content-Type':'application/json'}:{},body:body instanceof Blob?body:body?JSON.stringify(body):undefined});
  if(!response.ok){const error=new Error((await response.json().catch(()=>({}))).error||`Ошибка связи ${response.status}`);error.status=response.status;throw error;}return response;
 }
 const json=async(path,body)=>(await api(path,body)).json();
 function update(message,{quiet=false}={}){
  status=message;
  if(!button)return;
  button.title=message;
  // A successful background poll does not change the header's label or geometry.
  // The open sync panel still receives the full live status and activity details.
  if(quiet)return;
  const label=message==='Всё сохранено на сервере'?'Сохранено онлайн'
   :message.startsWith('Отправка')?'Отправляем данные'
   :/^(Обновление данных|Списки школ|Получаем данные)/.test(message)?'Получаем данные'
   :message==='Ожидает отправки'||message.startsWith('Ожидает отправки:')?'Ожидает отправки'
   :message.startsWith('Получение данных отложено')?'Получение отложено'
   :message.startsWith('Без интернета')||message.startsWith('Нет связи')?'Нет связи'
   :message.startsWith('Подключение')||message.startsWith('Проверяем')?'Проверяем связь'
   :message.startsWith('Ожидаем синхронизацию')?'Другая вкладка'
   :'Нужна проверка';
  if(button.textContent!==label)button.textContent=label;
 }
 async function scopeFor(store,value,id,lookup=get){
  const parent=async(store,id)=>scopeFor(store,await lookup(store,id),id,lookup);
  if(['catalog','templates'].includes(store))return 'global';
  if(['projects','albumProjects'].includes(store))return id;
  if(!value){const meta=await get('syncMeta','entity:'+keyOf(store,id));if(meta)return meta.scope;value=await lookup(store,id);if(!value)return null;}
  if(store==='classes')return value.projectId;
  if(store==='albumClasses')return value.albumProjectId;
  if(store==='students')return parent('classes',value.classId);
  if(['albumStudents','albumGroupMedia','albumTeachers'].includes(store))return parent('albumClasses',value.albumClassId);
  if(store==='albumMedia'){
   for(const store of ['albumStudents','albumGroupMedia','albumTeachers']){const row=await lookup(store,value.ownerId);if(row)return scopeFor(store,row,row.id,lookup);}
  }
  if(['orders','media','finalWorks'].includes(store))return parent('students',value.studentId);
  if(store==='documents'){
   if(value.projectId)return value.projectId;
   if(value.studentId)return parent('students',value.studentId);
   if(value.classId||value.groupId)return parent('classes',value.classId||value.groupId);
  }
  throw new Error('Не найдена родительская карточка. Изменение не отправлено.');
 }
 async function writeBatch(operations,{queue=true}={}) {
  const actor=account();const prepared=[];
  const batch=new Map(operations.filter(op=>op.value!==null).map(op=>[keyOf(op.store,op.id||op.value?.id),op.value]));
  const lookup=(store,id)=>batch.has(keyOf(store,id))?Promise.resolve(batch.get(keyOf(store,id))):get(store,id);
  for(const op of operations){const id=op.id||op.value?.id;const tracked=enabled&&queue&&actor&&SYNC_STORES.includes(op.store)&&actor.role!=='viewer'&&(actor.role==='admin'||!['catalog','templates','documents'].includes(op.store))&&(actor.role!=='photographer'||['students','orders','media'].includes(op.store));prepared.push({...op,id,tracked,expectedWire:tracked&&op.expected!==undefined?await encodeRecord(op.expected,sha256):undefined,scope:tracked?await scopeFor(op.store,op.value,id,lookup):null});}
  if(!prepared.length)return;
  if(prepared.some(op=>op.tracked&&op.value!==null&&!op.scope))throw new Error('Сначала сохраните проект и класс.');
  const tx=db.transaction([...new Set([...prepared.map(v=>v.store),...SYNC_LOCAL_STORES.slice(0,2)])],'readwrite');const complete=done(tx);
  try { for(const op of prepared){
   const store=tx.objectStore(op.store);op.value===null?store.delete(op.id):store.put(op.value);
   if(!op.tracked||!op.scope)continue;
   const key=keyOf(op.store,op.id),q=tx.objectStore('syncQueue'),m=tx.objectStore('syncMeta');
   q.get(key).onsuccess=e=>{const previous=e.target.result;m.get('entity:'+key).onsuccess=ev=>{
    const meta=ev.target.result;
    q.put({id:key,store:op.store,rid:op.id,scope:op.scope,actor:previous?.actor||actor.id,op:crypto.randomUUID(),base:previous?previous.base:meta?(op.expectedWire!==undefined?op.expectedWire:meta.record):null,createdAt:previous?.createdAt||Date.now(),deleted:op.value===null,restoreSeq:previous?.restoreSeq||null,error:'',conflict:null});
   };};
  }} catch(error){tx.abort();await complete.catch(()=>{});throw error;}
  await complete;
  resetPhotoAccount();
  for(const op of prepared)if(op.store==='media'){if(op.value===null)photoDeletes.add(op.id);else photoDeletes.delete(op.id);}
  if(enabled){update(navigator.onLine?'Ожидает отправки':'Без интернета — сохранено');schedule();}
 }
 async function clear(store){const values=await all(store);await writeBatch(values.map(v=>({store,id:v.id,value:null})));}
 function schedule(){if(!started||!background)return;clearTimeout(timer);timer=setTimeout(()=>void sync(),1200);}
 async function uploadBlob(scope,blob){
  const hash=await blobCache.hash(blob);blobs.set(hash,blob);
  if(!await blobCache.confirmed(scope,hash)){
   if(!(await json(`/sync/blob/${scope}/${hash}?check=1`)).exists)await api(`/sync/blob/${scope}/${hash}`,blob);
   await blobCache.confirm(scope,hash);
  }
  return hash;
 }
 async function pack(value,scope){return encodeRecord(value,blob=>uploadBlob(scope,blob));}
 async function unpack(value,scope,local){
  let seeded;
  return decodeRecord(value,async hash=>{
   if(blobs.has(hash))return blobs.get(hash);
   let cached=await blobCache.get(hash);
   if(!cached&&local){seeded??=blobCache.seed(local);await seeded;cached=await blobCache.get(hash);}
   if(cached){blobs.set(hash,cached);return cached;}
   if(!downloads.has(hash))downloads.set(hash,(async()=>{
    const blob=await(await api(`/sync/blob/${scope}/${hash}`)).blob();
    if(await sha256(blob)!==hash)throw new Error('Контрольная сумма полученного файла не совпала');
    await blobCache.remember(hash,blob);blobs.set(hash,blob);activity.downloaded++;return blob;
   })());
   try{return await downloads.get(hash);}finally{downloads.delete(hash);}
  });
 }

 async function rememberError(q,error,conflict){
  const tx=db.transaction('syncQueue','readwrite');const complete=done(tx);const store=tx.objectStore('syncQueue');store.get(q.id).onsuccess=e=>{if(e.target.result?.op===q.op)store.put({...e.target.result,error,conflict:conflict||null});};await complete;
 }
 async function send(pending){
  let q=pending,flight=await get('syncMeta','flight:'+q.id),next;
  if(flight){q={...q,op:flight.request.op,base:flight.request.base};next=flight.request.next;}
  else {
   const tx=db.transaction([q.store,'syncQueue']);const [local,latest]=await Promise.all([result(tx.objectStore(q.store).get(q.rid)),result(tx.objectStore('syncQueue').get(q.id))]);
   if(latest?.op!==q.op)return;
   const prepared=await prepareRecord(q.store,local??null);
   next=await encodeRecord(prepared,blob=>blobCache.hash(blob));
   if(q.base!==null&&JSON.stringify(next)===JSON.stringify(q.base)){
    const write=db.transaction('syncQueue','readwrite'),saved=done(write),queue=write.objectStore('syncQueue');
    queue.get(q.id).onsuccess=e=>{if(e.target.result?.op===q.op)queue.delete(q.id);};await saved;return;
   }
   next=await pack(prepared,q.scope);
   flight={id:'flight:'+q.id,request:{store:q.store,id:q.rid,scope:q.scope,op:q.op,base:q.base,next,...(q.restoreSeq?{restoreSeq:q.restoreSeq}:{})}};
   const txSave=db.transaction('syncMeta','readwrite');const saved=done(txSave);txSave.objectStore('syncMeta').put(flight);await saved;
  }
  let reply;try{reply=await json('/sync/push',flight.request);}catch(error){if(error.status===425)await blobCache.invalidate(q.scope);throw error;}
  if(reply.conflict){await rememberError(q,reply.message,reply);const tx=db.transaction('syncMeta','readwrite');const complete=done(tx);tx.objectStore('syncMeta').delete('flight:'+q.id);await complete;return;}
  if(JSON.stringify(next)!==JSON.stringify(reply.record)&&!canApply())return;
  const restored=await unpack(reply.record,q.scope,await get(q.store,q.rid));
  const write=db.transaction([q.store,'syncQueue','syncMeta'],'readwrite');const complete=done(write);const queue=write.objectStore('syncQueue'),meta=write.objectStore('syncMeta');meta.delete('flight:'+q.id);
  queue.get(q.id).onsuccess=e=>{const pending=e.target.result;meta.get('entity:'+q.id).onsuccess=ev=>{
   if((ev.target.result?.seq||0)>reply.seq)return;
   meta.put({id:'entity:'+q.id,scope:q.scope,record:reply.record,seq:reply.seq});
   if(pending?.op===q.op){if(JSON.stringify(next)!==JSON.stringify(reply.record))changed=true;queue.delete(q.id);if(JSON.stringify(next)!==JSON.stringify(reply.record)){reply.record===null?write.objectStore(q.store).delete(q.rid):write.objectStore(q.store).put(restored);}}
   else if(pending){queue.put({...pending,base:next});}
  };};await complete;
 }
 async function pull(scope,structure=false){
  if(!canApply())return false;
  const cursorKey=(structure?'structure-cursor:':'cursor:')+scope;
  let cursor=(await get('syncMeta',cursorKey))?.value||0;
  for(;;){
   const response=await json(`/sync/changes/${scope}?after=${cursor}${structure?'&structure=1':''}`);
   if(response.changes.length)update(`Обновление данных: ${response.changes.length}`);
   const latest=new Map(response.changes.map(row=>[keyOf(row.store,row.id),row]));
   for(const [key,row] of latest){
    if(!canApply())return false;
    if(!SYNC_STORES.includes(row.store)||await get('syncQueue',key))continue;
    const meta=await get('syncMeta','entity:'+key);if((meta?.seq||0)>=row.seq)continue;
    const value=await unpack(row.record,scope,await get(row.store,row.id));
    const tx=db.transaction([row.store,'syncQueue','syncMeta'],'readwrite');const complete=done(tx);
    tx.objectStore('syncQueue').get(key).onsuccess=e=>{if(e.target.result)return;
     tx.objectStore('syncMeta').get('entity:'+key).onsuccess=ev=>{if((ev.target.result?.seq||0)>=row.seq)return;
      changed=true;activity.received++;row.record===null?tx.objectStore(row.store).delete(row.id):tx.objectStore(row.store).put(value);
      tx.objectStore('syncMeta').put({id:'entity:'+key,record:row.record,scope,seq:row.seq});
     };
    };await complete;
   }
   const tx=db.transaction('syncMeta','readwrite');const complete=done(tx);tx.objectStore('syncMeta').put({id:cursorKey,value:response.cursor});await complete;
   if(response.more&&response.cursor<=cursor)throw new Error('Сервер не продвинул загрузку данных');
   cursor=response.cursor;if(!response.more)break;
  }
  return true;
 }
 async function bootstrap(){
  const marker='bootstrap:'+account().id;if(await get('syncMeta',marker))return;
  if(account().role!=='viewer')for(const store of SYNC_STORES){
   if(account().role!=='admin'&&['catalog','templates','documents','projects','albumProjects'].includes(store))continue;
   if(account().role==='photographer'&&!['students','orders','media'].includes(store))continue;
   for(const value of await all(store)){
    const key=keyOf(store,value.id);if(await get('syncMeta','entity:'+key)||await get('syncQueue',key))continue;
    const scope=await scopeFor(store,value,value.id);if(!scope)continue;
    const tx=db.transaction([store,'syncQueue','syncMeta'],'readwrite');const complete=done(tx);
    tx.objectStore(store).get(value.id).onsuccess=e=>{if(!e.target.result)return;
     tx.objectStore('syncQueue').get(key).onsuccess=q=>{if(q.target.result)return;
      tx.objectStore('syncMeta').get('entity:'+key).onsuccess=m=>{if(m.target.result)return;
       tx.objectStore('syncQueue').put({id:key,store,rid:value.id,scope,actor:account().id,op:crypto.randomUUID(),base:null,createdAt:Date.now(),deleted:false,error:'',conflict:null});
      };
     };
    };await complete;
   }
  }
  const tx=db.transaction('syncMeta','readwrite');const complete=done(tx);tx.objectStore('syncMeta').put({id:marker,value:true});await complete;
 }
 async function drain(){
  changed=false;activity={phase:'checking',sent:0,received:0,downloaded:0,lastCheckedAt:activity.lastCheckedAt};update('Проверяем доступ и проекты…',{quiet:activity.lastCheckedAt!==null});
  resetPhotoAccount();
  const fresh=await json('/me');if(fresh.id!==account().id||fresh.role!==account().role){photoScopes.clear();photoDeletes.clear();throw new Error('Аккаунт или роль изменились. Перезагрузите CRM; очередь сохранена.');}
  // Imported archives may contain local parents whose old sync metadata survived.
  // Register missing project scopes before uploading any project attachment.
  const registered=new Set((await json('/projects')).map(p=>p.id));
  await refreshPhotoIndex([...registered]);
  if(fresh.role==='admin'){
   const pending=await all('syncQueue');
   for(const scope of new Set(pending.filter(q=>q.actor===fresh.id&&!q.deleted&&q.scope!=='global').map(q=>q.scope))){
    if(registered.has(scope))continue;
    const root=(await get('projects',scope))||(await get('albumProjects',scope));
    if(!root)continue;
    await json('/projects',{id:scope,name:root.name||root.schoolName||'Проект'});
    const store=await get('projects',scope)?'projects':'albumProjects';
    if(!pending.some(q=>q.store===store&&q.rid===scope))await writeBatch([{store,value:root}]);
   }
  }
  const queue=(await all('syncQueue')).filter(q=>q.actor===fresh.id&&!q.conflict).sort((a,b)=>Number(a.deleted)-Number(b.deleted)||(a.deleted?-1:1)*(SYNC_STORES.indexOf(a.store)-SYNC_STORES.indexOf(b.store))||a.createdAt-b.createdAt);
  let sent=0;
  for(const q of queue){
   activity.phase='send';activity.total=queue.length;activity.sent=sent;update(`Отправка ${++sent} из ${queue.length}`);
   try{await send(q);activity.sent++;}catch(e){if(e.status&&[400,403,404,409,413,425].includes(e.status)){const tx=db.transaction('syncMeta','readwrite');const complete=done(tx);tx.objectStore('syncMeta').delete('flight:'+q.id);await complete;}await rememberError(q,e.message);if(!e.status||[401,429,500,502,503,507].includes(e.status))throw e;}
  }
  const projects=await json('/projects?includeDeleted=1');
  let received=true;
  // Load all school rosters before catalogue/video downloads can occupy the connection.
  for(const structure of [true,false]){
   const scopes=structure?projects.map(p=>p.id):['global',...projects.map(p=>p.id)];
   for(const [index,scope] of scopes.entries()){
   activity.phase=structure?'structure':'receive';activity.scope=index+1;activity.scopes=scopes.length;update(syncTransferText(activity,true),{quiet:activity.lastCheckedAt!==null});
   try{if(!await pull(scope,structure))received=false;}catch(e){if(e.status!==403)throw e;received=false;}
   if(changed&&canApply()){await onRemote?.();changed=false;}
  }
  }
  if(changed)await onRemote?.();
  const remaining=(await all('syncQueue')).filter(q=>q.actor===fresh.id),conflicts=remaining.filter(q=>q.conflict).length;
  if(received&&!remaining.length){activity.lastCheckedAt=Date.now();const tx=db.transaction('syncMeta','readwrite'),complete=done(tx);tx.objectStore('syncMeta').put({id:'last-check:'+actorKey(),value:activity.lastCheckedAt});await complete;}
  activity.phase='idle';
  update(conflicts?`Нужно согласовать: ${conflicts}`:remaining.length?`Ожидает отправки: ${remaining.length}`:!received?'Получение данных отложено — завершите редактирование':'Всё сохранено на сервере');
 }
 async function sync(){
  if(!enabled||running||!started)return;
  if(!navigator.onLine){update('Без интернета — сохранено');return;}
  running=true;try{
   const run=async()=>{try{await drain();}catch(error){if(!reconnect||!(error?.name==='InvalidStateError'||/database connection is closing/i.test(error?.message||'')))throw error;update('Восстанавливаем соединение с устройством…');db=await reconnect();await drain();}};
   if(navigator.locks)await navigator.locks.request('crm-record-sync:'+db.name,{ifAvailable:true},async lock=>{if(lock)await run();else update('Ожидаем синхронизацию другой вкладки');});else await run();
  }catch(e){if(e instanceof TypeError||['TimeoutError','AbortError'].includes(e.name))e=new Error('Нет связи — изменения сохранены на устройстве');update((e.status===401?'Нужен вход — очередь сохранена':e.message)||'Нет связи — очередь сохранена');}finally{running=false;blobs.clear();}
 }
 async function resolve(q,choice){
  const live=await get('syncQueue',q.id);if(live?.op!==q.op)throw new Error('Запись уже изменилась. Обновите список.');
  const local=await get(q.store,q.rid);const wire=await pack(local??null,q.scope);
  const candidate=choice==='local'?rebaseLocal(q.base,wire,q.conflict.current):q.conflict.current;
  const decoded=await unpack(candidate,q.scope);
  const tx=db.transaction([q.store,'syncQueue','syncMeta','syncHistory'],'readwrite');const complete=done(tx);
  tx.objectStore('syncQueue').get(q.id).onsuccess=e=>{
   if(e.target.result?.op!==q.op){tx.abort();return;}
   tx.objectStore('syncHistory').put({id:crypto.randomUUID(),at:Date.now(),store:q.store,recordId:q.rid,scope:q.scope,local:local??null,remote:q.conflict.current,choice});
   candidate===null?tx.objectStore(q.store).delete(q.rid):tx.objectStore(q.store).put(decoded);
   tx.objectStore('syncMeta').put({id:'entity:'+q.id,scope:q.scope,record:q.conflict.current,seq:q.conflict.seq});
   if(choice==='local')tx.objectStore('syncQueue').put({...q,op:crypto.randomUUID(),base:q.conflict.current,restoreSeq:q.conflict.seq,conflict:null,error:''});else tx.objectStore('syncQueue').delete(q.id);
  };await complete;await onRemote?.();schedule();
 }
 async function show(trigger){
  const restore=captureDialogReturn(document,window,trigger),dialog=document.createElement('dialog');dialog.className='cloud-dialog sync-dialog';dialog.setAttribute('aria-label','Сохранение');
  dialog.innerHTML='<header class="sync-panel-head"><div><h2>Сохранение</h2><small>Данные и файлы CRM</small></div><button data-close type="button" aria-label="Закрыть панель"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><section class="sync-panel-summary" data-summary aria-live="polite"></section><section class="sync-project-progress" data-project-progress></section><div class="sync-panel-action"><button class="secondary-button" data-retry type="button">Проверить обновления</button><p data-status role="status"></p></div><details class="sync-pending" data-pending><summary>Очередь отправки <span data-queue-count></span></summary><div data-list></div></details><details class="sync-help"><summary>Исправления и восстановление</summary><div data-history></div></details><details class="sync-help"><summary>Как работает сохранение</summary><p>Изменения сначала сохраняются на устройстве. При наличии интернета CRM отправляет новые изменения на сервер. Если связь прервалась, очередь остаётся на устройстве.</p><p>Копирование в S3 можно проверить в разделе «Хранилище» кабинета администратора.</p></details>';


  document.body.append(dialog);dialog.showModal();history.pushState({...history.state,recordSyncModal:true},'');const back=()=>dialog.close();window.addEventListener('popstate',back,{once:true});
  dialog.onclose=()=>{window.removeEventListener('popstate',back);dialog.remove();if(history.state?.recordSyncModal)history.back();restore();};dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  async function render(){
   const queue=(await all('syncQueue')).filter(row=>row.actor===account()?.id);dialog.querySelector('[data-list]').innerHTML='';
   const model=syncPanelState({queue,online:navigator.onLine,running,status});
   dialog.dataset.syncState=model.kind;
   const icon=model.kind==='saved'?'<path d="m6 12 4 4 8-8"/>':model.kind==='attention'?'<path d="M12 8v5m0 4h.01"/><circle cx="12" cy="12" r="9"/>':'<path d="M20 8a8 8 0 0 0-14-2L3 9m0-6v6h6M4 16a8 8 0 0 0 14 2l3-3m0 6v-6h-6"/>';
   dialog.querySelector('[data-summary]').innerHTML=`<div class="sync-panel-hero"><span class="sync-panel-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg></span><div><h3>${esc(model.title)}</h3><p>${esc(model.detail)}</p></div></div><dl class="sync-panel-locations"><div><dt>Отправка изменений</dt><dd>${queue.length?queue.length+" в очереди":running?"Проверяем":"Очередь пуста"}</dd></div><div><dt>Получение данных</dt><dd>${esc(model.server)}</dd></div></dl><p class="sync-transfer-detail">${esc(syncTransferText(activity,running))}</p>${running?`<p class="sync-transfer-detail">Записей получено: ${activity.received} · файлов: ${activity.downloaded}</p>`:""}${model.progress?`<div class="sync-panel-progress"><progress max="${model.progress.total}" value="${model.progress.current-1}" aria-label="Отправка изменений"></progress><span>Отправляем ${model.progress.current} из ${model.progress.total}</span></div>`:''}${model.pending?`<div class="sync-panel-counts"><span>Файлы <b>${model.files}</b></span><span>Карточки <b>${model.cards}</b></span></div>`:''}`;
   dialog.querySelector('[data-status]').textContent='';
   const retryButton=dialog.querySelector('[data-retry]');retryButton.disabled=model.disabled;retryButton.textContent=model.retry;
   const pending=dialog.querySelector('[data-pending]');pending.hidden=!queue.length;dialog.querySelector('[data-queue-count]').textContent=String(queue.length);
   if(model.conflicts||model.errors)pending.open=true;
   const labels={projects:'Проект',albumProjects:'Альбом',classes:'Класс',albumClasses:'Класс альбома',students:'Карточка ребёнка',orders:'Заказ',media:'Фото или видео',finalWorks:'Готовая работа',documents:'Документ',catalog:'Услуга',templates:'Шаблон'};
   const name=v=>v?.name||v?.title||v?.schoolName||[v?.lastName,v?.firstName].filter(Boolean).join(' ');


   for(const q of queue){
    const local=await get(q.store,q.rid);
    const child=local?.studentId?await get('students',local.studentId):null;
    const group=(local?.classId||child?.classId)?await get('classes',local?.classId||child?.classId):null;
    const project=await get('projects',q.scope)||await get('albumProjects',q.scope);
    const title=[labels[q.store]||'Запись',name(local)||name(child)||name(group)||name(project)].filter(Boolean).join(' · ');
    const context=[name(project),name(group)].filter(Boolean).join(' / ');
    const message=q.error==='Проект не найден'?'Проект ещё не отправлен. Нажмите «Отправить сейчас», чтобы повторить передачу вместе с проектом.':q.error||'В очереди на отправку';
    const section=document.createElement('section');section.className='sync-record';
    const summary=v=>JSON.stringify(v,(k,x)=>k==='$syncBlob'?'Файл':typeof x==='string'&&x.length>300?x.slice(0,300)+'…':x,2)?.slice(0,6000)||'Удалено';
    section.innerHTML=`<h3>${esc(title)}</h3>${context?`<small>${esc(context)}</small>`:''}<p>${esc(message)}</p><details><summary>Технические данные</summary><code>${esc(q.rid)}</code></details>${q.conflict?`<p>Различаются: ${esc(q.conflict.fields.join(', '))}. Обе версии сохранятся в истории на этом устройстве.</p><details><summary>Версия на устройстве</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(summary(local))}</pre></details><details><summary>Серверная версия</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(summary(q.conflict.current))}</pre></details><button data-local>Сохранить изменения устройства</button><button data-remote>Принять серверную версию</button>`:''}`;
    for(const choice of ['local','remote'])section.querySelector('[data-'+choice+']')?.addEventListener('click',async()=>{section.querySelectorAll('button').forEach(b=>b.disabled=true);try{await resolve(q,choice);await render();}catch(e){dialog.querySelector('[data-status]').textContent=e.message;section.querySelectorAll('button').forEach(b=>b.disabled=false);}});
    dialog.querySelector('[data-list]').append(section);
   }

   const history=(await all('syncHistory')).sort((a,b)=>b.at-a.at).slice(0,20);const historyBox=dialog.querySelector('[data-history]');historyBox.innerHTML='';
   for(const saved of history){const item=document.createElement('p');item.textContent=`${saved.local?.name||saved.local?.lastName||saved.recordId} · ${new Date(saved.at).toLocaleString()}`;const restoreButton=document.createElement('button');restoreButton.textContent='Восстановить сохранённую версию';restoreButton.onclick=async()=>{restoreButton.disabled=true;try{await writeBatch([{store:saved.store,id:saved.recordId,value:saved.local}]);await onRemote?.();await render();}catch(e){dialog.querySelector('[data-status]').textContent=e.message;restoreButton.disabled=false;}};item.append(restoreButton);historyBox.append(item);}
   if(!history.length)historyBox.textContent='Пока нет сохранённых конфликтов.';
  }
  const retry=dialog.querySelector('[data-retry]');retry.onclick=async()=>{retry.disabled=true;retry.textContent='Проверяем…';try{await sync();}finally{await render();}};
  const stopProgress=mountProjectProgress(dialog.querySelector('[data-project-progress]'),{db:()=>db,user:account,load:json});dialog.addEventListener('close',stopProgress,{once:true});
  await render();let shownStatus=status+':'+running+':'+navigator.onLine+':'+JSON.stringify(activity);const refresh=setInterval(()=>{const currentStatus=status+':'+running+':'+navigator.onLine+':'+JSON.stringify(activity);if(dialog.open&&shownStatus!==currentStatus&&!dialog.querySelector('.sync-record details[open]')&&!dialog.querySelector('.sync-record button:focus')){shownStatus=currentStatus;void render();}},2000);dialog.addEventListener('close',()=>clearInterval(refresh),{once:true});
 }
 async function start({ui=true,background:automatic=true}={}){
  if(!enabled||started)return;background=automatic;activity.lastCheckedAt=(await get('syncMeta','last-check:'+actorKey()))?.value||null;await restorePhotoIndex();await bootstrap();started=true;
  if(ui){button=document.createElement('button');button.type='button';button.className='secondary-button compact sync-status-button';button.onclick=()=>void show(button);document.querySelector('.topbar-copy')?.append(button);}
  update('Подключение…');
  if(background){window.addEventListener('online',sync);window.addEventListener('offline',()=>update('Без интернета — сохранено'));document.addEventListener('visibilitychange',()=>{if(!document.hidden)void sync();});setInterval(()=>void sync(),20000);}
  await sync();
 }

 return {photoIndex,writeBatch,resolveConflict:resolve,put:(store,value,expected)=>writeBatch([{store,value,expected}]).then(()=>value),del:(store,id,expected)=>writeBatch([{store,id,value:null,expected}]),clear,start,sync,show,setDatabase:next=>{db=next;}};
}

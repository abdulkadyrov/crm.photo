import {SYNC_STORES,SYNC_LOCAL_STORES,encodeRecord,decodeRecord,sha256,rebaseLocal} from './sync-codec.js';
import {captureDialogReturn} from './dialog-return.js';
export {SYNC_LOCAL_STORES};
const keyOf=(store,id)=>store+':'+id;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Сохранение отменено'));});
const result=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
export function createRecordSync({db,user,enabled,notify,onRemote,canApply=()=>true,prepareRecord=async(store,value)=>value}) {
 let running=false,started=false,background=true,changed=false,timer,status='Изменения сохраняются на устройстве',button;
 const blobs=new Map();
 const get=(store,id)=>result(db.transaction(store).objectStore(store).get(id));
 const all=store=>result(db.transaction(store).objectStore(store).getAll());
 const account=()=>typeof user==='function'?user():user;
 async function api(path,body){
  const response=await fetch('/api/v1'+path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(body instanceof Blob?600000:30000),headers:body&&!(body instanceof Blob)?{'Content-Type':'application/json'}:{},body:body instanceof Blob?body:body?JSON.stringify(body):undefined});
  if(!response.ok){const error=new Error((await response.json().catch(()=>({}))).error||`Ошибка связи ${response.status}`);error.status=response.status;throw error;}return response;
 }
 const json=async(path,body)=>(await api(path,body)).json();
 function update(message){status=message;if(button)button.textContent='Синхронизация · '+message;}
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
  if(enabled){update(navigator.onLine?'Ожидает отправки':'Без интернета — сохранено');schedule();}
 }
 async function clear(store){const values=await all(store);await writeBatch(values.map(v=>({store,id:v.id,value:null})));}
 function schedule(){if(!started||!background)return;clearTimeout(timer);timer=setTimeout(()=>void sync(),1200);}
 async function uploadBlob(scope,blob){
  const hash=await sha256(blob);blobs.set(hash,blob);
  if(!(await json(`/sync/blob/${scope}/${hash}?check=1`)).exists)await api(`/sync/blob/${scope}/${hash}`,blob);
  return hash;
 }
 async function pack(value,scope){return encodeRecord(value,blob=>uploadBlob(scope,blob));}
 async function unpack(value,scope){return decodeRecord(value,async hash=>{
  if(blobs.has(hash))return blobs.get(hash);
  const blob=await(await api(`/sync/blob/${scope}/${hash}`)).blob();if(await sha256(blob)!==hash)throw new Error('Контрольная сумма полученного файла не совпала');blobs.set(hash,blob);return blob;
 });}
 async function rememberError(q,error,conflict){
  const tx=db.transaction('syncQueue','readwrite');const complete=done(tx);const store=tx.objectStore('syncQueue');store.get(q.id).onsuccess=e=>{if(e.target.result?.op===q.op)store.put({...e.target.result,error,conflict:conflict||null});};await complete;
 }
 async function send(pending){
  let q=pending,flight=await get('syncMeta','flight:'+q.id),next;
  if(flight){q={...q,op:flight.request.op,base:flight.request.base};next=flight.request.next;}
  else {
   const tx=db.transaction([q.store,'syncQueue']);const [local,latest]=await Promise.all([result(tx.objectStore(q.store).get(q.rid)),result(tx.objectStore('syncQueue').get(q.id))]);
   if(latest?.op!==q.op)return;
   next=await pack(await prepareRecord(q.store,local??null),q.scope);
   flight={id:'flight:'+q.id,request:{store:q.store,id:q.rid,scope:q.scope,op:q.op,base:q.base,next,...(q.restoreSeq?{restoreSeq:q.restoreSeq}:{})}};
   const txSave=db.transaction('syncMeta','readwrite');const saved=done(txSave);txSave.objectStore('syncMeta').put(flight);await saved;
  }
  const reply=await json('/sync/push',flight.request);
  if(reply.conflict){await rememberError(q,reply.message,reply);const tx=db.transaction('syncMeta','readwrite');const complete=done(tx);tx.objectStore('syncMeta').delete('flight:'+q.id);await complete;return;}
  if(JSON.stringify(next)!==JSON.stringify(reply.record)&&!canApply())return;
  const restored=await unpack(reply.record,q.scope);
  const write=db.transaction([q.store,'syncQueue','syncMeta'],'readwrite');const complete=done(write);const queue=write.objectStore('syncQueue'),meta=write.objectStore('syncMeta');meta.delete('flight:'+q.id);
  queue.get(q.id).onsuccess=e=>{const pending=e.target.result;meta.get('entity:'+q.id).onsuccess=ev=>{
   if((ev.target.result?.seq||0)>reply.seq)return;
   meta.put({id:'entity:'+q.id,scope:q.scope,record:reply.record,seq:reply.seq});
   if(pending?.op===q.op){if(JSON.stringify(next)!==JSON.stringify(reply.record))changed=true;queue.delete(q.id);reply.record===null?write.objectStore(q.store).delete(q.rid):write.objectStore(q.store).put(restored);}
   else if(pending){queue.put({...pending,base:next});}
  };};await complete;
 }
 async function pull(scope){
  if(!canApply())return;
  let cursor=(await get('syncMeta','cursor:'+scope))?.value||0;
  for(let page=0;page<20;page++){
   const response=await json(`/sync/changes/${scope}?after=${cursor}`);
   const latest=new Map(response.changes.map(row=>[keyOf(row.store,row.id),row]));
   for(const [key,row] of latest){
    if(!canApply())return;
    if(!SYNC_STORES.includes(row.store)||await get('syncQueue',key))continue;
    const meta=await get('syncMeta','entity:'+key);if((meta?.seq||0)>=row.seq)continue;
    const value=await unpack(row.record,scope);
    const tx=db.transaction([row.store,'syncQueue','syncMeta'],'readwrite');const complete=done(tx);
    tx.objectStore('syncQueue').get(key).onsuccess=e=>{if(e.target.result)return;
     tx.objectStore('syncMeta').get('entity:'+key).onsuccess=ev=>{if((ev.target.result?.seq||0)>=row.seq)return;
      changed=true;row.record===null?tx.objectStore(row.store).delete(row.id):tx.objectStore(row.store).put(value);
      tx.objectStore('syncMeta').put({id:'entity:'+key,record:row.record,scope,seq:row.seq});
     };
    };await complete;
   }
   const tx=db.transaction('syncMeta','readwrite');const complete=done(tx);tx.objectStore('syncMeta').put({id:'cursor:'+scope,value:response.cursor});await complete;
   cursor=response.cursor;if(!response.more)break;
  }
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
  changed=false;
  const fresh=await json('/me');if(fresh.id!==account().id||fresh.role!==account().role)throw new Error('Аккаунт или роль изменились. Перезагрузите CRM; очередь сохранена.');
  const queue=(await all('syncQueue')).filter(q=>q.actor===fresh.id&&!q.conflict).sort((a,b)=>Number(a.deleted)-Number(b.deleted)||(a.deleted?-1:1)*(SYNC_STORES.indexOf(a.store)-SYNC_STORES.indexOf(b.store))||a.createdAt-b.createdAt);
  let sent=0;
  for(const q of queue){
   update(`Отправка ${++sent} из ${queue.length}`);
   try{await send(q);}catch(e){if(e.status&&[400,403,404,409,413,425].includes(e.status)){const tx=db.transaction('syncMeta','readwrite');const complete=done(tx);tx.objectStore('syncMeta').delete('flight:'+q.id);await complete;}await rememberError(q,e.message);if(!e.status||[401,429,500,502,503,507].includes(e.status))throw e;}
  }
  const projects=await json('/projects');
  for(const scope of ['global',...projects.map(p=>p.id)]){try{await pull(scope);}catch(e){if(e.status!==403)throw e;}}
  if(changed)await onRemote?.();
  const remaining=await all('syncQueue'),conflicts=remaining.filter(q=>q.conflict).length;
  update(conflicts?`Нужно согласовать: ${conflicts}`:remaining.length?`Ожидает отправки: ${remaining.length}`:'Всё сохранено на сервере');
 }
 async function sync(){
  if(!enabled||running||!started)return;
  if(!navigator.onLine){update('Без интернета — сохранено');return;}
  running=true;try{
   if(navigator.locks)await navigator.locks.request('crm-record-sync:'+db.name,{ifAvailable:true},async lock=>{if(lock)await drain();});else await drain();
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
  const restore=captureDialogReturn(document,window,trigger),dialog=document.createElement('dialog');dialog.className='cloud-dialog';dialog.setAttribute('aria-label','Синхронизация');
  dialog.innerHTML='<div class="cloud-head"><h2>Синхронизация</h2><button data-close>Закрыть</button></div><p data-status role="status"></p><p>Рабочие изменения отправляются автоматически, когда CRM открыта и есть интернет. Не закрывайте приложение до завершения передачи больших файлов.</p><button data-retry>Повторить сейчас</button><div data-list></div><details><summary>Сохранённые версии после согласования</summary><div data-history></div></details>';
  document.body.append(dialog);dialog.showModal();history.pushState({...history.state,recordSyncModal:true},'');const back=()=>dialog.close();window.addEventListener('popstate',back,{once:true});
  dialog.onclose=()=>{window.removeEventListener('popstate',back);dialog.remove();if(history.state?.recordSyncModal)history.back();restore();};dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  async function render(){
   dialog.querySelector('[data-status]').textContent=status;
   const queue=await all('syncQueue');dialog.querySelector('[data-list]').innerHTML='';
   for(const q of queue){
    const local=await get(q.store,q.rid),title=local?.name||local?.title||[local?.lastName,local?.firstName].filter(Boolean).join(' ')||q.rid;
    const section=document.createElement('section');section.className='panel';
    const summary=v=>JSON.stringify(v,(k,x)=>k==='$syncBlob'?'Файл':typeof x==='string'&&x.length>300?x.slice(0,300)+'…':x,2)?.slice(0,6000)||'Удалено';
    section.innerHTML=`<h3>${esc(title)}</h3><p>${esc(q.error||'Ожидает отправки')}</p>${q.conflict?`<p>Различаются: ${esc(q.conflict.fields.join(', '))}. Обе версии сохранятся в истории на этом устройстве.</p><details><summary>Версия на устройстве</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(summary(local))}</pre></details><details><summary>Серверная версия</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(summary(q.conflict.current))}</pre></details><button data-local>Сохранить изменения устройства</button><button data-remote>Принять серверную версию</button>`:''}`;
    for(const choice of ['local','remote'])section.querySelector('[data-'+choice+']')?.addEventListener('click',async()=>{section.querySelectorAll('button').forEach(b=>b.disabled=true);try{await resolve(q,choice);await render();}catch(e){dialog.querySelector('[data-status]').textContent=e.message;section.querySelectorAll('button').forEach(b=>b.disabled=false);}});
    dialog.querySelector('[data-list]').append(section);
   }
   if(!queue.length)dialog.querySelector('[data-list]').textContent='Неотправленных изменений нет.';
   const history=(await all('syncHistory')).sort((a,b)=>b.at-a.at).slice(0,20);const historyBox=dialog.querySelector('[data-history]');historyBox.innerHTML='';
   for(const saved of history){const item=document.createElement('p');item.textContent=`${saved.local?.name||saved.local?.lastName||saved.recordId} · ${new Date(saved.at).toLocaleString()}`;const restoreButton=document.createElement('button');restoreButton.textContent='Восстановить сохранённую версию';restoreButton.onclick=async()=>{restoreButton.disabled=true;try{await writeBatch([{store:saved.store,id:saved.recordId,value:saved.local}]);await onRemote?.();await render();}catch(e){dialog.querySelector('[data-status]').textContent=e.message;restoreButton.disabled=false;}};item.append(restoreButton);historyBox.append(item);}
   if(!history.length)historyBox.textContent='Пока нет сохранённых конфликтов.';
  }
  dialog.querySelector('[data-retry]').onclick=async()=>{await sync();await render();};await render();
 }
 async function start({ui=true,background:automatic=true}={}){
  if(!enabled||started)return;background=automatic;await bootstrap();started=true;
  if(ui){button=document.createElement('button');button.type='button';button.className='secondary-button compact sync-status-button';button.onclick=()=>void show(button);document.querySelector('.topbar-copy')?.append(button);}
  update('Подключение…');
  if(background){window.addEventListener('online',sync);window.addEventListener('offline',()=>update('Без интернета — сохранено'));document.addEventListener('visibilitychange',()=>{if(!document.hidden)void sync();});setInterval(()=>void sync(),20000);}
  await sync();
 }

 return {writeBatch,resolveConflict:resolve,put:(store,value,expected)=>writeBatch([{store,value,expected}]).then(()=>value),del:(store,id,expected)=>writeBatch([{store,id,value:null,expected}]),clear,start,sync,show,setDatabase:next=>{db=next;}};
}

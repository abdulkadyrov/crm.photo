const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const req=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
export const fileSize=n=>{if(n==null)return '—';const units=['Б','КБ','МБ','ГБ','ТБ'];let i=0;while(n>=1024&&i<4){n/=1024;i++;}return n.toLocaleString('ru-RU',{maximumFractionDigits:i?2:0})+' '+units[i];};
export function transferTotals(snapshot,local){
 const files=new Map(snapshot.files.map(f=>[f.id,f])),bytes=ids=>[...new Set(ids)].reduce((n,id)=>n+(files.get(id)?.bytes||0),0);
 const available=id=>local.files.has(id)&&local.files.get(id)===files.get(id)?.bytes;
 const fileIds=[...files.keys()],totalBytes=bytes(fileIds),localBytes=bytes(fileIds.filter(available)),serverBytes=bytes(fileIds.filter(id=>files.get(id).ready));
 const students=snapshot.students,media=snapshot.media,photos=media.filter(m=>['photo','image'].includes(m.type));
 const photoReady=m=>local.records.has('media:'+m.id)||local.records.has('albumMedia:'+m.id)?m.files.length>0&&m.files.every(available):false;
 const groups=snapshot.groups.map(group=>{const children=students.filter(s=>s.classId===group.id),ids=new Set(children.map(s=>s.id));const pictures=photos.filter(m=>ids.has(m.studentId));const refs=snapshot.records.filter(r=>r.classId===group.id||ids.has(r.studentId)||r.id===group.id||ids.has(r.id)).flatMap(r=>r.files);return {...group,students:children.length,localStudents:children.filter(s=>local.students.has(s.id)).length,photos:pictures.length,localPhotos:pictures.filter(photoReady).length,bytes:bytes(refs),localBytes:bytes(refs.filter(available)),loaded:local.groups.has(group.id)};});
 return {complete:local.projects.has(snapshot.scope)&&fileIds.every(available)&&snapshot.records.every(r=>local.records.has(r.store+':'+r.id)),totalBytes,localBytes,serverBytes,files:files.size,localFiles:fileIds.filter(available).length,serverFiles:fileIds.filter(id=>files.get(id).ready).length,students:students.length,localStudents:students.filter(s=>local.students.has(s.id)).length,groups,photos:photos.length,localPhotos:photos.filter(photoReady).length,loaded:local.projects.has(snapshot.scope)};
}
async function localState(db){
 const names=['projects','albumProjects','classes','albumClasses','students','albumStudents','media','albumMedia','orders','finalWorks','documents','catalog','templates','albumGroupMedia','albumTeachers','syncQueue','syncMeta'].filter(n=>db.objectStoreNames.contains(n));
 const tx=db.transaction(names),state={projects:new Set(),groups:new Set(),students:new Set(),records:new Set(),files:new Map(),pending:new Map()};
 await Promise.all(names.map(name=>new Promise((resolve,reject)=>{const op=tx.objectStore(name).openCursor(name==='syncMeta'?IDBKeyRange.bound('blob:','blob:\uffff'):undefined);op.onerror=()=>reject(op.error);op.onsuccess=()=>{const cur=op.result;if(!cur){resolve();return;}const v=cur.value;
 if(name==='syncMeta'){if(v.blob instanceof Blob)state.files.set(String(v.id).slice(5),v.blob.size);}
 else if(name==='syncQueue')state.pending.set(v.scope,(state.pending.get(v.scope)||0)+1);
 else{state.records.add(name+':'+v.id);if(['projects','albumProjects'].includes(name))state.projects.add(v.id);if(['classes','albumClasses'].includes(name))state.groups.add(v.id);if(['students','albumStudents'].includes(name))state.students.add(v.id);}
 cur.continue();};})));
 return state;
}
const progress=(label,n,total)=>{const percent=total?Math.min(100,Math.floor(n/total*100)):100;return `<div class="transfer-meter"><div><span>${label}</span><strong>${fileSize(n)} / ${fileSize(total)}</strong></div><progress max="${total||1}" value="${total?n:1}" aria-label="${label}"></progress><small>${total?percent+'%':'Нет файлов'}</small></div>`;};
export function projectProgressHTML(snapshot,local){
 const totals=transferTotals(snapshot,local),pending=local.pending.get(snapshot.scope)||0;
 return `<details class="transfer-project" data-transfer-id="${esc(snapshot.scope)}"><summary><strong>${esc(snapshot.name)}</strong><span>${fileSize(totals.localBytes)} / ${fileSize(totals.totalBytes)} на устройстве · ${totals.totalBytes?Math.floor(totals.localBytes/totals.totalBytes*100)+"%":"нет файлов"}</span><progress max="${totals.totalBytes||1}" value="${totals.totalBytes?totals.localBytes:1}" aria-label="Загрузка файлов проекта"></progress></summary><div class="transfer-project-body">${progress('Файлы на сервере',totals.serverBytes,totals.totalBytes)}${progress('На этом устройстве',totals.localBytes,totals.totalBytes)}<p>Файлы: ${totals.localFiles} / ${totals.files} · на сервере: ${totals.serverFiles} / ${totals.files}</p><p>Группы: ${totals.groups.filter(g=>g.loaded).length} / ${totals.groups.length}<br>Учащиеся: ${totals.localStudents} / ${totals.students} · фото: ${totals.localPhotos} / ${totals.photos}</p>${pending?`<p class="transfer-pending">Локальных изменений в очереди: ${pending}. Объём новых файлов уточнится после отправки.</p>`:''}${totals.groups.map(g=>`<details class="transfer-group" data-transfer-id="${esc(snapshot.scope+':'+g.id)}"><summary><strong>${esc(g.name)}</strong><span>Учащиеся ${g.localStudents} / ${g.students} · фото ${g.localPhotos} / ${g.photos}</span></summary>${progress('Файлы группы на устройстве',g.localBytes,g.bytes)}</details>`).join('')}<small>Объём файлов из серверного списка; одинаковые файлы считаются один раз. Общий каталог показан отдельно.</small></div></details>`;
}
export function mountProjectProgress(target,{db,user,load,online=()=>navigator.onLine}){
 let stopped=false,busy=false,snapshots=[],lastFetch=0,loaded=false;
 const actor=()=>{const u=user();return u.id+':'+u.role;},initialActor=actor(),cacheKey='transfer-inventory:'+initialActor;
 async function refresh(){if(stopped||busy)return;busy=true;
 try{
  if(!loaded){snapshots=(await req(db().transaction('syncMeta').objectStore('syncMeta').get(cacheKey)))?.snapshots||[];loaded=true;}
  let error='';
  if(online()&&Date.now()-lastFetch>30000){lastFetch=Date.now();try{const projects=await load('/projects'),next=[];for(const p of projects)next.push(await load('/sync/inventory/'+p.id));try{next.push(await load('/sync/inventory/global'));}catch(e){if(e.status!==403)throw e;}
   if(actor()!==initialActor)return;snapshots=next;const tx=db().transaction('syncMeta','readwrite');tx.objectStore('syncMeta').put({id:cacheKey,snapshots});await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
  }catch{error='Не удалось обновить серверный список. Показаны последние доступные данные.';}}
  const local=await localState(db());if(stopped||actor()!==initialActor)return;
  const opened=new Set([...target.querySelectorAll('details[open]')].map(e=>e.dataset.transferId));
  const projects=snapshots.filter(s=>s.scope!=='global'),ready=projects.filter(s=>transferTotals(s,local).complete).length;
  target.innerHTML=`<h3>Загрузка проектов</h3><p>${snapshots.length?`Полностью загружено проектов: <strong>${ready} / ${projects.length}</strong>`:'Получаем серверный список проектов…'}</p><progress class="transfer-overall" aria-label="Проекты на устройстве" max="${projects.length||1}" value="${ready}"></progress>${error?`<p role="status">${error}</p>`:''}${!online()?'<p>Без интернета · последний сохранённый список</p>':''}${snapshots.map(s=>projectProgressHTML(s,local)).join('')}<small>Показано для этого устройства. Список сервера обновляется раз в 30 секунд; объём — только файлы, без служебной базы CRM. Прогресс учитывает полностью сохранённые файлы.</small>`;
  for(const detail of target.querySelectorAll('details'))if(opened.has(detail.dataset.transferId))detail.open=true;
 }catch{if(!stopped)target.textContent='Не удалось проверить загрузку проектов. Повторите проверку позже.';}finally{busy=false;}}
 void refresh();const timer=setInterval(()=>void refresh(),4000);return ()=>{stopped=true;clearInterval(timer);};
}

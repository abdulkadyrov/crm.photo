import {resolveScanTarget} from './group-scan.js';
const norm=value=>String(value||'').toLocaleLowerCase('ru').replaceAll('ё','е').replace(/\s+/g,' ').trim();
export function searchPrintStudents(students,query,groups=[]){const words=norm(query).split(' ').filter(Boolean);return students.filter(s=>words.every(word=>norm(`${s.lastName} ${s.firstName} ${groups.find(g=>g.id===s.classId)?.name||''}`).includes(word)));}
export function resolveSelectiveCode(raw,data,{parseWork=()=>null,studentTokens=value=>[value]}={}){
 return resolveScanTarget(raw,{...data,parseWork,studentTokens,viewerUrl:()=>'',textMatches:(work,payload)=>{
  if(String(work.printQrPayload||'').trim()===String(raw).trim())return true;
  const saved=parseWork(work.printQrPayload);return saved?.format==='text'&&['schoolName','className','studentName','orderName','date'].every(key=>!payload[key]||norm(payload[key])===norm(saved[key]));
 }});
}
export function selectedPrintWorks(snapshot){const byId=new Map(snapshot.works.map(w=>[w.id,w]));return snapshot.items.map(item=>{const work=byId.get(item.workId);if(!work||item.stale||item.blocked||work.needsCorrection||work.image.$syncBlob!==item.imageHash)throw new Error('Список содержит изменённую работу или работу на исправлении. Выберите её заново.');return {...work,copies:item.copies};});}
export function createPrintSelectionStore({id,request,storage,key,changed=()=>{}}){
 let state=JSON.parse(storage.getItem(key)||'null')||{snapshot:null,pending:[]},running=null,timer=null,closed=false,issue='',message='Подключаем список…';
 const save=next=>{storage.setItem(key,JSON.stringify(next));state=next;};
 const view=()=>{if(!state.snapshot)return null;const snapshot={...state.snapshot,items:state.snapshot.items.map(i=>({...i}))};for(const op of state.pending){if(op.action==='ready'){snapshot.ready=true;continue;}snapshot.items=snapshot.items.filter(i=>i.workId!==op.workId);if(op.selected)snapshot.items.push({workId:op.workId,imageHash:op.imageHash,copies:op.copies,stale:false,blocked:false});snapshot.ready=false;}return snapshot;};
 const notify=()=>changed(view(),message,state.pending.length);
 async function sync(full=false){if(closed)return;if(running)return running.then(()=>sync(full));clearTimeout(timer);
  running=Promise.resolve().then(async()=>{try{
   while(state.pending.length){const op=state.pending[0];try{const snapshot=await request('POST',id,op);save({...state,snapshot,pending:state.pending.filter(row=>row.op!==op.op)});}catch(error){if(error.status!==409)throw error;save({...state,pending:state.pending.filter(row=>row.op!==op.op)});issue=error.message;message=issue;notify();}}
   const snapshot=await request('GET',id,null,full?undefined:state.snapshot?.revision);if(!snapshot.unchanged)save({...state,snapshot});message=issue|| (state.pending.length?'Сохранено на устройстве · ожидает связи':view()?.ready?'Выбор завершён · список передан на Mac':'Список сохранён в облаке');notify();
  }catch(error){message=[401,403,404,410].includes(error.status)?error.message:'Нет связи · выбор сохранён на устройстве';notify();}finally{running=null;if(!closed)timer=setTimeout(()=>void sync(),2500);}});return running;
 }
 const edit=body=>{issue='';save({...state,pending:[...state.pending,{...body,op:crypto.randomUUID()}]});message='Сохранено на устройстве · отправляем…';notify();void sync();};
 return {get snapshot(){return view();},get pending(){return state.pending.length;},sync,select(work,selected=true,copies=1){edit({workId:work.id,imageHash:work.image.$syncBlob,selected,copies});},ready(){edit({action:'ready'});},stop(){closed=true;clearTimeout(timer);}};
}
export async function loadSelectivePrintAssets(snapshot,{fetcher=fetch}={}){
 const chosen=selectedPrintWorks(snapshot),cache=new Map();
 const json=async path=>{const response=await fetcher('/api/v1'+path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('Не удалось загрузить сведения о выбранном фото');return response.json();};
 const blob=async ref=>{
  const hash=ref?.$syncBlob;if(!/^[a-f0-9]{64}$/.test(hash||''))throw new Error('Отсутствует файл выбранной работы');
  if(!cache.has(hash))cache.set(hash,(async()=>{const response=await fetcher(`/api/v1/sync/blob/${encodeURIComponent(snapshot.projectId)}/${hash}`,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(120000)});if(!response.ok)throw new Error('Не удалось загрузить выбранное фото. Повторите подготовку.');const bytes=await response.arrayBuffer(),digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');if(digest!==hash)throw new Error('Контрольная сумма фото не совпала');return new Blob([bytes],{type:ref.mime||'image/jpeg'});})());
  return cache.get(hash);
 };
 const works=[];
 for(const selected of chosen){
  const {record}=await json('/sync/record/finalWorks/'+encodeURIComponent(selected.id));
  if(record.studentId!==selected.studentId||record.image?.$syncBlob!==selected.image.$syncBlob||record.correction?.status==='open')throw new Error('Фотография изменилась после выбора. Обновите список и выберите её заново.');
  let source=null;try{if(record.sourceMediaId)source=(await json('/sync/record/media/'+encodeURIComponent(record.sourceMediaId))).record;}catch{}
  const original=record.originalFinalImage?.$syncBlob&&record.originalFinalImage.$syncBlob!==source?.blob?.$syncBlob?record.originalFinalImage:record.image;
  const file=await blob(original);let printOriginalBlob=null;try{if(source?.blob)printOriginalBlob=await blob(source.blob);}catch{}
  works.push({...record,title:selected.title,image:file,originalFinalImage:file,mergedPrintImage:file,blob:file,_selectedImageHash:selected.image.$syncBlob,printOriginalBlob});
 }
 return works;
}

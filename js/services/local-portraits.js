export const PIRATE_SERVICE = 'child-boy-pirate-captain';
export const LOCAL_ONLY = ['127.0.0.1', 'localhost'].includes(globalThis.location?.hostname);
export function mutatePortraitDraft(db, orderId, serviceId, update, work=null) {
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(['orders','finalWorks'],'readwrite');
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Заказ изменён. Откройте карточку снова.'));
    tx.objectStore('orders').get(orderId).onsuccess=e=>{
      const order=e.target.result;if(!order){tx.abort();return;}
      tx.objectStore('finalWorks').getAll().onsuccess=event=>{
        if(event.target.result.some(w=>w.studentId===order.studentId&&w.serviceId===serviceId)){tx.abort();return;}
        try {
          const localPortraits={...order.localPortraits},next=update(localPortraits[serviceId]);
          if(next)localPortraits[serviceId]=next;else delete localPortraits[serviceId];
          tx.objectStore('orders').put({...order,localPortraits,updatedAt:new Date().toISOString()});
          if(work)tx.objectStore('finalWorks').add(work);
        }catch{tx.abort();}
      };
    };
  });
}
export function portraitSources(order, media, serviceId) {
  const task = (order.items || []).find(t => t.type === `${serviceId}__portrait`)
    || (order.items || []).find(t => t.type === 'portrait');
  if (!task) return [];
  return media.filter(m => m.studentId === order.studentId && m.blob instanceof Blob && m.blob.size > 0
    && ['photo','image'].includes(m.type)
    && ((task.fileIds || []).includes(m.id) || m.orderType === task.type));
}
export function portraitPlan({students, orders, media, finalWorks}, serviceIds) {
  const ready=[], skipped=[];
  for(const student of students) {
    const order=orders.find(o=>o.studentId===student.id);
    for(const serviceId of serviceIds(student)) {
      const job={studentId:student.id, serviceId, orderId:order?.id, name:`${student.firstName} ${student.lastName}`};
      const sources=order ? portraitSources(order,media,serviceId) : [];
      let reason='';
      if(!order)reason='Нет заказа';
      else if(order.localPortraits?.[serviceId] || finalWorks.some(w=>w.studentId===student.id&&w.serviceId===serviceId))reason='Уже есть черновик или готовая работа';
      else if(serviceId!==PIRATE_SERVICE)reason='Автоматическая обработка ещё не настроена';
      else if(!sources.length)reason='Нет фото в портретной задаче';
      else if(sources.length!==1)reason='Несколько портретов — выберите исходник в карточке';
      if(reason)skipped.push({...job,reason});else ready.push({...job,sourceId:sources[0].id});
    }
  }
  return {ready,skipped};
}
export async function runPortraitQueue(plan, process, onProgress=()=>{}) {
  const result={processed:0,skipped:plan.skipped.length,errors:[]};
  for(const job of plan.ready) {
    try { const saved=await process(job); if(saved===false)result.skipped++;else result.processed++; }
    catch(error){result.errors.push({...job,message:error.message});}
    onProgress(result);
  }
  return result;
}
async function localRequest(path, options={}) {
  if(!LOCAL_ONLY)throw new Error('Откройте локальную CRM: http://127.0.0.1:4175');
  let response;
  try {response=await fetch(`/local-portraits${path}`,{...options,signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json',...options.headers}});}
  catch {throw new Error('Локальный сервис недоступен. Запустите scripts/local-portraits/server.py и откройте http://127.0.0.1:4175.');}
  const data=await response.json().catch(()=>({error:'Запустите CRM через scripts/local-portraits/server.py (порт 4175).'}));
  if(!response.ok)throw new Error(data.error||'Ошибка локальной обработки');
  return data;
}
export async function renderLocalPortrait(source, comment) {
  const sourceData=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(source);});
  const {id}=await localRequest('/jobs',{method:'POST',body:JSON.stringify({serviceId:PIRATE_SERVICE,source:sourceData,comment})});
  for(let n=0;n<1200;n++) {
    await new Promise(resolve=>setTimeout(resolve,1000));
    const job=await localRequest(`/jobs/${id}`);
    if(job.status==='error')throw new Error(job.error);
    if(job.status==='done')return new Blob([Uint8Array.from(atob(job.image),c=>c.charCodeAt(0))],{type:'image/png'});
  }
  throw new Error('Обработка заняла больше 20 минут. Проверьте ComfyUI; предыдущий черновик сохранён.');
}

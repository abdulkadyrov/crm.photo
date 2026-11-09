import {PIRATE_SERVICE, portraitSources, portraitPlan, runPortraitQueue, renderLocalPortrait} from '../services/local-portraits.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createPortraitPanel(hooks) {
  const locked=fn=>navigator.locks.request('crm-local-portraits',{ifAvailable:true},lock=>{
    if(!lock)throw new Error('Обработка уже идёт в другой вкладке. Дождитесь завершения.');
    return fn();
  });
  async function process(job, replace=false) {
    await hooks.refresh();
    let data=hooks.data(), order=data.orders.find(o=>o.id===job.orderId);
    if(!order)throw new Error('Заказ удалён');
    if(data.finalWorks.some(w=>w.studentId===job.studentId&&w.serviceId===job.serviceId))return false;
    if(order.localPortraits?.[job.serviceId]&&!replace)return false;
    if(job.serviceId!==PIRATE_SERVICE)throw new Error('Автоматическая обработка ещё не настроена');
    const source=portraitSources(order,data.media,job.serviceId).find(m=>m.id===job.sourceId);
    if(!source)throw new Error('Портрет больше не доступен в заказе');
    const student=data.students.find(s=>s.id===job.studentId);
    const comment=hooks.comment(student,job.serviceId);
    const image=await renderLocalPortrait(source.blob,comment);
    await hooks.saveDraft(job,{id:crypto.randomUUID(),image,sourceMediaId:source.id,comment,createdAt:new Date().toISOString(),manualReview:true});
    return true;
  }
  function dialog(title) {
    const panel=document.createElement('dialog');panel.className='cloud-dialog';
    panel.innerHTML=`<div class="card-header"><h2>${esc(title)}</h2><button data-close type="button">Закрыть</button></div><div data-body></div><p data-status role="status" aria-live="polite"></p>`;
    document.body.append(panel); panel.showModal();
    panel.querySelector('[data-close]').onclick=()=>panel.close();
    panel.addEventListener('close',()=>panel.remove());
    return panel;
  }
  async function student(studentId) {
    await hooks.refresh();
    const panel=dialog('Подготовить работу'), urls=[];
    panel.addEventListener('close',()=>urls.forEach(URL.revokeObjectURL));
    const url=blob=>{const value=URL.createObjectURL(blob);urls.push(value);return value;};
    const body=panel.querySelector('[data-body]'), status=panel.querySelector('[data-status]');
    let busy=false;
    panel.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
    async function action(fn) {
      if(busy)return;busy=true;
      panel.querySelectorAll('button,select,input').forEach(n=>n.disabled=true);
      status.textContent='Обработка… Дождитесь завершения, не закрывайте CRM.';
      try {await locked(fn);await hooks.refresh();render();status.textContent='Сохранено локально';}
      catch(error){status.textContent=error.message;}
      finally{busy=false;panel.querySelectorAll('button,select,input').forEach(n=>n.disabled=false);}
    }
    let selected='';
    function render() {
      urls.splice(0).forEach(URL.revokeObjectURL);
      const data=hooks.data(), child=data.students.find(s=>s.id===studentId), order=data.orders.find(o=>o.studentId===studentId);
      const services=hooks.serviceIds(child).map(id=>data.catalog.find(s=>s.id===id)).filter(Boolean);
      selected=services.some(s=>s.id===selected)?selected:services[0]?.id;
      if(!order||!services.length){body.textContent='В заказе нет услуги.';return;}
      const service=services.find(s=>s.id===selected), draft=order.localPortraits?.[selected];
      const sources=portraitSources(order,data.media,selected);
      const approved=data.finalWorks.some(w=>w.studentId===studentId&&w.serviceId===selected);
      body.innerHTML=`<label>Услуга <select data-service>${services.map(s=>`<option value="${esc(s.id)}" ${s.id===selected?'selected':''}>${esc(s.title||s.name)}</option>`).join('')}</select></label>
        ${selected!==PIRATE_SERVICE?'<p>Автоматическая обработка ещё не настроена</p>':''}
        <p>Комментарий: ${esc(hooks.comment(child,selected)||'Нет комментария')}</p>
        <div class="montage-grid">${sources.map((s,i)=>`<label><input type="radio" name="portrait-source" value="${esc(s.id)}" ${sources.length===1||draft?.sourceMediaId===s.id?'checked':''}><img class="montage-preview" src="${url(s.blob)}" alt="Исходник ${i+1}">${esc(s.fileName||'Портрет')}</label>`).join('')||'<p>Нет фото в портретной задаче. Добавьте фото в чеклист портрета.</p>'}
        ${draft?`<article><h3>Черновик</h3><img class="montage-preview" src="${url(draft.image)}" alt="Черновик"><p>${esc(draft.comment||'')}</p><p>Проверьте вручную перед утверждением: лицо, маску и пожелания из комментария.</p></article>`:''}</div>
        ${approved?'<p>Готовая работа уже утверждена. Она не будет перезаписана.</p>':`<div class="toolbar">${selected===PIRATE_SERVICE&&sources.length?`<button data-run type="button">${draft?'Переделать':'Подготовить черновик'}</button>`:''}${draft?'<button data-approve type="button">Утвердить и создать A4</button><button data-delete type="button">Удалить черновик</button>':''}</div>`}`;
      body.querySelector('[data-service]').onchange=e=>{selected=e.target.value;render();};
      body.querySelector('[data-run]')?.addEventListener('click',()=>{
        const sourceId=body.querySelector('input:checked')?.value;
        if(!sourceId){status.textContent='Выберите исходник по превью.';return;}
        action(()=>process({studentId,orderId:order.id,serviceId:selected,sourceId},Boolean(draft)));
      });
      body.querySelector('[data-approve]')?.addEventListener('click',()=>action(()=>hooks.approve(order.id,selected,draft.id)));
      body.querySelector('[data-delete]')?.addEventListener('click',()=>action(()=>hooks.deleteDraft(order.id,selected,draft.id)));
    }
    render();
  }
  async function batch(students,title) {
    await hooks.refresh();
    const plan=portraitPlan({...hooks.data(),students},hooks.serviceIds);
    const panel=dialog(title), body=panel.querySelector('[data-body]'), status=panel.querySelector('[data-status]');
    body.innerHTML=`<p>Готово к обработке: ${plan.ready.length}. Пропущено: ${plan.skipped.length}.</p><ul>${plan.skipped.map(j=>`<li>${esc(j.name)} · ${esc(hooks.data().catalog.find(s=>s.id===j.serviceId)?.title||j.serviceId)}: ${esc(j.reason)}</li>`).join('')}</ul><button data-start type="button" ${plan.ready.length?'':'disabled'}>Запустить последовательно</button>`;
    let busy=false;panel.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
    body.querySelector('[data-start]').onclick=async e=>{
      busy=true;e.target.disabled=true;panel.querySelector('[data-close]').disabled=true;
      try {
        const result=await locked(()=>runPortraitQueue(plan,process,r=>{status.textContent=`Обработано: ${r.processed}, пропущено: ${r.skipped}, ошибок: ${r.errors.length}`;}));
        status.textContent=`Обработано: ${result.processed}, пропущено: ${result.skipped}, ошибок: ${result.errors.length}. ${result.errors.map(j=>`${j.name}: ${j.message}`).join('; ')}`;
      } catch(error){status.textContent=error.message;}
      finally{busy=false;panel.querySelector('[data-close]').disabled=false;await hooks.refresh();}
    };
  }
  return {student,batch};
}

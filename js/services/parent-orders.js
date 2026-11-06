import { captureDialogReturn } from './dialog-return.js';
import { cloudAccount } from './cloud-workspace.js';
import { parentOrderItemLabel } from './parent-order-model.js';
let hooks;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path,body,method=body?'POST':'GET') {
 const r=await fetch('/api/v1'+path,{method,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(body instanceof Blob?180000:30000),headers:body&&!(body instanceof Blob)?{'Content-Type':'application/json'}:{},body:body instanceof Blob?body:body?JSON.stringify(body):undefined});
 const data=await r.json();if(!r.ok){const e=new Error(data.error||'Ошибка сервера');e.status=r.status;throw e;}return data;
}
async function media(source) {
 if(!source)return '';
 const url=new URL(source,location.href);
 if(url.protocol==='https:'&&url.hostname==='crm.khanzama.ru')return url.href;
 if(url.protocol==='https:'&&url.hostname==='zakaz.khanzama.ru')return url.href;
 const response=await fetch(source);if(!response.ok)throw new Error('Не удалось прочитать превью услуги');
 const blob=await response.blob();const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm'}[blob.type.split(';')[0]];
 if(!ext)throw new Error('Превью должно быть JPEG, PNG, WebP, MP4 или WebM');
 if(blob.size>100*1024*1024)throw new Error('Превью больше 100 МБ');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join('');
 const path='/parents/media/'+hash+'.'+ext;const known=await api(path);
 return known.exists?known.url:(await api(path,blob)).url;
}
let syncing=false;
const reported=new Set();
export function mountParentOrders(context){
 hooks=context;
 const sync=async()=>{
  if(syncing||!navigator.onLine||!['admin','manager'].includes(cloudAccount()?.role)||document.querySelector('dialog[open]'))return;
  syncing=true;
  try {
   for(const project of hooks.projects()){
    let orders;try{orders=await api('/parents/orders/'+project.id);}catch(e){if(e.status===404||e.status===403)continue;throw e;}
    for(const order of orders){
     if(hooks.isApplied(order))continue;
     if(hooks.canAutoApply(order)){await hooks.apply(order);hooks.notify(`Заказ ${order.order_number} добавлен в карточку ребёнка`);}
     else if(!reported.has(order.id)){reported.add(order.id);hooks.notify(`Новый заказ ${order.child_name}: откройте «Заказы родителей и ссылка» в меню класса для проверки`);}
    }
   }
  }catch{/* Existing local work remains available if the server is unreachable. */}finally{syncing=false;}
 };
 window.addEventListener('online',sync);setInterval(sync,60000);void sync();
}
export async function showParentOrders(classId,trigger) {
 if(!cloudAccount())return hooks.notify('Сначала войдите в серверный аккаунт');
 const payload=hooks.classData(classId);if(!payload)return;
 const restore=captureDialogReturn(document,window,trigger);
 const d=document.createElement('dialog');d.className='cloud-dialog';d.setAttribute('aria-label','Заказы родителей');
 d.innerHTML=`<div class="cloud-head"><h2>Заказы родителей · ${esc(payload.name)}</h2><button data-close>Закрыть</button></div><p data-status role="status"></p><div data-body></div>`;
 document.body.append(d);d.showModal();history.pushState({...history.state,parentOrdersModal:true},'');
 const back=()=>d.close();window.addEventListener('popstate',back,{once:true});
 d.onclose=()=>{window.removeEventListener('popstate',back);d.remove();if(history.state?.parentOrdersModal)history.back();restore();};d.querySelector('[data-close]').onclick=()=>d.close();
 const status=message=>d.querySelector('[data-status]').textContent=message;
 let current=null;
 async function load(){
  status('Загрузка…');
  try {current=await api('/parents/classes/'+classId);} catch(e){if(e.status!==404)throw e;}
  const orders=await api('/parents/orders/'+payload.projectId);
  const own=orders.filter(o=>o.class_id===classId);
  const editable=['admin','manager'].includes(cloudAccount().role);
  d.querySelector('[data-body]').innerHTML=`${current?`<p>${current.enabled?'Приём заказов открыт':'Приём заказов закрыт'}</p><label>Ссылка для родителей<input readonly data-link value="${esc(current.url)}"></label><button data-copy>Копировать ссылку</button><p><img src="${esc(hooks.qr(current.url))}" width="180" height="180" alt="QR-код ссылки класса"></p><a href="${esc(hooks.qr(current.url))}" download="class-order-qr.svg">Скачать QR-код</a>`:'<p>Класс ещё не опубликован. Список детей будет доступен по ссылке класса.</p>'}${editable?`<details ${!current?'open':''}><summary>Дети и доступные услуги</summary><p>В CRM: ${payload.children.length} детей. Публикация использует их существующие карточки.</p><div>${payload.catalog.map(v=>`<label class="checkbox-row"><input type="checkbox" data-service value="${esc(v.id)}" ${!current||current.services.includes(v.id)?'checked':''}>${esc(v.name)}</label>`).join('')}</div><label class="checkbox-row"><input type="checkbox" data-enabled ${!current||current.enabled?'checked':''}>Принимать заказы</label><button data-publish>Сохранить и обновить ссылку</button></details>`:''}<h3>Заказы (${own.length})</h3><button data-refresh>Обновить</button>${own.map(o=>`<article class="panel"><strong>${esc(o.child_name)}</strong><p>${esc(o.selected_items.map(parentOrderItemLabel).join(', '))}</p><small>${esc(o.order_number)}</small>${editable?`<button data-apply="${esc(o.id)}">${hooks.isApplied(o)?'Уже добавлен на устройстве':'Добавить в карточку ребёнка'}</button>`:''}</article>`).join('')||'<p>Заказов пока нет.</p>'}`;
  d.querySelector('[data-copy]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(current.url);status('Ссылка скопирована');}catch{d.querySelector('[data-link]').select();status('Скопируйте выделенную ссылку');}});
  d.querySelector('[data-refresh]').onclick=()=>run(load);
  d.querySelector('[data-publish]')?.addEventListener('click',()=>run(async()=>{
   const selected=[...d.querySelectorAll('[data-service]:checked')].map(v=>v.value);if(!selected.length)throw new Error('Выберите услуги для класса');
   if(cloudAccount().role==='admin'){
    status('Публикуем каталог и превью…');
    const items=[];for(const item of payload.catalog.filter(v=>selected.includes(v.id)))items.push({...item,preview_url:await media(item.preview_url),preview_video_url:await media(item.preview_video_url)});
    await api('/parents/catalog',{items});
   }
   current=await api('/parents/classes/'+classId,{...payload,catalog:undefined,services:selected,revision:current?.revision||0,enabled:d.querySelector('[data-enabled]').checked});await load();status('Сохранено. Ссылка готова для родителей.');
  }));
  d.querySelectorAll('[data-apply]').forEach(b=>b.onclick=()=>run(async()=>{const o=own.find(v=>v.id===b.dataset.apply);if(!hooks.isApplied(o)){const applied=await hooks.apply(o);if(applied===false)return;}await load();status('Заказ добавлен. Повторное получение не создаст дубль.');}));
  status('Соединение установлено');
 }
 async function run(action){d.querySelectorAll('button').forEach(b=>b.disabled=true);try{await action();}catch(e){status(e.message);}finally{d.querySelectorAll('button').forEach(b=>b.disabled=false);}}
 await run(async()=>{if(cloudAccount().role==='admin')await api('/projects',{id:payload.projectId,name:payload.projectName});await load();});
}

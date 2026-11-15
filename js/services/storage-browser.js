const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function storageSize(value){if(value==null)return '—';const units=['Б','КБ','МБ','ГБ','ТБ'];let n=Number(value),i=0;while(n>=1024&&i<units.length-1){n/=1024;i++;}return `${n.toLocaleString('ru-RU',{maximumFractionDigits:i?1:0})} ${units[i]}`;}
export async function mountStorageBrowser(target,{load}){
 let path='',request=0;
 target.innerHTML='<section class="storage-browser"><p class="storage-intro">Файлы в S3 — по папкам. Здесь можно посмотреть размеры и состав, без изменения файлов.</p><div data-storage-summary></div><nav class="storage-breadcrumbs" aria-label="Папки S3" data-storage-breadcrumbs></nav><p data-storage-status role="status"></p><div class="storage-list" data-storage-list></div><button class="secondary-button compact" data-storage-more hidden>Показать ещё</button></section>';
 async function open(prefix='',offset=0){
  const id=++request;path=prefix;const status=target.querySelector('[data-storage-status]');status.textContent='Получаем список…';
  try{
   const data=await load(prefix,offset);if(id!==request)return;
   const ready=data.totalObjects!=null,queued=(data.mirror||[]).filter(row=>row.state!=='ready').reduce((n,row)=>n+row.count,0);
   target.querySelector('[data-storage-summary]').innerHTML=`<dl class="storage-metrics"><div><dt>В этой папке S3</dt><dd>${storageSize(data.totalBytes)}</dd></div><div><dt>Объектов</dt><dd>${ready?data.totalObjects:'—'}</dd></div></dl><p class="storage-mirror-note">${queued?`Ещё ожидают копирования в S3: <strong>${queued}</strong>. Файлы остаются на сервере CRM.`:'Очередь копирования CRM в S3 пуста.'}</p><small class="storage-snapshot">${data.updatedAt?`Список проверен ${new Date(data.updatedAt*1000).toLocaleString('ru-RU')}. Обновляется каждые 10 минут.`:'Снимок S3 ещё не готов. Не считаем хранилище пустым.'}</small>`;
   const segments=prefix.split('/').filter(Boolean);let current='';const crumbs=[{path:'',label:'S3'}];for(const part of segments){current+=part+'/';crumbs.push({path:current,label:part});}
   target.querySelector('[data-storage-breadcrumbs]').innerHTML=crumbs.map((crumb,index)=>`<button type="button" data-storage-path="${esc(crumb.path)}" ${index===crumbs.length-1?'aria-current="page"':''}>${esc(crumb.label)}</button>`).join('<span aria-hidden="true">/</span>');
   target.querySelectorAll('[data-storage-path]').forEach(button=>button.onclick=()=>open(button.dataset.storagePath));
   const list=target.querySelector('[data-storage-list]');if(!offset)list.innerHTML='';
   list.insertAdjacentHTML('beforeend',data.entries.map(entry=>entry.kind==='folder'?`<button type="button" class="storage-entry storage-folder" data-storage-folder="${esc(entry.prefix)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h7l2 2h9v12H3z"/></svg><span><strong>${esc(entry.name)}</strong><small>${entry.objects} объектов · ${storageSize(entry.bytes)}</small></span><b aria-hidden="true">›</b></button>`:`<div class="storage-entry storage-file"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h9l5 5v13H5zM14 3v6h5"/></svg><span><strong title="${esc(entry.name)}">${esc(entry.label||entry.name)}</strong>${entry.context?`<small>${esc(entry.context)}</small>`:''}<small>${storageSize(entry.bytes)}${entry.modified?' · '+esc(new Date(entry.modified).toLocaleDateString('ru-RU')):''}</small></span></div>`).join(''));
   list.querySelectorAll('[data-storage-folder]').forEach(button=>button.onclick=()=>open(button.dataset.storageFolder));
   if(!data.entries.length&&!offset)list.innerHTML=`<p class="storage-empty">${ready?'В этой папке нет объектов.':'Ожидаем первый снимок S3.'}</p>`;
   status.textContent=data.status==='error'?'S3 сейчас недоступно. Показан последний сохранённый снимок.':data.status==='scanning'?'Обновляем снимок S3 в фоне.':'';
   const more=target.querySelector('[data-storage-more]');more.hidden=data.nextOffset==null;more.onclick=()=>open(path,data.nextOffset);
  }catch{if(id===request)status.textContent='Не удалось получить список. Нажмите «Обновить» в шапке кабинета.';}
 }
 await open();
}

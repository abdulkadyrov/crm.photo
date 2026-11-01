const API = '/api/v1';
const ACCOUNT = 'crm-server-account-v1';
export const cloudRequired = location.hostname === 'crm.khanzama.ru';
let account = null;
try { account = JSON.parse(localStorage.getItem(ACCOUNT) || 'null'); } catch { localStorage.removeItem(ACCOUNT); }
let hooks, dialog, busy = false, queueDB;
const roles = { admin: 'Администратор', manager: 'Менеджер', photographer: 'Фотограф', viewer: 'Просмотр' };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const saveAccount = u => { account=u; u ? localStorage.setItem(ACCOUNT,JSON.stringify(u)) : localStorage.removeItem(ACCOUNT); };
export const cloudAccount = () => account;
export const cloudDatabase = () => account && account.role !== 'admin' ? `school-photo-cloud-${account.id}` : 'school-photo-flow';
export const canSeeMoney = () => !cloudRequired || account?.role === 'admin';
export function assertCloudWrite(store, value, deleting=false) {
  if (!cloudRequired || !account || account.role==='admin') return;
  if (store==='settings' || store==='operatorEvents') return;
  if (store==='projects' && !account.projects?.includes(value?.id)) throw new Error('Новые проекты и доступ назначает администратор');
  if (account.role==='viewer') throw new Error('Роль «Просмотр»: изменения недоступны');
  if (account.role==='photographer' && !['media','students','orders'].includes(store)) throw new Error('Фотограф может сохранять съёмки и отметки оплаты');
  if (deleting && account.role==='photographer') throw new Error('Удаление доступно менеджеру или администратору');
}
async function api(path, options={}) {
  const response = await fetch(API+path,{ credentials:'same-origin', cache:'no-store', signal:AbortSignal.timeout(options.body instanceof Blob ? 300000 : 15000), ...options, headers:{ ...(options.body && typeof options.body==='string' ? {'Content-Type':'application/json'} : {}), ...options.headers } });
  if (!response.ok) { const data=await response.json().catch(()=>({})); throw new Error(data.error || `Ошибка сервера ${response.status}`); }
  return response;
}
const json = async (path,options) => (await api(path,options)).json();
const post = (path,data) => json(path,{method:'POST',body:JSON.stringify(data)});
function status(message) { const node=dialog?.querySelector('[data-cloud-status]'); if(node) node.textContent=message; }
function openDialog(required=false) {
  if(dialog?.open) return;
  dialog=document.createElement('dialog'); dialog.className='cloud-dialog'; dialog.setAttribute('aria-label','Сервер и сотрудники');
  dialog.innerHTML=`<div class="cloud-head"><h2>Сервер и сотрудники</h2>${required?'':'<button type="button" data-close>Закрыть</button>'}</div><p data-cloud-status role="status" aria-live="polite"></p><div data-cloud-body></div>`;
  const origin=document.activeElement; const y=window.scrollY;
  const instance=dialog;
  if(!required) history.pushState({...history.state,crmCloudModal:true},'');
  const onBack=()=>{if(instance.open)instance.close();};
  if(!required)window.addEventListener('popstate',onBack,{once:true});
  dialog.addEventListener('cancel',e=>{ if(required)e.preventDefault(); });
  dialog.addEventListener('close',()=>{window.removeEventListener('popstate',onBack);instance.remove();if(!required&&history.state?.crmCloudModal)history.back();origin?.focus({preventScroll:true});window.scrollTo(0,y);});
  dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());
  document.body.append(dialog); dialog.showModal();
}
function loginForm(onSuccess) {
  dialog.querySelector('[data-cloud-body]').innerHTML=`<p>Войди в аккаунт, созданный администратором. После первого входа загруженные проекты доступны без интернета.</p><form data-login class="grid"><label>Логин<input name="login" autocomplete="username" required></label><label>Пароль<input name="password" type="password" autocomplete="current-password" required></label><button class="primary-button">Войти</button></form>`;
  dialog.querySelector('[data-login]').onsubmit=async e=>{e.preventDefault(); const button=e.target.querySelector('button');button.disabled=true;status('Вход…');try {const u=await post('/login',Object.fromEntries(new FormData(e.target))); saveAccount(u); onSuccess(u);} catch(err){status(err.message);}finally{button.disabled=false;}};
}
export async function initializeCloud() {
  if (!cloudRequired) return;
  document.documentElement.dataset.cloudRole=account?.role || 'guest';
  try { const response=await fetch(API+'/me',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(8000)}); if(response.ok) saveAccount(await response.json()); else if(response.status===401) saveAccount(null); }
  catch { /* Cached account is an offline workspace identity, never a server credential. */ }
  if (!account) {
    openDialog(true);
    await new Promise(resolve=>loginForm(()=>{dialog.close();resolve();}));
  }
  document.documentElement.dataset.cloudRole=account.role;
}
async function db() {
  if(!queueDB) queueDB=new Promise((resolve,reject)=>{const r=indexedDB.open('crm-cloud-transfer-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('queue',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  return queueDB;
}
async function queue(action,value) {
  const database=await db();return new Promise((resolve,reject)=>{const tx=database.transaction('queue',action==='getAll'?'readonly':'readwrite');const r=tx.objectStore('queue')[action](value);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
}
export async function enqueueCloud(kind,id) {
  if(!account) return showCloud();
  if(account.role==='viewer') return hooks.notify('Роль «Просмотр» не может отправлять изменения');
  try {
    hooks.notify('Подготовка архива. Не закрывайте приложение…');
    const packet=await hooks.export(kind,id);
    if(packet.blob.size>1024*1024*1024)throw new Error('Архив больше 1 ГБ. Отправьте отдельную группу');
    const item={id:crypto.randomUUID(),userId:account.id,createdAt:Date.now(),...packet,state:'waiting'};
    await queue('put',item);
    hooks.notify(navigator.onLine ? 'Архив сохранён в очереди. Отправляем…' : 'Архив сохранён на устройстве. Отправим после подключения');
    await drain();
    if(dialog?.open) await showRefresh();
  } catch(e) {hooks.notify(`Не отправлено: ${e.message}`);}
}
async function drain() {
  if(busy || !account || !navigator.onLine) return;
  busy=true;
  try {
    const fresh=await json('/me');
    if(fresh.id!==account.id) throw new Error('Аккаунт изменился. Войдите заново');
    const roleChanged=fresh.role!==account.role; saveAccount(fresh);
    if(roleChanged){location.reload();return;}
    for(const item of await queue('getAll')) {
      if(item.userId!==account.id || item.state==='sent') continue;
      try {
        if(account.role==='admin') await post('/projects',{id:item.projectId,name:item.projectName});
        status(`Отправка «${item.name}»…`);
        await api('/packages/'+item.id,{method:'POST',headers:{'Content-Type':'application/zip','X-Project-Id':item.projectId,'X-Group-Id':item.groupId||'','X-Package-Name':encodeURIComponent(item.name)},body:item.blob});
        await queue('put',{...item,blob:null,state:'sent',error:'',sentAt:Date.now()});
        hooks.notify(`«${item.name}» отправлено на сервер`);
      } catch(e){await queue('put',{...item,state:'error',error:e.message});hooks.notify(`Отправка сохранена в очереди: ${e.message}`);break;}
    }
  } catch(e){status(`Очередь сохранена. ${e.message}`);} finally {busy=false;}
}
export function mountCloud(context) {
  hooks=context;
  const button=document.createElement('button');button.type='button';button.className='secondary-button';button.textContent='Сервер';button.onclick=()=>showCloud();document.querySelector('.topbar-actions')?.prepend(button);
  window.addEventListener('online',()=>drain());
  // A previous manual submission may resume while this application is open.
  if(account) drain();
}
export async function showCloud() {
  openDialog();
  if(!account) {loginForm(()=>location.reload());return;}
  const body=dialog.querySelector('[data-cloud-body]');
  body.innerHTML=`<p>${esc(account.name)} · ${esc(roles[account.role])}</p><p>Сначала работай на устройстве. «Отправить на сервер» сохраняет отдельную версию проекта или группы. Уже отправленные версии не перезаписываются.</p><div class="cloud-actions"><button data-refresh>Обновить</button><button data-retry>Повторить отправку очереди</button><button data-password>Сменить пароль</button><button data-logout>Выйти</button></div><h3>На этом устройстве</h3><div data-local></div><h3>Очередь отправки</h3><div data-queue></div><h3>На сервере</h3><div data-projects></div>${account.role==='admin'?'<h3>Сотрудники и права</h3><div data-users></div>':''}`;
  body.querySelector('[data-refresh]').onclick=()=>showRefresh();
  body.querySelector('[data-retry]').onclick=async()=>{await drain();await showRefresh();};
  body.querySelector('[data-logout]').onclick=async()=>{try{await post('/logout',{});saveAccount(null);location.reload();}catch(e){status('Для выхода подключитесь к интернету: '+e.message);}};
  body.querySelector('[data-password]').onclick=()=>passwordForm();
  const local=body.querySelector('[data-local]');
  for(const p of hooks.projects()) {
    if(account.role!=='admin' && !account.projects.includes(p.id)) continue;
    const row=document.createElement('div');row.className='cloud-row';row.innerHTML=`<strong>${esc(p.name)}</strong>`;
    const send=document.createElement('button');send.textContent='Отправить проект на сервер';send.disabled=account.role==='viewer';send.onclick=()=>enqueueCloud('project',p.id);row.append(send);local.append(row);
    for(const group of hooks.groups(p.id)){const b=document.createElement('button');b.textContent=`Отправить группу: ${group.name}`;b.disabled=account.role==='viewer';b.onclick=()=>enqueueCloud('class',group.id);local.append(b);}
  }
  await showRefresh();
}
async function showRefresh() {
  if(!dialog?.open)return;
  const queueNode=dialog.querySelector('[data-queue]');
  if(!queueNode)return;
  const items=(await queue('getAll')).filter(i=>i.userId===account.id).sort((a,b)=>b.createdAt-a.createdAt);
  queueNode.innerHTML=items.length?items.map(i=>`<p>${esc(i.name)} — ${i.state==='sent'?'Отправлено '+new Date(i.sentAt).toLocaleString():i.state==='error'?'Не отправлено: '+esc(i.error):'Ожидает интернета'}</p>`).join(''):'<p>Нет отправок</p>';
  try {
    const projects=await json('/projects');const target=dialog.querySelector('[data-projects]');target.innerHTML='';
    for(const p of projects){const row=document.createElement('div');row.className='cloud-row';row.innerHTML=`<strong>${esc(p.name)}</strong>`;const b=document.createElement('button');b.textContent='Версии и получение';b.onclick=()=>versions(p,row);row.append(b);target.append(row);}
    if(!projects.length)target.textContent='Проектов пока нет. Администратор отправляет проект и назначает его сотрудникам.';
    if(account.role==='admin') await users(projects);
    status(navigator.onLine?'Соединение с сервером установлено':'Работа без интернета');
  } catch(e){status(`Сервер недоступен: ${e.message}. Локальные проекты и очередь сохранены.`);}
}
async function versions(project,row) {
  try{const list=await json('/projects/'+encodeURIComponent(project.id)+'/packages');row.querySelector('[data-versions]')?.remove();const box=document.createElement('div');box.dataset.versions='';row.append(box);
    for(const v of list){const b=document.createElement('button');let name=v.name;try{name=decodeURIComponent(name);}catch{}b.textContent=`Получить: ${name} · ${roles[v.role]} · ${new Date(v.created*1000).toLocaleString()}`;b.onclick=async()=>{b.disabled=true;try{status('Получение архива…');const blob=await(await api('/packages/'+v.id)).blob();dialog.close();await hooks.import(blob,project.id);status('Архив получен. Изменения применяются через проверку импорта');}catch(e){status(e.message);}finally{b.disabled=false;}};box.append(b);}
    if(!list.length)box.textContent='Отправленных версий пока нет';
  }catch(e){status(e.message);}
}
async function users(projects) {
  const target=dialog.querySelector('[data-users]');if(!target)return;
  const list=await json('/users');target.innerHTML='<button data-new-user>Создать аккаунт</button><div data-user-list></div><div data-user-form></div>';
  target.querySelector('[data-new-user]').onclick=()=>userForm({},projects);
  for(const u of list){const b=document.createElement('button');b.textContent=`${u.name} (${u.login}) · ${roles[u.role]}${u.active?'':' · отключён'}`;b.onclick=()=>userForm(u,projects);target.querySelector('[data-user-list]').append(b);}
}
function userForm(u,projects) {
  const target=dialog.querySelector('[data-user-form]');
  target.innerHTML=`<form class="grid"><h4>${u.id?'Изменить аккаунт':'Новый аккаунт'}</h4><label>Имя<input name="name" value="${esc(u.name)}" required></label><label>Логин<input name="login" value="${esc(u.login)}" required pattern="[a-zA-Z0-9_.@-]{3,80}" autocomplete="off"></label><label>${u.id?'Новый пароль (пусто — сохранить прежний)':'Пароль'}<input name="password" type="password" minlength="12" maxlength="128" autocomplete="new-password" ${u.id?'':'required'}></label><label>Роль<select name="role">${Object.entries(roles).map(([k,v])=>`<option value="${k}" ${(u.role||'photographer')===k?'selected':''}>${v}</option>`).join('')}</select></label><p>Администратор видит деньги и управляет аккаунтами. Менеджер управляет назначенными проектами без финансов. Фотограф отправляет снимки и отметки оплаты. Просмотр получает проекты без изменений.</p><fieldset><legend>Доступные проекты</legend>${projects.map(p=>`<label><input type="checkbox" name="projects" value="${esc(p.id)}" ${(u.projects||[]).includes(p.id)?'checked':''}> ${esc(p.name)}</label>`).join('')}</fieldset><label><input type="checkbox" name="active" ${u.active!==0?'checked':''}> Аккаунт включён</label><button class="primary-button">Сохранить</button></form>`;
  target.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const b=e.target.querySelector('button');b.disabled=true;try{await post('/users',{id:u.id,name:f.get('name'),login:f.get('login'),password:f.get('password'),role:f.get('role'),projects:f.getAll('projects'),active:f.has('active')});status('Аккаунт сохранён. Передай сотруднику логин и пароль лично');await users(projects);}catch(err){status(err.message);}finally{b.disabled=false;}};
}
function passwordForm(){const target=dialog.querySelector('[data-cloud-body]');target.innerHTML='<form class="grid"><label>Текущий пароль<input name="current" type="password" required autocomplete="current-password"></label><label>Новый пароль<input name="password" type="password" minlength="12" maxlength="128" required autocomplete="new-password"></label><button>Сохранить пароль</button></form>';target.querySelector('form').onsubmit=async e=>{e.preventDefault();try{await post('/password',Object.fromEntries(new FormData(e.target)));saveAccount(null);location.reload();}catch(err){status(err.message);}};}

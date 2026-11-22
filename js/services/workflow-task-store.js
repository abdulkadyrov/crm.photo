/** Account-scoped durable plans/outbox. Workflow completion lives in normal CRM records. */
export function createWorkflowTaskStore({account=()=>null,enabled=()=>true,storage=globalThis.localStorage,fetch:request=globalThis.fetch?.bind(globalThis),onChange=()=>{},win=globalThis.window,now=()=>Date.now(),id=()=>globalThis.crypto.randomUUID()}={}) {
  let identity='', cache, busy=false, destroyed=false, timer, failures=0,lastEmitted='';
  const photoFields=new Set(['sourcePurpose','sourceMediaId','sourceReviewedAt','reviewedSourceIds','note','reason']);
  const available=()=>typeof enabled==='function'?enabled():enabled;
  const who=()=>typeof account==='function'?account():account;
  const key=()=>`crm-workflow-tasks-v1:${identity}`;
  const clone=value=>JSON.parse(JSON.stringify(value));
  function selectAccount(){
    const next=String(who()?.id||'local');
    if(identity===next){scrubAccess();return;}
    identity=next;
    try{cache=JSON.parse(storage?.getItem(key())||'null');}catch{cache=null;}
    if(!cache||!Array.isArray(cache.overrides)||!Array.isArray(cache.outbox))cache={overrides:[],outbox:[],events:[],lastSyncedAt:null,status:'cached',error:''};
    cache.status=cache.outbox.some(v=>v.blocked||v.denied)?'error':cache.outbox.some(v=>v.conflict)?'conflict':cache.outbox.length?'pending':'cached';cache.error='';scrubAccess();
  }
  function access(){
    const user=who()||{}, server=cache?.access?.id===identity?cache.access:null;
    const roles=[user.role||'admin',server?.role].filter(Boolean);
    const role=roles.includes('viewer')?'viewer':roles.includes('photographer')?'photographer':roles.includes('manager')?'manager':'admin';
    const scopes=[user,server].filter(v=>v&&v.role!=='admin'&&Array.isArray(v.projects)).map(v=>new Set(v.projects));
    const projects=scopes.length?[...scopes[0]].filter(id=>scopes.every(set=>set.has(id))):role==='admin'?server?.projects||user.projects||[]:[];
    return {id:identity,role,projects};
  }
  function projectAllowed(projectId,permissions=access()){return permissions.role==='admin'||permissions.projects.includes(projectId);}
  function planAllowed(record,permissions=access()){return projectAllowed(record.projectId,permissions)&&(permissions.role!=='photographer'||record.assigneeId===identity&&['capture','sort_sources'].includes(record.requestedAction));}
  function operationAllowed(operation,permissions=access()){
    if(permissions.role==='viewer'||!projectAllowed(operation.projectId,permissions))return false;
    if(permissions.role==='admin')return true;
    if(Object.hasOwn(operation.patch,'paymentCheck'))return false;
    if(permissions.role!=='photographer')return true;
    const record=cache.overrides.find(v=>v.scopeKey===`${operation.studentId}::${operation.serviceId}`);
    return !!record&&planAllowed(record,permissions)&&Object.keys(operation.patch).every(key=>photoFields.has(key));
  }
  function scrubAccess(){
    const permissions=access();
    const previous=cache.accessFence,signature=JSON.stringify(permissions);
    if(previous===signature)return;
    cache.accessFence=signature;
    cache.overrides=cache.overrides.filter(record=>planAllowed(record,permissions));
    if(permissions.role!=='admin')for(const record of cache.overrides)delete record.paymentCheck;
    const visible=new Set(cache.overrides.map(record=>record.scopeKey));
    cache.events=(cache.events||[]).filter(event=>projectAllowed(event.projectId,permissions)&&(permissions.role!=='photographer'||visible.has(event.scopeKey)));
    if(permissions.role!=='admin')for(const event of cache.events)if(event.patch)delete event.patch.paymentCheck;
    cache.users=['viewer','photographer'].includes(permissions.role)?[]:(cache.users||[]).map(user=>({...user,projectIds:(user.projectIds||[]).filter(id=>projectAllowed(id,permissions))})).filter(user=>permissions.role==='admin'||user.projectIds.length);
    for(const operation of cache.outbox)operation.blocked=!operationAllowed(operation,permissions);
    if(cache.outbox.some(operation=>operation.blocked)){cache.status='error';cache.error='Права доступа изменились. Отложенные изменения не отправлены.';}
    if(previous!==undefined)persist();
  }
  function persist(required=false){try{if(!storage?.setItem)throw new Error('storage unavailable');storage.setItem(key(),JSON.stringify(cache));}catch(error){if(required)throw error;cache.status='error';cache.error='Не удалось обновить кэш задач на устройстве';}}
  function emit(){if(destroyed)return;const value=snapshot(),signature=JSON.stringify({...value,lastSyncedAt:null,viewDay:new Date(now()).toLocaleDateString('sv'),expiredSnoozes:value.overrides.filter(v=>v.snoozedUntil&&Date.parse(v.snoozedUntil)<=now()).map(v=>v.scopeKey)});if(signature===lastEmitted)return;lastEmitted=signature;onChange(value);}
  function effective(){
    const records=new Map(cache.overrides.map(v=>[v.scopeKey,v]));
    for(const op of cache.outbox){if(op.blocked||op.denied)continue;const scopeKey=`${op.studentId}::${op.serviceId}`;const value={...records.get(scopeKey),scopeKey,studentId:op.studentId,serviceId:op.serviceId,projectId:op.projectId,...op.patch,pending:true};for(const k of Object.keys(value))if(value[k]===null)delete value[k];records.set(scopeKey,value);}
    return [...records.values()];
  }
  function snapshot(){selectAccount();return clone({overrides:effective(),events:cache.events||[],users:cache.users||[],access:access(),rejected:cache.outbox.filter(op=>op.blocked||op.denied).map(op=>({scopeKey:`${op.studentId}::${op.serviceId}`,message:op.denied||'Права доступа изменились'})),pending:cache.outbox.length,lastSyncedAt:cache.lastSyncedAt,status:cache.status,error:cache.error||'',conflicts:cache.outbox.filter(op=>op.conflict).map(op=>({scopeKey:`${op.studentId}::${op.serviceId}`,local:op.patch,current:op.conflict}))});}
  function schedule(){clearTimeout(timer);if(destroyed||!available())return;timer=setTimeout(()=>{refresh().catch(()=>{});},Math.min(60000,5000*2**Math.min(failures,4)));timer.unref?.();}
  async function api(method,body){
    if(!request)throw new Error('Сеть недоступна');
    const response=await request('/api/v1/workflow-tasks',{method,credentials:'same-origin',cache:'no-store',headers:{'X-CRM-Account':identity,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),...(globalThis.AbortSignal?.timeout?{signal:AbortSignal.timeout(15000)}:{})});
    const data=await response.json().catch(()=>({}));if(!response.ok){const error=new Error(data.error||`Ошибка сервера ${response.status}`);error.status=response.status;throw error;}if(data.access?.id&&data.access.id!==identity){const error=new Error('Аккаунт изменился. Войдите заново.');error.status=401;throw error;}return data;
  }
  function putRecord(record){const index=cache.overrides.findIndex(v=>v.scopeKey===record.scopeKey);if(index<0)cache.overrides.push(record);else cache.overrides[index]=record;}
  async function flush(){
    selectAccount();if(destroyed||busy||!available()||!who()?.id)return snapshot();
    const session=identity;busy=true;let activeOperation;
    try{
      for(const operation of [...cache.outbox]){
        if(destroyed||String(who()?.id||'local')!==session)break;
        if(operation.blocked||operation.denied)continue;
        if(operation.conflict||cache.outbox.some(v=>v!==operation&&v.conflict&&v.studentId===operation.studentId&&v.serviceId===operation.serviceId)){cache.status='conflict';continue;}
        if(operation.baseRevision===undefined){operation.baseRevision=cache.overrides.find(v=>v.scopeKey===`${operation.studentId}::${operation.serviceId}`)?.revision||0;persist();}
        activeOperation=operation;const {projectId,studentId,serviceId,op,patch,baseRevision}=operation;
        const data=await api('PUT',{projectId,studentId,serviceId,op,patch,baseRevision});
        if(String(who()?.id||'local')!==session)break;
        if(data.conflict){operation.conflict=data.current||{};if(data.current)putRecord(data.current);cache.status='conflict';cache.error=data.message||'Задачу изменили на другом устройстве';persist();emit();continue;}
        if(data.record)putRecord(data.record);
        cache.outbox=cache.outbox.filter(v=>v.op!==operation.op);cache.lastSyncedAt=now();cache.error='';failures=0;persist();emit();
      }
      if(identity===session){cache.status=cache.outbox.some(v=>v.blocked||v.denied)?'error':cache.outbox.some(v=>v.conflict)?'conflict':cache.outbox.length?'pending':'online';persist();emit();}
    }catch(error){
      if(identity===session){if(activeOperation&&[400,403,404,409,413].includes(error.status))activeOperation.denied=error.message;cache.status=error.status===401?'auth':[400,403,404,409,413].includes(error.status)?'error':'offline';cache.error=error.message;failures++;persist();emit();}
    }finally{busy=false;schedule();}
    return snapshot();
  }
  async function refresh(){
    selectAccount();if(destroyed||busy||!available()||!who()?.id)return snapshot();
    const session=identity;busy=true;let refreshed=false;
    try{
      const data=await api('GET');if(String(who()?.id||'local')!==session)return snapshot();
      cache.overrides=Array.isArray(data.overrides)?data.overrides:[];cache.events=Array.isArray(data.events)?data.events:[];cache.users=Array.isArray(data.users)?data.users:[];if(data.access?.id===identity)cache.access=data.access;delete cache.accessFence;scrubAccess();refreshed=true;cache.lastSyncedAt=now();cache.status=cache.outbox.some(v=>v.blocked||v.denied)?'error':cache.outbox.some(v=>v.conflict)?'conflict':cache.outbox.length?'pending':'online';if(!cache.outbox.some(v=>v.blocked||v.denied))cache.error='';failures=0;persist();emit();
    }catch(error){if(identity===session){cache.status=error.status===401?'auth':'offline';cache.error=error.message;failures++;persist();emit();}}
    finally{busy=false;schedule();}
    if(refreshed&&identity===session&&cache.outbox.length)return flush();return snapshot();
  }
  async function update(scope,patch){
    selectAccount();if(!scope?.projectId||!scope?.studentId||!scope?.serviceId)throw new Error('Не указана работа для задачи');
    const operation={projectId:scope.projectId,studentId:scope.studentId,serviceId:scope.serviceId,patch:clone(patch),op:id(),baseRevision:(cache.overrides.find(v=>v.scopeKey===`${scope.studentId}::${scope.serviceId}`)?.revision||0)+cache.outbox.filter(v=>v.studentId===scope.studentId&&v.serviceId===scope.serviceId&&!v.blocked&&!v.denied).length};
    if(!operationAllowed(operation))throw new Error('Нет доступа к изменению этой задачи');
    cache.outbox.push(operation);cache.status='pending';cache.error='';
    try{persist(true);}catch(error){cache.outbox.pop();throw new Error('Не удалось сохранить задачу на устройстве. Освободите место и повторите.');}
    if(!available()||!who()?.id){
      // Local demo/offline-only mode persists plans without pretending they reached the cloud.
      const record={...effective().find(v=>v.scopeKey===`${scope.studentId}::${scope.serviceId}`),pending:false};putRecord(record);cache.outbox.pop();cache.status='local';persist();emit();return snapshot();
    }
    emit();await flush();return snapshot();
  }
  async function resolveConflict(scopeKey,useLocal=false){
    selectAccount();const operations=cache.outbox.filter(v=>`${v.studentId}::${v.serviceId}`===scopeKey);
    const conflict=operations.find(v=>v.conflict);if(!conflict)return snapshot();
    cache.outbox=cache.outbox.filter(v=>`${v.studentId}::${v.serviceId}`!==scopeKey);
    if(useLocal){const latest=operations.at(-1);const patch=Object.assign({},...operations.map(v=>v.patch));cache.outbox.push({projectId:latest.projectId,studentId:latest.studentId,serviceId:latest.serviceId,patch,op:id(),baseRevision:conflict.conflict.revision||0});}
    persist();emit();return flush();
  }
  const online=()=>{refresh().catch(()=>{});};win?.addEventListener('online',online);
  return {snapshot,update,refresh,flush,resolveConflict,destroy(){destroyed=true;clearTimeout(timer);win?.removeEventListener('online',online);}};
}

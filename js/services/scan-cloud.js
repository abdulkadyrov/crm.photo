// One append-only journal per account, shared across the all-groups and group views.
export function createCloudScanStore({storage,key,legacyKey,getData,request,onStatus=()=>{},target=globalThis.window}) {
  let state=JSON.parse(storage.getItem(key)||'null')||{rounds:{},events:[],pending:[],resets:[],cursor:0};
  const listeners=new Set(),statusListeners=new Set();let lastStatus='Подключаем облачную проверку…';let running=null,timer=null,closed=false,started=false,migrationIssue=false;
  const save=next=>{
    const latest=JSON.parse(storage.getItem(key)||'null');
    if(latest){
      const combine=(old,rows,id='id')=>[...new Map([...old,...rows].map(row=>[row[id],row])).values()];
      const acknowledged=new Set(state.pending.filter(row=>!next.pending.some(item=>item.id===row.id)).map(row=>row.id));
      const resetDone=new Set(state.resets.filter(row=>!next.resets.some(item=>item.op===row.op)).map(row=>row.op));
      next={...next,events:combine(latest.events,next.events),pending:combine(latest.pending,next.pending).filter(row=>!acknowledged.has(row.id)),resets:combine(latest.resets,next.resets,'op').filter(row=>!resetDone.has(row.op))};
    }
    storage.setItem(key,JSON.stringify(next));state=next;
  };
  const groupOf=event=>event.groupId||getData().students.find(row=>row.id===event.studentId)?.classId;
  const current=()=>state.events.filter(event=>event.roundId===(state.rounds[event.groupId]||'initial'));
  const notify=()=>{for(const listener of listeners)listener();};
  const history=(groupId)=>{try{return JSON.parse(storage.getItem(legacyKey(groupId)+':history')||'[]');}catch{return [];}};
  const read=(groupId,archive=false)=>archive?archived(groupId):({id:'cloud-check',groupId,createdAt:new Date().toISOString(),events:current().filter(event=>groupId==='*'||event.groupId===groupId)});
  const archived=groupId=>{
    const old=new Map();for(const event of state.events){if(event.roundId===(state.rounds[event.groupId]||'initial')||(groupId!=='*'&&event.groupId!==groupId))continue;const id=event.groupId+':'+event.roundId;if(!old.has(id))old.set(id,{id,groupId:event.groupId,createdAt:event.at,events:[]});old.get(id).events.push(event);}
    return [...new Map([...history(groupId),...old.values()].map(row=>[row.id,row])).values()].slice(-10);
  };
  const mirror=()=>{
    try{
      const known=new Set(state.events.map(event=>event.id));
      for(const groupId of ['*',...(getData().groups||[]).map(g=>g.id),...new Set(state.events.map(e=>e.groupId))]){
        const previous=JSON.parse(storage.getItem(legacyKey(groupId))||'null');
        // Never overwrite a legacy journal before every old event is copied.
        if(previous?.events?.some(event=>!known.has(event.id)))continue;
        storage.setItem(legacyKey(groupId),JSON.stringify(read(groupId)));
      }
    }catch{/* The canonical durable queue is already saved. */}
  };
  const status=message=>{lastStatus=message;onStatus(message);for(const listener of statusListeners)listener(message);};
  const queueEvents=(events,migration=false,fallbackGroup='*')=>{
    const known=new Set(state.events.map(event=>event.id)),added=[];
    for(const event of events){
      if(known.has(event.id))continue;
      const localOnly=!event.studentId,groupId=groupOf(event)||(localOnly?fallbackGroup:'');
      if(!groupId)continue;
      known.add(event.id);added.push({...event,groupId,roundId:event.roundId||(migration?'initial':state.rounds[groupId]||'initial'),...(localOnly?{localOnly:true}:{})});
    }
    if(added.length)save({...state,events:[...state.events,...added],pending:[...state.pending,...added.filter(event=>!event.localOnly)]});
    return added.length;
  };
  function write(groupId,session,archive=false){
    if(archive){storage.setItem(legacyKey(groupId)+':history',JSON.stringify([...history(groupId),session].slice(-5)));return;}
    queueEvents(session.events,false,groupId);mirror();if(state.pending.length)status('Сохранено на устройстве · ожидает облака');schedule(0);
  }
  // Import only active legacy sessions. Already uploaded IDs are never requeued.
  function migrate(){
    migrationIssue=false;
    const names=Array.from({length:storage.length},(_,i)=>storage.key(i));
    for(const name of names){
      if(!name?.startsWith(legacyKey(''))||name.endsWith(':history'))continue;
      try{
        const raw=storage.getItem(name),session=JSON.parse(raw);
        if(!Array.isArray(session?.events)||!session.events.length)continue;
        if(!name.endsWith(':migration-backup')&&!storage.getItem(name+':migration-backup'))storage.setItem(name+':migration-backup',raw);
        if(session.events.some(event=>event.accepted&&!groupOf(event)))migrationIssue=true;
        queueEvents(session.events,true,session.groupId||'*');
      }catch{migrationIssue=true;/* Keep an unreadable legacy journal untouched. */}
    }
  }
  migrate();
  function merge(reply){
    const byId=new Map(state.events.map(event=>[event.id,event]));for(const event of reply.events||[])byId.set(event.id,event);
    const nextRounds={...(reply.rounds||state.rounds)};for(const reset of state.resets)for(const id of Object.keys(reset.rounds))nextRounds[id]=reset.op;
    save({...state,rounds:nextRounds,events:[...byId.values()]});
  }
  async function reset(groupId){
    const ids=groupId==='*'?[...new Set([...Object.keys(state.rounds),...getData().students.map(s=>s.classId)])]:[groupId];
    const op=crypto.randomUUID(),expected=Object.fromEntries(ids.map(id=>[id,state.rounds[id]||'initial']));
    const nextRounds={...state.rounds};for(const id of ids)nextRounds[id]=op;
    save({...state,rounds:nextRounds,resets:[...state.resets,{op,rounds:expected}]});mirror();notify();status('Новая проверка сохранена на устройстве · ожидает облака');schedule(0);
  }
  function schedule(delay=8000){clearTimeout(timer);if(started&&!closed)timer=setTimeout(()=>void sync(),delay);}
  async function sync(){
    if(closed)return;if(running)return running.then(()=>sync());
    running=Promise.resolve().then(async()=>{
      const before=JSON.stringify(current());let resetConflict=false;
      status('Синхронизация проверки…');
      try{
        // Pull first so revoked/deleted groups cannot block other projects' queues.
        let allowed=new Set();let more=true;
        while(more){const after=state.cursor,reply=await request('GET',null,after),ids=Object.keys(reply.rounds).sort(),changed=state.accessGroups&&JSON.stringify(state.accessGroups)!==JSON.stringify(ids);merge(reply);save({...state,cursor:changed&&after>0?0:reply.cursor,accessGroups:ids});allowed=new Set(ids);more=reply.more||changed&&after>0;}
        // Send preceding events before their reset, preserving the old round as history.
        while(state.pending.some(event=>allowed.has(event.groupId))){const batch=state.pending.filter(event=>allowed.has(event.groupId)).slice(0,200);const reply=await request('POST',{events:batch});merge(reply);const sent=new Set(batch.map(e=>e.id));save({...state,pending:state.pending.filter(e=>!sent.has(e.id))});}
        while(state.resets.length){const reset=state.resets[0];try{const reply=await request('POST',{reset});merge(reply);}catch(error){if(error.status!==409)throw error;resetConflict=true;}save({...state,resets:state.resets.filter(r=>r.op!==reset.op)});}
        more=true;while(more){const reply=await request('GET',null,state.cursor);merge(reply);save({...state,cursor:reply.cursor});more=reply.more;}
        mirror();if(JSON.stringify(current())!==before)notify();status(migrationIssue?'Не все старые отметки перенесены · журнал на устройстве сохранён':resetConflict?'Проверка начата заново на другом устройстве · журнал обновлён':state.pending.length||state.resets.length?'Сохранено на устройстве · ожидает облака':'Проверка сохранена в облаке');
      }catch(error){status(error.status===401?'Войдите в CRM, чтобы сохранить проверку в облаке':error.status===403?'Нет доступа к облачной проверке · отметки сохранены на устройстве':'Нет связи с облаком · отметки сохранены на устройстве');}
      finally{running=null;schedule();}
    });return running;
  }
  const reconnect=()=>void sync();
  const changed=event=>{if(event.key===key){try{state=JSON.parse(storage.getItem(key));notify();schedule(0);}catch{}}};
  return {read,write,reset,sync,migrate,subscribeStatus(listener){statusListeners.add(listener);listener(lastStatus);return()=>statusListeners.delete(listener);},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},start(){started=true;closed=false;target?.addEventListener('storage',changed);target?.addEventListener('online',reconnect);target?.addEventListener('focus',reconnect);void sync();},stop(){closed=true;clearTimeout(timer);target?.removeEventListener('storage',changed);target?.removeEventListener('online',reconnect);target?.removeEventListener('focus',reconnect);},get pending(){return state.pending.length+state.resets.length;}};
}

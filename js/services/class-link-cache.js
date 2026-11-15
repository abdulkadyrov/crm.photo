const req=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});
export function currentClassLink(value){
 try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='zakaz.khanzama.ru'&&/^\/p\/[A-Za-z0-9_-]{32,100}$/.test(url.pathname)?url.origin+url.pathname:'';}catch{return '';}
}
// Link lookup is independent of the media outbox, so a pending photo cannot block it.
export function createClassLinkCache({db,load,online=()=>navigator.onLine,maxAge=30*60*1000}){
 const memory=new Map(),pending=new Map();
 return {
  peek:id=>memory.get(id)?.url||'',
  resolve(id){
   if(pending.has(id))return pending.get(id);
   const work=(async()=>{
    let saved=memory.get(id)||await req(db().transaction('syncMeta').objectStore('syncMeta').get('parent-link:'+id));
    if(saved?.url&&currentClassLink(saved.url)){memory.set(id,saved);if(!online()||Date.now()-saved.at<maxAge)return saved.url;}
    if(!online())return '';
    const result=await load(id),url=currentClassLink(result.url);if(!url)throw new Error('Сервер вернул недопустимую ссылку класса');
    saved={id:'parent-link:'+id,url,at:Date.now()};const tx=db().transaction('syncMeta','readwrite'),committed=done(tx);tx.objectStore('syncMeta').put(saved);await committed;memory.set(id,saved);return url;
   })();pending.set(id,work);return work.finally(()=>pending.delete(id));
  }
 };
}

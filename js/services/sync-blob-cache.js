import {sha256,encodeRecord} from './sync-codec.js';
const complete=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});
const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
const ACK_TTL=24*60*60*1000;
// Lives in the existing account-specific IndexedDB. No database reset or schema upgrade.
export function createSyncBlobCache(database){
 const hashes=new WeakMap();
 const db=()=>database();
 const get=id=>request(db().transaction('syncMeta').objectStore('syncMeta').get(id));
 async function write(value){const tx=db().transaction('syncMeta','readwrite'),done=complete(tx);tx.objectStore('syncMeta').put(value);await done;}
 async function remember(hash,blob){
  if((await get('blob:'+hash))?.blob)return;
  // A cache quota failure must not discard the original record or its outbox entry.
  try{await write({id:'blob:'+hash,blob});}catch(error){if(!['QuotaExceededError','UnknownError'].includes(error?.name))throw error;}
 }
 return {
  get:async hash=>(await get('blob:'+hash))?.blob,
  remember,
  async hash(blob){let digest=hashes.get(blob);if(!digest){digest=sha256(blob);hashes.set(blob,digest);}const hash=await digest;await remember(hash,blob);return hash;},
  async seed(value){await encodeRecord(value,async blob=>{const hash=await sha256(blob);await remember(hash,blob);return hash;});},
  async confirmed(scope,hash){const ack=await get('blob-ack:'+scope+':'+hash);return Boolean(ack&&Date.now()-ack.at<ACK_TTL);},
  confirm:(scope,hash)=>write({id:'blob-ack:'+scope+':'+hash,at:Date.now()}),
  async invalidate(scope){
   const tx=db().transaction('syncMeta','readwrite'),done=complete(tx);const store=tx.objectStore('syncMeta');
   store.openCursor().onsuccess=event=>{const cursor=event.target.result;if(!cursor)return;if(String(cursor.key).startsWith('blob-ack:'+scope+':'))cursor.delete();cursor.continue();};await done;
  }
 };
}

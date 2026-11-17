const open = factory => new Promise((resolve,reject)=>{
 const request=factory.open('crm-print-assets-v1',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('assets',{keyPath:'id'});
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});
export function createPrintAssetCache(namespace, factory=globalThis.indexedDB) {
 let database;
 const db=()=>database ||= open(factory);
 return {
  async get(id,signature){const database=await db();return new Promise((resolve,reject)=>{
   const request=database.transaction('assets').objectStore('assets').get(namespace+':'+id);
   request.onsuccess=()=>{const row=request.result;resolve(row?.signature===signature && row.assets?.jpgBlob?.size ? row : null);};request.onerror=()=>reject(request.error);
  });},
  async put(id,signature,assets,original){const database=await db();return new Promise((resolve,reject)=>{
   const tx=database.transaction('assets','readwrite');tx.objectStore('assets').put({id:namespace+':'+id,signature,assets:{jpgBlob:assets.jpgBlob,orientation:assets.orientation,orientationMode:assets.orientationMode},original:original||null});
   tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);
  });}
 };
}
export function printAssetSignature(work,settings,payload){return JSON.stringify(['ready-print-v2',work.id,work.updatedAt||work.createdAt,work.serviceId,work.sourceMediaId,work.resultMediaId,work.finalImageVersion,work.a4OrientationMode,settings,payload]);}

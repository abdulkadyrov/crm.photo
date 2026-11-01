import {sha256 as hash256} from '../../vendor/noble-hashes/sha2.js';
export const SYNC_STORES=['catalog','templates','projects','albumProjects','classes','albumClasses','students','albumStudents','albumGroupMedia','albumTeachers','media','albumMedia','orders','finalWorks','documents'];
export const SYNC_LOCAL_STORES=['syncQueue','syncMeta','syncHistory'];
const ignored=new Set(['objectUrl','urlObject','fileHandle','directoryHandle','handle','a4PrintImage','a4PrintPdf']);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function rebaseLocal(base,local,remote,path='') {
 if(same(base,local))return remote;
 if(local&&base&&remote&&typeof local==='object'&&typeof base==='object'&&typeof remote==='object'){
  if(Array.isArray(local)&&Array.isArray(base)&&Array.isArray(remote)){
   if(path.endsWith('/fileIds')&&[base,local,remote].every(a=>a.every(v=>typeof v==='string'))){const removed=new Set([...base.filter(v=>!local.includes(v)),...base.filter(v=>!remote.includes(v))]);return [...new Set([...remote,...local])].filter(v=>!removed.has(v));}
   const key=['id','serviceId','taskId','type'].find(k=>[base,local,remote].every(a=>a.every(v=>v&&typeof v[k]==='string')&&new Set(a.map(v=>v[k])).size===a.length));
   if(key){const map=a=>Object.fromEntries(a.map(v=>[v[key],v]));const merged=rebaseLocal(map(base),map(local),map(remote),path);const ids=[...new Set([...local,...remote].map(v=>v[key]))];return ids.filter(id=>merged[id]!==undefined).map(id=>merged[id]);}
  } else if(!Array.isArray(local)&&!Array.isArray(base)&&!Array.isArray(remote)){
   const out={...remote};for(const key of new Set([...Object.keys(base),...Object.keys(local)])){
    if(same(base[key],local[key]))continue;
    if(!(key in local))delete out[key];else out[key]=rebaseLocal(base[key],local[key],remote[key],path+'/'+key);
   }return out;
  }
 }
 return local;
}
export async function encodeRecord(value,storeBlob) {
 if(value instanceof Blob){const hash=await storeBlob(value);return {$syncBlob:hash,kind:'blob',mime:value.type,size:value.size,...(typeof File!=='undefined'&&value instanceof File?{name:value.name,lastModified:value.lastModified}:{})};}
 if(typeof value==='string'&&value.startsWith('data:')){
  const blob=await(await fetch(value)).blob();return {$syncBlob:await storeBlob(blob),kind:'dataURL',mime:blob.type,size:blob.size};
 }
 if(Array.isArray(value))return Promise.all(value.map(v=>encodeRecord(v,storeBlob)));
 if(value&&typeof value==='object'){
  const out=[];for(const [key,v] of Object.entries(value)){
   if(ignored.has(key)||v===undefined||typeof v==='function'||typeof v==='string'&&v.startsWith('blob:'))continue;
   if(v?.constructor?.name==='FileSystemFileHandle'||v?.constructor?.name==='FileSystemDirectoryHandle')continue;
   out.push([key,await encodeRecord(v,storeBlob)]);
  }return Object.fromEntries(out);
 }
 return value;
}
export async function decodeRecord(value,getBlob) {
 if(Array.isArray(value))return Promise.all(value.map(v=>decodeRecord(v,getBlob)));
 if(value&&typeof value==='object'){
  if(value.$syncBlob){
   const raw=await getBlob(value.$syncBlob);const blob=new Blob([raw],{type:value.mime||'application/octet-stream'});
   if(value.kind==='dataURL')return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
   return value.name?new File([blob],value.name,{type:blob.type,lastModified:value.lastModified}):blob;
  }
  return Object.fromEntries(await Promise.all(Object.entries(value).map(async([key,v])=>[key,await decodeRecord(v,getBlob)])));
 }
 return value;
}
export async function sha256(blob){const hash=hash256.create();for(let offset=0;offset<blob.size;offset+=2097152)hash.update(new Uint8Array(await blob.slice(offset,offset+2097152).arrayBuffer()));return [...hash.digest()].map(v=>v.toString(16).padStart(2,'0')).join('');}

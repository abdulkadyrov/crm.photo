// Deferred server assets keep new devices usable before gigabytes of originals download.
export function hasDeferredBlobs(value) {
 if(value instanceof Blob)return false;
 if(Array.isArray(value))return value.some(hasDeferredBlobs);
 return Boolean(value && typeof value==='object' && (value.$syncBlob || Object.values(value).some(hasDeferredBlobs)));
}
export function mergeDeferredRecord(wire, local, base) {
 if(wire && typeof wire==='object' && wire.$syncBlob) return local instanceof Blob && base?.$syncBlob===wire.$syncBlob ? local : {...wire};
 if(Array.isArray(wire))return wire.map((value,index)=>mergeDeferredRecord(value,local?.[index],base?.[index]));
 if(wire && typeof wire==='object') {
  const result=Object.fromEntries(Object.entries(wire).map(([key,value])=>[key,mergeDeferredRecord(value,local?.[key],base?.[key])]));
  const sameImage=['image','originalFinalImage','mergedPrintImage'].every(key=>JSON.stringify(wire[key])===JSON.stringify(base?.[key]));
  if(sameImage)for(const key of ['a4PrintImage','a4PrintPdf'])if(local?.[key] instanceof Blob)result[key]=local[key];
  return result;
 }
 return wire;
}
export function deferredFinalImageUrl(work, scope=work?.projectId) {
 const ref=[work?.mergedPrintImage,work?.image,work?.blob].find(ref=>/^[a-f0-9]{64}$/.test(ref?.$syncBlob||''));
 if(!ref || !/^[A-Za-z0-9_-]{1,200}$/.test(scope||''))return '';
 return '/api/v1/sync/blob/'+encodeURIComponent(scope)+'/'+ref.$syncBlob;
}

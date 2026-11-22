const blobIds=new WeakMap();
export async function portraitBlobKey(value){
 if(value?.$syncBlob)return value.$syncBlob;
 if(!(value instanceof Blob))return '';
 if(!blobIds.has(value))blobIds.set(value,value.arrayBuffer().then(bytes=>crypto.subtle.digest('SHA-256',bytes)).then(hash=>Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('')));
 return blobIds.get(value);
}
export function portraitWireKey(record,kind='finalWorks'){
 const fields=kind==='media'?['blob']:['originalFinalImage','image','mergedPrintImage','blob'];
 return fields.map(field=>record?.[field]?.$syncBlob||'').join('|').replace(/^\|+|\|+$/g,'')||record?.portraitInputHash||'';
}
export async function stampPortraitInput(record,kind){
 const fields=kind==='media'?['blob']:['originalFinalImage','image','mergedPrintImage','blob'];
 const hashes=await Promise.all(fields.map(field=>portraitBlobKey(record[field])));
 return {...record,portraitInputHash:hashes.join('|').replace(/^\|+|\|+$/g,'')};
}

import {PORTRAIT_MODEL_VERSION} from './portrait-identity.js?v=316';
export function portraitScoreRevision(work,originals=[]){return JSON.stringify([PORTRAIT_MODEL_VERSION,work.id,work.portraitInputHash||work.fileName||work.createdAt||'',work.sourceMediaId||'',originals.map(m=>[m.id,m.portraitInputHash||m.fileName||m.createdAt||'']).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))]);}
function legacyRevision(work,originals){return JSON.stringify([PORTRAIT_MODEL_VERSION,work.id,work.updatedAt||work.createdAt||'',work.version||'',work.sourceMediaId||'',originals.map(m=>[m.id,m.updatedAt||m.capturedAt||m.createdAt||'']).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))]);}
function matches(row,work,originals){return row&&(row.revision===portraitScoreRevision(work,originals)||row.revision===legacyRevision(work,originals));}

const key=(account,id)=>'crm-portrait-score:v1:'+encodeURIComponent(account||'local')+':'+encodeURIComponent(id);
export function savePortraitScore(storage,account,work,originals,value){
 const row={revision:portraitScoreRevision(work,originals),similarity:value.status==='ok'&&Number.isFinite(value.similarity)?value.similarity:null,status:value.status,explanation:value.explanation||'',modelVersion:value.modelVersion,checkedAt:new Date().toISOString()};
 try{storage.setItem(key(account,work.id),JSON.stringify(row));}catch{}return row;
}
export function readPortraitScoreEntry(storage,account,work,originals){try{const row=JSON.parse(storage.getItem(key(account,work.id))||'null');if(!matches(row,work,originals))return null;const revision=portraitScoreRevision(work,originals);if(row.revision!==revision){row.revision=revision;try{storage.setItem(key(account,work.id),JSON.stringify(row));}catch{}}return row;}catch{return null;}}
export function readPortraitScore(storage,account,work,originals){const row=readPortraitScoreEntry(storage,account,work,originals);return Number.isFinite(row?.similarity)?row.similarity:null;}

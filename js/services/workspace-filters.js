import {studentStages} from './student-stage-icons.js';
import {selectedServiceEntries} from './card-summary.js';
import {readPortraitScoreEntry} from './portrait-score-store.js?v=317';
export const workspaceFilterDefaults=()=>({serviceIds:[],shot:'',generated:'',printed:'',paid:'',delivered:'',similarity:'',min:'',max:''});
export function workspaceFilterActive(f){return Object.entries(f).some(([k,v])=>Array.isArray(v)?v.length:v!==''&&v!=null);}
export function studentFilterInput(data,student,{storage,accountId,photoIndex=[]}={}){
 const originals=(data.media||[]).filter(m=>m.studentId===student.id&&!m.isFinalResult&&m.type!=='final_work'&&m.orderType!=='final_work'&&['photo','image'].includes(m.type));
 const works=(data.finalWorks||[]).filter(w=>w.studentId===student.id);
 const services=selectedServiceEntries(student);for(const w of works)if(w.serviceId&&!services.some(s=>s.id===w.serviceId))services.push({id:w.serviceId});
 const photoIds=new Set([...originals,...photoIndex.filter(m=>m.studentId===student.id)].map(m=>m.id));
 const manualStatus=[data.orders?.find(o=>o.studentId===student.id)?.status,student.orderStatus,student.status].find(s=>['printed','delivered'].includes(s))||'';
 return {student,works,services,originals,manualStatus,photoCount:photoIds.size,storage,accountId};
}
export function matchesWorkspaceStudent(input,f){
 const selected=f.serviceIds||[],services=selected.length?input.services.filter(s=>selected.includes(s.id)):input.services;
 if(selected.length&&!services.length)return false;
 const works=selected.length?input.works.filter(w=>selected.includes(w.serviceId)):input.works;
 const stages=Object.fromEntries(studentStages({...input,works,services,manualStatus:input.manualStatus||''}).map(s=>[s.key,s.state]));
 for(const key of ['shot','generated','printed','paid','delivered'])if(f[key]&&stages[key]!==f[key])return false;
 if(f.similarity||f.min!==''&&f.min!=null||f.max!==''&&f.max!=null){
  const latest=new Map();for(const work of works){const prev=latest.get(work.serviceId||work.id);if(!prev||String(work.updatedAt||work.createdAt||'')>String(prev.updatedAt||prev.createdAt||''))latest.set(work.serviceId||work.id,work);}
  const entries=[...latest.values()].map(w=>input.storage?readPortraitScoreEntry(input.storage,input.accountId,w,input.originals):null);
  const scores=entries.filter(e=>Number.isFinite(e?.similarity)).map(e=>e.similarity),failed=entries.some(e=>e&&e.similarity===null);
  if(f.similarity==='checked'&&!scores.length)return false;
  if(f.similarity==='unchecked'&&(scores.length||failed))return false;
  if(f.similarity==='failed'&&!failed)return false;
  if(f.min!==''&&f.min!=null&&(!scores.length||Math.min(...scores)<Number(f.min)))return false;
  if(f.max!==''&&f.max!=null&&(!scores.length||Math.min(...scores)>Number(f.max)))return false;
 }
 return true;
}

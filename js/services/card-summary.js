export function selectedServiceEntries(student) {
 const selected = (student.selectedServices || []).filter(item => item.serviceId);
 if(selected.length) return selected.map(item => ({id:String(item.serviceId), entryId:item.entryId, quantity:Math.max(1,parseInt(item.quantity,10)||1)}));
 return [...new Set((student.catalogIds?.length ? student.catalogIds : student.catalogId ? [student.catalogId] : []).filter(Boolean))].map(id=>({id:String(id),quantity:1}));
}
export function cardSummary(students, media, remotePhotos = []) {
 const ids = new Set(students.map(student=>student.id));
 const entries = students.map(student=>new Set(selectedServiceEntries(student).map(item=>item.entryId || item.id)));
 const requests = entries.filter(ids=>ids.size>0).length;
 const orders = entries.reduce((sum,ids)=>sum+ids.size,0);
 // Server metadata is available before the large original files download.
 // Union by persistent media ID; versions/results remain in finalWorks, not here.
 const photoIds = new Set();
 for (const item of remotePhotos) {
  if (item.id && ids.has(item.studentId) && ['photo','image'].includes(item.type) && Number.isSafeInteger(item.size) && item.size > 0) photoIds.add(item.id);
 }
 media.forEach((item,index)=>{
  if(ids.has(item.studentId) && ['photo','image'].includes(item.type) && item.blob?.size > 0) photoIds.add(item.id || `local-unidentified:${index}`);
 });
 const photos = photoIds.size;
 // One request per child with a service selection; repeat imports and extra
 // copies do not create requests or new child/service orders.
 return {photos, selectedChildren:requests, services:orders, requests, orders};
}
export function projectArchiveName(name, version, date = new Date()) {
 const day = new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
 const school = String(name || 'Проект').replace(/[\\/:*?"<>|]/g,'_').trim();
 return `${school}_v${version}_${day}.zip`;
}

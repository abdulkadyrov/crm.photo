export function selectedServiceEntries(student) {
 const selected = (student.selectedServices || []).filter(item => item.serviceId);
 if(selected.length) return selected.map(item => ({id:String(item.serviceId), quantity:Math.max(1,parseInt(item.quantity,10)||1)}));
 return [...new Set((student.catalogIds?.length ? student.catalogIds : student.catalogId ? [student.catalogId] : []).filter(Boolean))].map(id=>({id:String(id),quantity:1}));
}
export function cardSummary(students, media, orders = [], mode = 'selections') {
 const ids = new Set(students.map(student=>student.id));
 const selected = students.filter(student=>selectedServiceEntries(student).length);
 const photos = media.filter(item=>ids.has(item.studentId) && ['photo','image'].includes(item.type) && item.blob?.size > 0).length;
 const requests = new Set();
 for(const student of students) for(const id of student.parentOrderIds || []) requests.add(String(id));
 for(const order of orders) if(ids.has(order.studentId)) {
  const id = order.vakhaOrderId || order.vakhaOrderNumber;
  if(id) requests.add(String(id));
 }
 return {photos,selectedChildren:selected.length,services:students.reduce((sum,student)=>sum+selectedServiceEntries(student).reduce((n,item)=>n+item.quantity,0),0),parentRequests:requests.size,
  requests: mode==='parents' ? requests.size : selected.length,
  orders: mode==='parents' ? selected.length : students.reduce((sum,student)=>sum+selectedServiceEntries(student).reduce((n,item)=>n+item.quantity,0),0)};
}
export function projectArchiveName(name, version, date = new Date()) {
 const day = new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
 const school = String(name || 'Проект').replace(/[\\/:*?"<>|]/g,'_').trim();
 return `${school}_v${version}_${day}.zip`;
}

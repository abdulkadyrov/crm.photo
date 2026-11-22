const rows=(data,key)=>Array.isArray(data[key])?data[key]:[];
const sort=items=>[...items].sort((a,b)=>String(a.id||'').localeCompare(String(b.id||'')));
/** Only records that can affect the open card, never bytes or another child's updates. */
export function studentViewRevision(data={},studentId,photoIndex=[]){
 const student=rows(data,'students').find(s=>s.id===studentId),group=rows(data,'classes').find(g=>g.id===student?.classId),project=rows(data,'projects').find(p=>p.id===group?.projectId);
 const orders=rows(data,'orders').filter(o=>o.studentId===studentId),works=rows(data,'finalWorks').filter(w=>w.studentId===studentId);
 const services=new Set([student?.catalogId,...(student?.catalogIds||[]),...(student?.selectedServices||[]).map(e=>e.serviceId),...works.map(w=>w.serviceId)]);
 for(const order of orders)for(const item of order.items||[])services.add(item.serviceId||String(item.type||'').split('__')[0]);
 return JSON.stringify({student,group,project,roster:sort(rows(data,'students').filter(s=>s.classId===student?.classId).map(s=>({id:s.id,firstName:s.firstName,lastName:s.lastName,deletedAt:s.deletedAt}))),orders:sort(orders),media:sort(rows(data,'media').filter(m=>m.studentId===studentId)),works:sort(works),photos:sort(photoIndex.filter(m=>m.studentId===studentId)),catalog:sort(rows(data,'catalog').filter(s=>services.has(s.id))),settings:sort(rows(data,'settings'))},(_,value)=>value&&typeof value.arrayBuffer==='function'&&typeof value.size==='number'?{blobSize:value.size,blobType:value.type,name:value.name||''}:value);
}
function nodeKey(node){
 if(node.id)return 'id:'+node.id;
 for(const key of ['positionState','workflowCard','studentState','scopeKey','workId','mediaId'])if(Object.hasOwn(node.dataset||{},key))return key+':'+node.dataset[key];
 const label=node.querySelector?.('summary')?.textContent?.replace(/\s+/g,' ').trim().replace(/\s*\d+\s*$/,'')||'';
 return node.tagName+':'+String(node.className||'')+':'+label;
}
function keyed(nodes){const seen=new Map();return nodes.map(node=>{const base=nodeKey(node),n=seen.get(base)||0;seen.set(base,n+1);return {node,key:base+'#'+n};});}
export function captureStudentView(root,win){
 const focus=root.ownerDocument?.activeElement;
 return {x:win.scrollX||0,y:win.scrollY||0,details:keyed([...root.querySelectorAll('details')]).map(({node,key})=>({key,open:node.open})),scrolls:keyed([...root.querySelectorAll('*')]).filter(({node})=>node.scrollTop||node.scrollLeft).map(({node,key})=>({key,top:node.scrollTop,left:node.scrollLeft})),focus:focus&&root.contains(focus)?{tag:focus.tagName,attributes:[...focus.attributes].filter(a=>a.name==='id'||a.name==='name'||a.name.startsWith('data-')).map(a=>[a.name,a.value])}:null};
}
export function restoreStudentView(saved,root,win){
 const details=new Map(saved.details.map(v=>[v.key,v.open]));for(const {node,key}of keyed([...root.querySelectorAll('details')]))if(details.has(key))node.open=details.get(key);
 const scrolls=new Map(saved.scrolls.map(v=>[v.key,v]));for(const {node,key}of keyed([...root.querySelectorAll('*')])){const s=scrolls.get(key);if(s){node.scrollTop=s.top;node.scrollLeft=s.left;}}
 if(saved.focus?.attributes.length){const next=[...root.querySelectorAll('input,select,textarea,button,a')].find(node=>node.tagName===saved.focus.tag&&saved.focus.attributes.every(([key,value])=>node.getAttribute(key)===value));next?.focus({preventScroll:true});}
 win.scrollTo({left:saved.x,top:saved.y,behavior:'instant'});
}

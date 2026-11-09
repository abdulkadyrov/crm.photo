import test from 'node:test';
import assert from 'node:assert/strict';
import {PIRATE_SERVICE,portraitSources,portraitPlan,runPortraitQueue,mutatePortraitDraft} from '../../js/services/local-portraits.js';
import {indexedDB} from 'fake-indexeddb';
const p=PIRATE_SERVICE;
const photo=(id,studentId,type=p+'__portrait')=>({id,studentId,orderType:type,type:'photo',blob:new Blob(['photo'])});
const order=id=>({id:'o'+id,studentId:id,items:[{type:p+'__portrait',fileIds:[]}]});
test('portrait source excludes other students, full-body, missing blobs and unrelated service portraits',()=>{
 assert.deepEqual(portraitSources(order('1'),[photo('a','1'),photo('b','2'),photo('c','1','full'),photo('d','1','another__portrait'),{...photo('e','1'),blob:null}],p).map(p=>p.id),['a']);
});
test('school queue reports skips, continues after an error, and excludes existing drafts/results',async()=>{
 const students=Array.from({length:7},(_,i)=>({id:String(i),firstName:'Demo',lastName:String(i)}));
 const orders=students.map(s=>order(s.id));orders[5].localPortraits={[p]:{id:'draft'}};
 const data={students,orders,media:[photo('a','0'),photo('b','2'),photo('c','2'),photo('d','4')],finalWorks:[{studentId:'6',serviceId:p}]};
 const plan=portraitPlan(data,s=>[s.id==='3'?'unconfigured':p]);
 assert.equal(plan.ready.length,2);assert.equal(plan.skipped.length,5);
 assert.ok(plan.skipped.some(s=>s.reason.includes('Несколько')));assert.ok(plan.skipped.some(s=>s.reason.includes('Нет фото')));
 const visited=[];const result=await runPortraitQueue(plan,async j=>{visited.push(j.studentId);if(j.studentId==='0')throw new Error('offline');});
 assert.deepEqual(visited,['0','4']);assert.equal(result.processed,1);assert.equal(result.errors.length,1);assert.equal(result.skipped,5);
});
test('draft replacement and deletion preserve originals; approval is atomic and cannot duplicate or overwrite',async()=>{
 const db=await new Promise(resolve=>{const r=indexedDB.open('portraits-test',1);r.onupgradeneeded=()=>['orders','finalWorks','media'].forEach(s=>r.result.createObjectStore(s,{keyPath:'id'}));r.onsuccess=()=>resolve(r.result);});
 await new Promise(resolve=>{const tx=db.transaction(['orders','media'],'readwrite');tx.objectStore('orders').put(order('1'));tx.objectStore('media').put(photo('original','1'));tx.oncomplete=resolve;});
 const get=(store,id)=>new Promise(resolve=>{db.transaction(store).objectStore(store).get(id).onsuccess=e=>resolve(e.target.result);});
 await mutatePortraitDraft(db,'o1',p,()=>({id:'v1',image:new Blob(['v1'])}));
 await assert.rejects(mutatePortraitDraft(db,'o1',p,()=>{throw new Error('failure');}));
 assert.equal((await get('orders','o1')).localPortraits[p].id,'v1');
 await mutatePortraitDraft(db,'o1',p,()=>null);
 assert.equal((await get('orders','o1')).localPortraits[p],undefined);
 assert.equal((await get('media','original')).blob.size,5);
 await mutatePortraitDraft(db,'o1',p,()=>({id:'v2'}));
 const approval=()=>mutatePortraitDraft(db,'o1',p,()=>null,{id:'approved',studentId:'1',serviceId:p,image:new Blob(['final'])});
 const outcomes=await Promise.allSettled([approval(),approval()]);
 assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);
 await assert.rejects(mutatePortraitDraft(db,'o1',p,()=>({id:'new'})));
 assert.equal((await get('finalWorks','approved')).image.size,5);
 assert.equal((await get('orders','o1')).localPortraits[p],undefined);
 db.close();
});

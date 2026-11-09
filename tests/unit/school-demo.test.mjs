import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {CHILD_PORTRAIT_TEMPLATES,childPortraitCatalogRecord} from '../../js/data/child-portrait-templates.js';
import {addSchoolDemo,SCHOOL_DEMO_ID,schoolDemoRecords} from '../../js/services/school-demo.js';
const catalog=CHILD_PORTRAIT_TEMPLATES.map(childPortraitCatalogRecord);
test('school demo has 10 classes, 20 distinct services and ages 7–17; fighters need two shots',()=>{
 const data=schoolDemoRecords(catalog);
 assert.equal(data.classes.length,10);assert.equal(data.students.length,20);
 assert.equal(new Set(data.students.map(s=>s.catalogId)).size,20);
 assert.equal(Math.min(...data.students.map(s=>s.age)),7);assert.equal(Math.max(...data.students.map(s=>s.age)),17);
 for(const klass of data.classes)assert.equal(data.students.filter(s=>s.classId===klass.id).length,2);
 for(const order of data.orders.slice(-4))assert.deepEqual(order.items.map(i=>i.type.split('__')[1]),['portrait','full']);
});
test('atomic demo creation preserves old records and repeated/concurrent requests do not duplicate',async()=>{
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('demo-test',1);r.onupgradeneeded=()=>['projects','classes','students','orders','catalog','media','syncQueue'].forEach(s=>r.result.createObjectStore(s,{keyPath:'id'}));r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 await new Promise(resolve=>{const tx=db.transaction(['projects','media'],'readwrite');tx.objectStore('projects').put({id:'existing',name:'Гимназия №12'});tx.objectStore('media').put({id:'photo',blob:new Blob(['original'])});tx.oncomplete=resolve;});
 await Promise.all([addSchoolDemo(db,catalog),addSchoolDemo(db,catalog)]);
 const all=store=>new Promise(resolve=>{db.transaction(store).objectStore(store).getAll().onsuccess=e=>resolve(e.target.result);});
 assert.equal((await all('projects')).length,2);assert.equal((await all('students')).length,20);assert.equal((await all('orders')).length,20);
 assert.equal((await all('media'))[0].id,'photo');assert.equal((await all('syncQueue')).length,0);
 assert.ok((await all('projects')).some(p=>p.id===SCHOOL_DEMO_ID));db.close();
});

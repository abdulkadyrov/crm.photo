import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkflowWorkspace} from '../../js/ui/workflow-workspace.js';
import {deriveWorkflowTasks,workflowWorkRevision} from '../../js/services/workflow-tasks.js';

function fixture(t) {
 const storage=new Map(),oldStorage=globalThis.localStorage,oldDocument=globalThis.document;
 globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
 globalThis.document={querySelector:()=>null};
 const data={projects:[{id:'p',name:'Школа'}],classes:[{id:'g',projectId:'p',name:'1А'}],students:[{id:'s',classId:'g',catalogIds:['wolf'],firstName:'Адам'}],catalog:[{id:'wolf',name:'Страж гор'}],media:[],finalWorks:[]};
 const workspace=createWorkflowWorkspace({getData:()=>data,account:()=>({id:'owner',role:'admin',name:'Владелец'}),enabled:false,getRoute:()=> 'home',notify:()=>{},readSessions:()=>[]});
 t.after(()=>{workspace.stop();globalThis.localStorage=oldStorage;globalThis.document=oldDocument;});
 return {workspace,data};
}
test('native capture provenance flows directly into the generation queue and survives reload',t=>{
 const {workspace,data}=fixture(t);
 const metadata=workspace.captureMetadata({studentId:'s',orderType:'wolf__portrait',source:'capture',captureBatchId:'visit-1'});
 assert.equal(metadata.serviceId,'wolf');assert.equal(metadata.captureBatchId,'visit-1');assert.ok(Date.parse(metadata.capturedAt));
 data.media.push({id:'source',studentId:'s',type:'photo',orderType:'wolf__portrait',createdAt:'2026-11-21',capturedBy:'owner',...metadata});
 assert.equal(deriveWorkflowTasks(data)[0].action,'generate');
 assert.equal(deriveWorkflowTasks(structuredClone(data))[0].id,deriveWorkflowTasks(data)[0].id);
});
test('imported source does not pretend it was captured today',t=>{
 const {workspace}=fixture(t);
 const metadata=workspace.captureMetadata({studentId:'s',orderType:'wolf__portrait',source:'device_import'});
 assert.equal(metadata.capturedAt,'');
 const explicit=workspace.captureMetadata({studentId:'s',orderType:'wolf__portrait',source:'device_import',capturedAt:'2026-11-18T09:30:00Z'});
 assert.equal(explicit.capturedAt,'2026-11-18T09:30:00Z');
});
test('actual workspace approval persists exact revision and unlocks only its own service',async t=>{
 const {workspace,data}=fixture(t);
 data.students[0].catalogIds.push('tower');data.catalog.push({id:'tower',name:'Башня'});
 const works=['wolf','tower'].map(id=>({id:'w-'+id,studentId:'s',projectId:'p',groupId:'g',serviceId:id,status:'ready',createdAt:'2026-11-21',workflowVersion:'v1-'+id,workflowReview:{required:true}}));data.finalWorks.push(...works);
 assert.deepEqual(deriveWorkflowTasks(data).map(t=>t.action),['review','review']);
 await workspace.approveWork(works[0]);
 const snapshot=workspace.snapshot();assert.equal(snapshot.status,'local');assert.equal(snapshot.pending,0);
 assert.equal(snapshot.overrides[0].approvedRevision,workflowWorkRevision(works[0]));
 const tasks=deriveWorkflowTasks(data,{overrides:snapshot.overrides});assert.equal(tasks.find(t=>t.serviceId==='wolf').action,'print');assert.equal(tasks.find(t=>t.serviceId==='tower').action,'review');
 works[0].workflowVersion='v2';assert.equal(deriveWorkflowTasks(data,{overrides:snapshot.overrides}).find(t=>t.serviceId==='wolf').action,'review');
});
test('scanner rejection and open corrections cannot be overridden by a prior successful check',()=>{
 const data={projects:[{id:'p'}],classes:[{id:'g',projectId:'p'}],students:[{id:'s',classId:'g',catalogIds:['wolf']}],catalog:[{id:'wolf'}],finalWorks:[{id:'w',studentId:'s',serviceId:'wolf',status:'printed',finalImageVersion:8,correction:{status:'open',comment:'Не похож'}}],scanSessions:[{events:[{accepted:true,workId:'w',version:8},{accepted:false,status:'rejected',workId:'w',version:8}]}]};
 assert.equal(deriveWorkflowTasks(data)[0].action,'redo');
});

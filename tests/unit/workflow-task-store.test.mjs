import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkflowTaskStore} from '../../js/services/workflow-task-store.js';
const scope={projectId:'school',studentId:'child',serviceId:'wolf'};
function storage(){const map=new Map();return {getItem:key=>map.get(key),setItem:(key,value)=>map.set(key,value)};}
function server(){
  const records=new Map(),receipts=new Map();let online=true,drop=false;
  return {records,set online(value){online=value;},set dropResponse(value){drop=value;},async fetch(url,options){
    assert.equal(url,'/api/v1/workflow-tasks');assert.equal(options.credentials,'same-origin');
    if(!online)throw new Error('offline');
    const response=data=>({ok:true,status:200,json:async()=>structuredClone(data)});
    if(options.method==='GET')return response({overrides:[...records.values()],events:[]});
    const body=JSON.parse(options.body),key=`${body.studentId}::${body.serviceId}`;
    if(receipts.has(body.op))return response({saved:true,record:records.get(key),duplicate:true});
    const old=records.get(key);
    if(body.baseRevision!==(old?.revision||0))return response({conflict:true,current:old,message:'Changed elsewhere'});
    const record={...old,...body.patch,...scope,scopeKey:key,revision:(old?.revision||0)+1};for(const key in record)if(record[key]===null)delete record[key];records.set(key,record);receipts.set(body.op,true);
    if(drop){drop=false;throw new Error('response lost');}
    return response({saved:true,record});
  }};
}
let serial=0;
const store=(api,local=storage(),extra={})=>createWorkflowTaskStore({fetch:api.fetch.bind(api),storage:local,account:()=>({id:'owner'}),id:()=>`op-${++serial}`,win:null,...extra});
test('offline update survives reload and reaches cloud exactly once',async()=>{
  const api=server(),local=storage();api.online=false;let a=store(api,local);await a.update(scope,{dueAt:'2026-11-25'});assert.equal(a.snapshot().status,'offline');assert.equal(a.snapshot().overrides[0].dueAt,'2026-11-25');a.destroy();
  a=store(api,local);assert.equal(a.snapshot().pending,1);api.online=true;await a.refresh();assert.equal(a.snapshot().pending,0);assert.equal(a.snapshot().status,'online');assert.equal(api.records.get('child::wolf').revision,1);a.destroy();
});
test('two devices conflict without silently overwriting deadlines',async()=>{
  const api=server(),a=store(api),b=store(api);await a.refresh();await b.refresh();await a.update(scope,{dueAt:'2026-11-25'});await b.update(scope,{dueAt:'2026-12-01'});assert.equal(b.snapshot().status,'conflict');assert.equal(api.records.get('child::wolf').dueAt,'2026-11-25');assert.equal(b.snapshot().pending,1);await b.resolveConflict('child::wolf',false);assert.equal(b.snapshot().overrides[0].dueAt,'2026-11-25');assert.equal(b.snapshot().pending,0);a.destroy();b.destroy();
});
test('multiple offline changes serialize revisions and retain all fields',async()=>{
  const api=server(),a=store(api);api.online=false;await a.update(scope,{dueAt:'2026-11-25'});await a.update(scope,{requestedAction:'capture'});api.online=true;await a.refresh();assert.equal(a.snapshot().pending,0);assert.equal(api.records.get('child::wolf').revision,2);assert.equal(api.records.get('child::wolf').dueAt,'2026-11-25');assert.equal(api.records.get('child::wolf').requestedAction,'capture');a.destroy();
});
test('response lost after commit retries the same idempotent operation',async()=>{
  const api=server(),a=store(api);api.dropResponse=true;await a.update(scope,{requestedAction:'capture'});assert.equal(a.snapshot().pending,1);assert.equal(api.records.get('child::wolf').revision,1);await a.flush();assert.equal(a.snapshot().pending,0);assert.equal(api.records.get('child::wolf').revision,1);a.destroy();
});
test('switching accounts does not expose another account cache or queue',async()=>{
  const api=server(),local=storage();let account='one';api.online=false;const a=store(api,local,{account:()=>({id:account})});await a.update(scope,{dueAt:'2026-11-25'});account='two';assert.equal(a.snapshot().overrides.length,0);assert.equal(a.snapshot().pending,0);account='one';assert.equal(a.snapshot().pending,1);a.destroy();
});
test('storage failure rejects update before claiming it is saved',async()=>{
  const api=server(),a=store(api,{getItem:()=>null,setItem:()=>{throw new Error('quota');}});await assert.rejects(a.update(scope,{requestedAction:'capture'}),/сохранить/);assert.equal(a.snapshot().pending,0);assert.equal(api.records.size,0);a.destroy();
});
test('same-account role downgrade hides cached finance and blocks old privileged intents',async()=>{
  const api=server();let role='admin';const a=store(api,storage(),{account:()=>({id:'owner',role,projects:['school']})});
  await a.update(scope,{paymentCheck:true,dueAt:'2026-11-25'});api.online=false;await a.update(scope,{paymentCheck:false});role='manager';
  const state=a.snapshot();assert.equal(state.access.role,'manager');assert.equal(state.overrides[0].paymentCheck,undefined);assert.equal(state.rejected.length,1);assert.equal(state.overrides[0].dueAt,'2026-11-25');assert.equal(state.status,'error');await assert.rejects(a.update(scope,{paymentCheck:true}),/доступ/);a.destroy();
});
test('membership revocation removes project plans and staff from same-account cache',async()=>{
  const api=server();let projects=['school'];const a=store(api,storage(),{account:()=>({id:'owner',role:'manager',projects})});await a.update(scope,{dueAt:'2026-11-25'});api.online=false;await a.update(scope,{requestedAction:'capture'});projects=[];
  assert.equal(a.snapshot().overrides.length,0);assert.equal(a.snapshot().rejected.length,1);await assert.rejects(a.update(scope,{dueAt:'2026-12-01'}),/доступ/);a.destroy();
});
test('server access snapshot restricts stale cached admin identity',async()=>{
  const api=server();let sent=0;
  const fetch=async(url,options)=>{if(options.method==='GET')return {ok:true,json:async()=>({access:{id:'owner',role:'photographer',projects:['school']},overrides:[{...scope,scopeKey:'child::wolf',revision:1,assigneeId:'owner',requestedAction:'capture',paymentCheck:true}],users:[{id:'other'}],events:[]})};sent++;return api.fetch(url,options);};
  const a=store(api,storage(),{fetch,account:()=>({id:'owner',role:'admin'})});await a.refresh();assert.equal(a.snapshot().access.role,'photographer');assert.equal(a.snapshot().overrides[0].paymentCheck,undefined);assert.equal(a.snapshot().users.length,0);await assert.rejects(a.update(scope,{dueAt:'2026-12-01'}),/доступ/);assert.equal(sent,0);a.destroy();
});
test('accepting server conflict discards dependent queued edits of the same work',async()=>{
  const api=server(),a=store(api),b=store(api);await a.refresh();await b.refresh();await a.update(scope,{dueAt:'2026-11-25'});api.online=false;await b.update(scope,{dueAt:'2026-12-01'});await b.update(scope,{dueAt:'2026-12-02'});api.online=true;await b.flush();assert.equal(b.snapshot().status,'conflict');await b.resolveConflict('child::wolf',false);assert.equal(b.snapshot().pending,0);assert.equal(b.snapshot().overrides[0].dueAt,'2026-11-25');assert.equal(api.records.get('child::wolf').revision,1);a.destroy();b.destroy();
});
test('explicit keep-local resolves dependent edits as one fresh revision',async()=>{
  const api=server(),a=store(api),b=store(api);await a.refresh();await b.refresh();await a.update(scope,{dueAt:'2026-11-25'});api.online=false;await b.update(scope,{dueAt:'2026-12-01'});await b.update(scope,{requestedAction:'capture'});api.online=true;await b.flush();await b.resolveConflict('child::wolf',true);assert.equal(b.snapshot().pending,0);assert.equal(api.records.get('child::wolf').dueAt,'2026-12-01');assert.equal(api.records.get('child::wolf').requestedAction,'capture');assert.equal(api.records.get('child::wolf').revision,2);a.destroy();b.destroy();
});
test('different authenticated account response is never cached under old account',async()=>{
  const api=server();const fetch=async(url,options)=>{assert.equal(options.headers['X-CRM-Account'],'owner');return {ok:true,json:async()=>({access:{id:'someone-else',role:'admin',projects:['other']},overrides:[{...scope,scopeKey:'secret::wolf',note:'private'}],users:[{id:'private-staff'}]})};};
  const a=store(api,storage(),{fetch});await a.refresh();assert.equal(a.snapshot().status,'auth');assert.equal(a.snapshot().overrides.length,0);assert.equal(a.snapshot().users.length,0);a.destroy();
});

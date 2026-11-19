import test from 'node:test';
import assert from 'node:assert/strict';
import {createCloudScanStore} from '../../js/services/scan-cloud.js';
import {appendScanEvent,assessGroupScan,scanSessionSummary} from '../../js/services/group-scan.js';
class Storage {values=new Map();get length(){return this.values.size;}key(i){return [...this.values.keys()][i];}getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,String(v));}}
const data={students:[{id:'child',classId:'g'}],groups:[{id:'g'}],works:['wolf','tower'].map(id=>({id,studentId:'child',finalImageVersion:1}))};
const clone=x=>JSON.parse(JSON.stringify(x));
function server(){let events=[],rounds={g:'initial'},seq=0;return {async request(method,body,after=0){
 if(method==='GET')return clone({events:events.filter(e=>e.seq>after).map(({seq,...e})=>e),rounds,cursor:seq,more:false});
 if(body.reset){for(const [g,expected]of Object.entries(body.reset.rounds))if(rounds[g]!==expected){const e=new Error('stale');e.status=409;throw e;}for(const g of Object.keys(body.reset.rounds))rounds[g]=body.reset.op;return clone({rounds});}
 const saved=body.events.map(event=>{const old=events.find(e=>e.id===event.id);if(old){const {seq,...row}=old;return row;}const row=clone(event);if(row.accepted&&!row.extraCopy&&row.workId&&events.some(e=>e.accepted&&e.workId===row.workId&&e.version===row.version&&e.roundId===row.roundId))Object.assign(row,{accepted:false,status:'duplicate'});events.push({...row,seq:++seq});return row;});return clone({events:saved,rounds});
 },get events(){return events;}};}
function device(backend,storage=new Storage()){let online=true;const status=[];return {storage,status,store:createCloudScanStore({storage,key:'cloud',legacyKey:id=>'legacy:'+id,getData:()=>data,request:(...args)=>{if(!online)throw new Error('offline');return backend.request(...args);},onStatus:message=>status.push(message)}),offline(){online=false;},online(){online=true;}};}
function accept(device,id){const session=device.store.read('g');device.store.write('g',appendScanEvent(session,assessGroupScan({kind:'work',studentId:'child',workId:id},'g',session,data),{accept:true}));}
test('two devices share each accepted service across group and all-groups views',async()=>{
 const backend=server(),a=device(backend),b=device(backend);accept(a,'wolf');await a.store.sync();await b.store.sync();assert.equal(b.store.read('*').events[0].workId,'wolf');assert.equal(assessGroupScan({kind:'work',studentId:'child',workId:'wolf'},'g',b.store.read('g'),data).status,'duplicate');accept(b,'tower');await b.store.sync();await a.store.sync();assert.equal(scanSessionSummary(a.store.read('*'),data.students).works,2);
});
test('offline queue survives reload and uploads after reconnection',async()=>{
 const backend=server(),a=device(backend);a.offline();accept(a,'wolf');await a.store.sync();assert.equal(a.store.pending,1);assert.equal(backend.events.length,0);const restored=device(backend,a.storage);assert.equal(restored.store.read('g').events[0].workId,'wolf');await restored.store.sync();assert.equal(restored.store.pending,0);const other=device(backend);await other.store.sync();assert.equal(other.store.read('g').events.length,1);
});
test('simultaneous acceptance on two phones counts only one physical copy',async()=>{
 const backend=server(),a=device(backend),b=device(backend);accept(a,'wolf');accept(b,'wolf');await Promise.all([a.store.sync(),b.store.sync()]);await a.store.sync();assert.equal(scanSessionSummary(a.store.read('g'),data.students).copies,1);assert.equal(scanSessionSummary(b.store.read('g'),data.students).copies,1);
});
test('imports old device journals without duplicating the same event from two scopes',async()=>{
 const backend=server(),storage=new Storage();const old={id:'old',groupId:'g',events:[{id:'old:1',studentId:'child',workId:'wolf',version:1,status:'matched',accepted:true,extraCopy:false,comment:'',at:'2026-11-19'}]};storage.setItem('legacy:g',JSON.stringify(old));storage.setItem('legacy:*',JSON.stringify({...old,groupId:'*'}));const a=device(backend,storage);assert.equal(a.store.pending,1);await a.store.sync();await a.store.sync();assert.equal(backend.events.length,1);
});
test('reset propagates; late offline marks stay in the old round',async()=>{
 const backend=server(),a=device(backend),b=device(backend);accept(a,'wolf');await a.store.sync();await b.store.sync();b.offline();accept(b,'tower');await a.store.reset('g');await a.store.sync();assert.equal(a.store.read('g').events.length,0);b.online();await b.store.sync();assert.equal(b.store.read('g').events.length,0);assert.equal(backend.events.length,2);accept(b,'tower');await b.store.sync();await a.store.sync();assert.equal(a.store.read('g').events.length,1);
});
test('two tabs sharing storage do not overwrite each others offline queues',async()=>{
 const backend=server(),storage=new Storage(),a=device(backend,storage),b=device(backend,storage);accept(a,'wolf');accept(b,'tower');const restored=device(backend,storage);assert.equal(restored.store.pending,2);await restored.store.sync();assert.equal(backend.events.length,2);
});
test('local quota failure does not claim that a scan was saved',()=>{
 const backend=server(),storage=new Storage(),a=device(backend,storage);storage.setItem=()=>{throw new Error('quota');};assert.throws(()=>accept(a,'wolf'),/quota/);assert.equal(a.store.read('g').events.length,0);
});
test('a device can reconnect without recreating its offline store',async()=>{
 const backend=server(),a=device(backend);a.offline();accept(a,'wolf');await a.store.sync();a.online();await a.store.sync();assert.equal(a.store.pending,0);assert.equal(backend.events.length,1);
});
test('legacy journal survives migration before the child directory has downloaded',async()=>{
 const backend=server(),storage=new Storage();let students=[];storage.setItem('legacy:g',JSON.stringify({id:'old',groupId:'g',events:[{id:'old:1',studentId:'child',workId:'wolf',version:1,status:'matched',accepted:true,extraCopy:false,comment:'',at:'2026-11-19'}]}));
 const store=createCloudScanStore({storage,key:'cloud',legacyKey:id=>'legacy:'+id,getData:()=>({students,groups:data.groups}),request:backend.request});await store.sync();assert.equal(JSON.parse(storage.getItem('legacy:g')).events.length,1);students=data.students;store.migrate();await store.sync();assert.equal(backend.events.length,1);
});
test('unknown QR attempts remain on the device without blocking cloud uploads',async()=>{
 const backend=server(),a=device(backend);a.store.write('g',appendScanEvent(a.store.read('g'),{kind:'unknown',status:'unknown'}));accept(a,'wolf');await a.store.sync();assert.equal(a.store.pending,0);assert.equal(a.store.read('g').events.length,2);assert.equal(backend.events.length,1);
});

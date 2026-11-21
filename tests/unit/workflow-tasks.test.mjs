import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveWorkflowTasks,workflowTaskScopeKey,workflowWorkRevision} from '../../js/services/workflow-tasks.js';
const now='2026-11-21T12:00:00Z';
const base=()=>({projects:[{id:'p',name:'Школа'}],classes:[{id:'g',projectId:'p',name:'2А'}],students:[{id:'s',classId:'g',firstName:'Адам',lastName:'Исаев',catalogIds:['wolf'],paymentStatus:'unpaid'}],catalog:[{id:'wolf',name:'Страж гор',price:350},{id:'tower',name:'Джигит у башни',price:800}],orders:[],media:[],finalWorks:[]});
const source=(extra={})=>({id:'m',studentId:'s',type:'photo',serviceId:'wolf',capturedAt:'2026-11-19T09:00:00Z',createdAt:'2026-11-20T09:00:00Z',capturedBy:'op',...extra});
const work=(extra={})=>({id:'w',studentId:'s',groupId:'g',serviceId:'wolf',sourceMediaId:'m',status:'ready',createdAt:'2026-11-20T10:00:00Z',finalImageVersion:5,...extra});
const derive=(data,opts={})=>deriveWorkflowTasks(data,{now,...opts});
const actions=(data,opts)=>derive(data,opts).map(row=>row.action);
test('shooting creates generation automatically; two services and duplicated positions remain distinct',()=>{
 const data=base();
 assert.deepEqual(actions(data),['capture']);
 data.students[0].selectedServices=[{serviceId:'wolf',quantity:2},{serviceId:'wolf',entryId:'copy'},{serviceId:'tower'}];
 data.media=[source(),source({id:'t',serviceId:'tower'})];
 assert.deepEqual(actions(data),['generate','generate']);
 assert.equal(new Set(derive(data).map(row=>row.id)).size,2);
 assert.equal(derive(data)[0].dueAt,'');
 assert.deepEqual(derive(data),derive(structuredClone(data)));
});
test('late import keeps the capture date and no old record is given a made-up deadline',()=>{
 const data=base();data.media=[source({importedAt:'2026-11-21T11:00:00Z'})];
 const task=derive(data)[0];assert.equal(task.capturedAt,'2026-11-19T09:00:00Z');assert.equal(task.overdue,false);
 data.media=[{id:'old',studentId:'s',type:'photo',createdAt:'2020-01-01'}];
 assert.equal(derive(data)[0].capturedAt,'');
});
test('review is a human decision; approval leads to print, print leads to handout',()=>{
 const data=base();data.media=[source()];data.finalWorks=[work()];
 assert.deepEqual(actions(data),['review']);
 const revision=workflowWorkRevision(data.finalWorks[0]);
 const opts={overrides:{[workflowTaskScopeKey('s','wolf')]:{approvedRevision:revision}}};
 assert.deepEqual(actions(data,opts),['print']);
 data.finalWorks[0].status='printed';assert.deepEqual(actions(data),['deliver']);
 data.finalWorks[0].status='delivered';assert.deepEqual(actions(data),[]);
});
test('scanner acceptance approves only the matching work version',()=>{
 const data=base();data.finalWorks=[work()];data.scanSessions=[{events:[{accepted:true,workId:'w',version:4}]}];
 assert.deepEqual(actions(data),['review']);
 data.scanSessions[0].events.push({accepted:true,workId:'w',version:5});assert.deepEqual(actions(data),['print']);
});
test('correction keeps delivered history and a replacement requires its own check and print',()=>{
 const data=base();data.finalWorks=[work({status:'delivered',correction:{status:'open',comment:'Не похож'}})];
 assert.deepEqual(actions(data),['redo']);assert.equal(data.finalWorks[0].status,'delivered');
 data.finalWorks.push(work({id:'w2',status:'ready',createdAt:'2026-11-21T09:00:00Z'}));
 assert.deepEqual(actions(data),['review']);assert.equal(data.finalWorks[0].status,'delivered');
 const opts={overrides:{[workflowTaskScopeKey('s','wolf')]:{approvedRevision:workflowWorkRevision(data.finalWorks[1])}}};
 assert.deepEqual(actions(data,opts),['print']);
});
test('format migrations and print status timestamps do not invalidate an approval',()=>{
 const record=work();const revision=workflowWorkRevision(record);
 assert.equal(workflowWorkRevision({...record,finalImageVersion:6,updatedAt:now}),revision);
 assert.notEqual(workflowWorkRevision({...record,resultMediaId:'new-image'}),revision);
});
test('unidentified new source after delivery asks to sort it without regenerating completed work',()=>{
 const data=base();data.finalWorks=[work({status:'delivered'})];data.media=[source(),source({id:'new',serviceId:undefined,capturedAt:'2026-11-21T09:00:00Z',createdAt:'2026-11-21T10:00:00Z'})];
 assert.deepEqual(actions(data),['sort_sources']);
 assert.equal(derive(data)[0].sourceId,'new');assert.equal(data.finalWorks[0].status,'delivered');
 const opts={overrides:{[workflowTaskScopeKey('s','wolf')]:{reviewedSourceIds:['new']}}};assert.deepEqual(actions(data,opts),[]);
});
test('an unassigned photo for a completed child with two services creates one sorting task',()=>{
 const data=base();data.students[0].catalogIds.push('tower');data.finalWorks=[work({status:'delivered'}),work({id:'t',serviceId:'tower',status:'delivered'})];data.media=[source({id:'new',serviceId:undefined,capturedAt:'2026-11-21T09:00:00Z',createdAt:now})];
 assert.deepEqual(actions(data),['sort_sources']);
});
test('reshoot stays pending until a later source arrives; additional reference does not cancel history',()=>{
 const data=base();data.finalWorks=[work({status:'delivered'})];data.media=[source()];
 const opts={overrides:{[workflowTaskScopeKey('s','wolf')]:{requestedAction:'capture',requestedAt:'2026-11-21T09:00:00Z',previousSourceId:'m'}}};
 assert.deepEqual(actions(data,opts),['capture']);
 data.media.push(source({id:'reshoot',capturePurpose:'reshoot',capturedAt:'2026-11-21T10:00:00Z',createdAt:now}));
 assert.deepEqual(actions(data,opts),['generate']);
 assert.equal(data.finalWorks[0].status,'delivered');
});
test('partial upload never becomes ready for generation',()=>{
 const data=base();data.media=[source({uploadStatus:'uploading'})];
 assert.deepEqual(actions(data),['capture']);assert.match(derive(data)[0].reason,/передаются/);
});
test('unperformed services are not debts and payment needs an actual price plus explicit check context',()=>{
 const data=base(),opts={overrides:{[workflowTaskScopeKey('s','wolf')]:{paymentCheck:true,dueAt:now}}};
 assert.equal(actions(data,opts).includes('payment'),false);
 data.finalWorks=[work({status:'printed'})];assert.deepEqual(actions(data),['deliver']);
 assert.equal(actions(data,opts).includes('payment'),true);
 data.students[0].paymentStatus='paid';assert.equal(actions(data,opts).includes('payment'),false);
 data.students[0].paymentStatus='unpaid';delete data.catalog[0].price;assert.equal(actions(data,opts).includes('payment'),false);
});
test('photographer projection hides money and generation, and only shows assigned capture work',()=>{
 const data=base(),scope=workflowTaskScopeKey('s','wolf');
 assert.deepEqual(actions(data,{role:'photographer',userId:'op'}),[]);
 assert.deepEqual(actions(data,{role:'photographer',userId:'op',overrides:{[scope]:{assigneeId:'op'}}}),['capture']);
 data.media=[source()];assert.deepEqual(actions(data,{role:'photographer',userId:'op',overrides:{[scope]:{assigneeId:'op'}}}),[]);
});
test('explicit due date and snooze survive identical reconstruction without suppressing task completion rules',()=>{
 const data=base(),scope=workflowTaskScopeKey('s','wolf');
 const overrides=new Map([[scope,{dueAt:'2026-11-20',assigneeId:'op',snoozedUntil:'2026-11-22'}]]);
 const [task]=derive(data,{overrides});assert.equal(task.overdue,true);assert.equal(task.snoozedUntil,'2026-11-22');assert.equal(task.assigneeId,'op');
});

test('required review closes after current revision approval even if fulfilled legacy flags remain',()=>{
 const data=base();data.finalWorks=[work({status:'delivered',workflowVersion:2,workflowReview:{required:true},workflowFulfillment:{version:'old'}})];
 assert.deepEqual(actions(data),['review']);
 const opts={overrides:{[workflowTaskScopeKey('s','wolf')]:{approvedRevision:workflowWorkRevision(data.finalWorks[0])}}};
 assert.deepEqual(actions(data,opts),['print']);
});

test('old scan and review flags cannot approve an explicitly new workflow revision',()=>{
 const data=base();data.finalWorks=[work({status:'printed',workflowVersion:'new',workflowReview:{required:true},reviewStatus:'approved'})];data.scanSessions=[{events:[{workId:'w',accepted:true,version:5}]}];
 assert.deepEqual(actions(data),['review']);
});

test('calendar due date on today is not overdue at midday',()=>{
 const data=base(),overrides={[workflowTaskScopeKey('s','wolf')]:{dueAt:'2026-11-21'}};
 assert.equal(derive(data,{overrides})[0].overdue,false);
});
test('legacy order service remains actionable without a catalog selection on the child',()=>{
 const data=base();delete data.students[0].catalogIds;data.orders=[{studentId:'s',items:[{type:'wolf__portrait',status:'done',fileIds:['m']}]}];data.media=[source({serviceId:undefined,orderType:'wolf__portrait'})];
 assert.deepEqual(actions(data),['generate']);
});

test('cached financial fields do not expose payment tasks to manager or viewer',()=>{
 const data=base();data.finalWorks=[work({status:'printed'})];const overrides={[workflowTaskScopeKey('s','wolf')]:{paymentCheck:true}};
 for(const role of ['manager','viewer','photographer'])assert.equal(actions(data,{role,overrides}).includes('payment'),false);
});

test('hydrated Blob and serialized remote blob have the same cross-device revision',()=>{
 const record=work({originalFinalImage:new Blob(['pixels'])});
 assert.equal(workflowWorkRevision(record),workflowWorkRevision({...record,originalFinalImage:{$syncBlob:'hash-on-server'}}));
});

test('latest QR rejection makes a redo task until a later successful current-version check',()=>{
 const data=base();data.finalWorks=[work({status:'printed'})];data.scanSessions=[{events:[{id:'accepted',accepted:true,workId:'w',version:5,at:'2026-11-20T11:00:00Z'},{id:'rejected',status:'rejected',accepted:false,workId:'w',version:5,comment:'Лицо другое',at:'2026-11-21T11:00:00Z'}]}];
 assert.deepEqual(actions(data),['redo']);assert.equal(derive(data)[0].reason,'Лицо другое');
 data.scanSessions[0].events.push({id:'after',accepted:true,workId:'w',version:5,at:'2026-11-21T12:00:00Z'});assert.deepEqual(actions(data),['deliver']);
});

test('explicit purpose on late unassigned source drives replacement for one chosen service',()=>{
 const data=base();data.students[0].catalogIds.push('tower');data.finalWorks=[work({status:'delivered'}),work({id:'tower',serviceId:'tower',status:'delivered'})];data.media=[source(),source({id:'late',serviceId:undefined,capturedAt:'2026-11-18T09:00:00Z',createdAt:'2026-11-21T09:00:00Z'})];
 const overrides={[workflowTaskScopeKey('s','wolf')]:{sourceMediaId:'late',sourcePurpose:'correction',reviewedSourceIds:['late']}};
 assert.deepEqual(actions(data,{overrides}),['redo']);assert.equal(derive(data,{overrides})[0].sourceId,'late');
});

test('reshoot assignment completes into review once a new result uses the new source',()=>{
 const data=base();data.media=[source(),source({id:'new',capturePurpose:'reshoot',capturedAt:'2026-11-21T10:00:00Z',createdAt:'2026-11-21T10:00:00Z'})];data.finalWorks=[work({status:'delivered'})];
 const overrides={[workflowTaskScopeKey('s','wolf')]:{requestedAction:'capture',requestedAt:'2026-11-21T09:00:00Z',previousSourceId:'m',sourceMediaId:'m'}};
 assert.deepEqual(actions(data,{overrides}),['generate']);
 data.finalWorks.push(work({id:'replacement',sourceMediaId:'new',createdAt:'2026-11-21T11:00:00Z',workflowReview:{required:true},workflowVersion:'replacement'}));
 assert.deepEqual(actions(data,{overrides}),['review']);
});

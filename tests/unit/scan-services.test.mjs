import test from 'node:test';
import assert from 'node:assert/strict';
import {assessGroupScan, appendScanEvent, scanSessionSummary, validatedScannedWorks} from '../../js/services/group-scan.js';
const student={id:'child',classId:'group'};
const works=['wolf','tower','horse'].map(id=>({id,studentId:'child',groupId:'group',finalImageVersion:1}));
const data={students:[student],works};
const child={kind:'student',studentId:'child'};
const target=id=>({kind:'work',studentId:'child',workId:id});
const empty=()=>({id:'session',groupId:'group',events:[]});
test('shared child QR requires a service even after legacy child-only acceptance',()=>{
 let session=appendScanEvent(empty(),{...child,status:'matched'},{accept:true});
 const result=assessGroupScan(child,'group',session,data);
 assert.equal(result.status,'choose');
 assert.throws(()=>appendScanEvent(session,result,{accept:true}));
 assert.equal(scanSessionSummary(session,data.students).works,0);
});
test('one common QR can confirm three services individually and survive session restore',()=>{
 let session=empty();
 for(const id of ['wolf','tower','horse']){
  assert.equal(assessGroupScan(child,'group',session,data).status,'choose');
  const result=assessGroupScan(target(id),'group',session,data);
  assert.equal(result.status,'matched');
  session=JSON.parse(JSON.stringify(appendScanEvent(session,result,{accept:true})));
  assert.equal(assessGroupScan(target(id),'group',session,data).status,'duplicate');
 }
 assert.equal(scanSessionSummary(session,data.students).copies,3);
 assert.deepEqual([...validatedScannedWorks(session,works,['child'])],['wolf','tower','horse']);
 assert.throws(()=>appendScanEvent(session,assessGroupScan(target('wolf'),'group',session,data),{accept:true}));
});
test('new image versions and corrections keep their existing review rules',()=>{
 const session=appendScanEvent(empty(),assessGroupScan(target('wolf'),'group',empty(),data),{accept:true});
 assert.equal(assessGroupScan(target('tower'),'group',session,data).status,'matched');
 assert.equal(assessGroupScan(target('wolf'),'group',session,{...data,works:works.map(w=>({...w,finalImageVersion:2}))}).status,'matched');
 assert.equal(assessGroupScan(target('wolf'),'group',session,{...data,works:works.map(w=>({...w,correction:{status:'open'}}))}).status,'correction');
 assert.equal(assessGroupScan(child,'other',session,data).status,'foreign');
});

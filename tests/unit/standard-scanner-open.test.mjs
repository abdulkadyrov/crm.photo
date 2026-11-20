import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {repairStandardScanner} from '../../scripts/release/repair-standard-scanner.mjs';
// The release had inserted the journal inside the per-student media lock callback.
const broken=`let groupScanCloudStore=null;
async function persistStudentMedia(file, target, id) {
 return withStudentMediaLock(target.studentId, async () => {
function cloudScanJournal() {
 groupScanCloudStore ||= createCloudScanStore();
  groupScanCloudStore.start();return groupScanCloudStore;
}
 return file;
 });
}
function openScanner(){return cloudScanJournal().read();}
`;
test('ordinary QR scanner can open before any photograph has been saved',async()=>{
 const context={createCloudScanStore:()=>({start(){},read(){return 'cloud journal';}}),withStudentMediaLock:(_,action)=>action()};
 assert.throws(()=>vm.runInNewContext(broken+'openScanner();',{...context}),/cloudScanJournal is not defined/);
 const fixed=repairStandardScanner(broken);assert.equal(vm.runInNewContext(fixed+'openScanner();',{...context}),'cloud journal');
 assert.equal(await vm.runInNewContext(fixed+`persistStudentMedia('original photo',{studentId:'child'},'media');`,{...context}),'original photo');
 assert.equal(repairStandardScanner(fixed),fixed);
});
test('release repair refuses an unfamiliar overlay instead of replacing unrelated code',()=>{assert.throws(()=>repairStandardScanner('function other(){}'),/Unexpected/);});

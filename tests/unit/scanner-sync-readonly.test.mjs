import test from 'node:test';import assert from 'node:assert/strict';import {canApplyRemoteChanges} from '../../js/services/record-sync.js';
test('scanner camera can receive server metadata while the scanner overlay remains mounted',()=>{
 const video={paused:false,ended:false,closest:s=>s==='.group-scan-panel'?{}:null};const doc={querySelector:()=>null,querySelectorAll:s=>s==='video'?[video]:[]};assert.equal(canApplyRemoteChanges(doc),true);
});
test('a scanner note draft still protects the currently reviewed work',()=>{const doc={querySelector:()=>null,querySelectorAll:s=>s==='video'?[]:[{value:'Не похож'}]};assert.equal(canApplyRemoteChanges(doc),false);});

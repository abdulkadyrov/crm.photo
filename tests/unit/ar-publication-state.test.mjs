import test from 'node:test';
import assert from 'node:assert/strict';
import { arPublicationState } from '../../js/services/ar-publication-state.js';
test('local queue does not claim server receipt or readiness',()=>{
 const local=arPublicationState({arStatus:'queued'});
 assert.equal(local.ready,false);assert.equal(local.busy,true);assert.match(local.title,/устройстве/);
 assert.match(arPublicationState({arStatus:'queued',arJobId:'job'}).title,/сервере/);
});
test('retry retains the task and only confirmed ready allows completion',()=>{
 assert.equal(arPublicationState({arStatus:'retry'}).busy,true);
 assert.equal(arPublicationState({arStatus:'ready'}).ready,true);
 assert.equal(arPublicationState({arStatus:'failed',arError:'Ошибка'}).detail,'Ошибка');
});

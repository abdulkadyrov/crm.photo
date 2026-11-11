import test from 'node:test';
import assert from 'node:assert/strict';
import {cardSummary,selectedServiceEntries,projectArchiveName} from '../../js/services/card-summary.js';
test('card counts distinguish selected children, distinct child/service orders and actual original photos',()=>{
 const students=[{id:'a',selectedServices:[{serviceId:'s',quantity:2},{serviceId:'t',quantity:1}]},{id:'b',catalogIds:['s']},{id:'c'}];
 const media=[{studentId:'a',type:'photo',blob:new Blob(['original'])},{studentId:'a',type:'video',blob:new Blob(['video'])},{studentId:'b',type:'image',blob:new Blob(['image'])},{studentId:'c',type:'photo'},{studentId:'outside',type:'photo',blob:new Blob(['other'])}];
 const counts=cardSummary(students,media);
 assert.equal(counts.photos,2);assert.equal(counts.requests,2);assert.equal(counts.orders,3);
 assert.equal(cardSummary([students[0]],media).orders,2);
 assert.equal(cardSummary([],media).photos,0);
});
test('selection is visible even before the service catalog is imported',()=>{
 assert.equal(selectedServiceEntries({catalogId:'not-installed-yet'})[0].id,'not-installed-yet');
 assert.equal(selectedServiceEntries({}).length,0);
});
test('project archive starts with school, then version and Moscow date',()=>{
 assert.equal(projectArchiveName('Гелдаган школа 3',158,new Date('2026-11-11T22:30:00Z')),'Гелдаган школа 3_v158_2026-11-12.zip');
 assert(!projectArchiveName('Школа / 3',158).includes('/'));
});

test('repeat imports, duplicate service rows and extra copies never inflate requests or orders',()=>{
 const student={id:'s',parentOrderIds:['request-1','request-2'],selectedServices:[{serviceId:'a',quantity:8},{serviceId:'b',quantity:2},{serviceId:'a',quantity:8}]};
 const summary=cardSummary([student],[]);
 assert.equal(summary.requests,1);assert.equal(summary.orders,2);
 assert.equal(cardSummary([{id:'unselected',parentOrderIds:['old-request']}],[]).requests,0);
});

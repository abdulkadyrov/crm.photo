import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function buildTransferData('),source.indexOf('\nfunction documentsForProjectTransfer('));
test('project export can omit service payloads while retaining orders, photos and service IDs',()=>{
 const project={id:'p'},group={id:'c',projectId:'p'},student={id:'s',classId:'c',catalogIds:['svc']};
 const photo={id:'m',studentId:'s',blob:new Blob(['original photo'])};
 const order={id:'o',studentId:'s',items:[{serviceId:'svc',fileIds:['m']}]};
 const fn=vm.runInNewContext(`(${body})`,{
  state:{data:{students:[student],catalog:[{id:'svc',previewDataUrl:'data:big'}],orders:[order],media:[photo],finalWorks:[],operators:[],operatorEvents:[],settings:[],templates:[]}},
  emptyTransferData:()=>({}),projectById:()=>project,classesByProject:()=>[group],serviceIdsForStudents:()=>new Set(['svc']),
  documentsForProjectTransfer:()=>[],fillTransferData:(_,patch)=>patch
 });
 const lean=fn('project',{projectId:'p',omitServices:true});
 assert.equal(lean.services.length,0);assert.equal(lean.media[0],photo);assert.equal(lean.orders[0],order);assert.equal(lean.students[0].catalogIds[0],'svc');
 const portable=fn('project',{projectId:'p'});assert.equal(portable.services[0].id,'svc');
});

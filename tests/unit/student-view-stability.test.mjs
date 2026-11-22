import test from 'node:test';
import assert from 'node:assert/strict';
import {studentViewRevision,captureStudentView,restoreStudentView} from '../../js/services/student-view-stability.js';
const base=()=>({students:[{id:'s',classId:'g',catalogIds:['wolf']},{id:'other',classId:'g'}],classes:[{id:'g',projectId:'p'}],projects:[{id:'p'}],orders:[{id:'o',studentId:'s',items:[]}],media:[{id:'m',studentId:'s',blob:new Blob(['photo'],{type:'image/jpeg'})}],finalWorks:[],catalog:[{id:'wolf',name:'Волк'},{id:'tower',name:'Башня'}],settings:[]});
test('unchanged records and other children never invalidate the open card',()=>{
 const data=base(),revision=studentViewRevision(data,'s');
 assert.equal(studentViewRevision(structuredClone(data),'s'),revision);
 data.students[1].paymentStatus='paid';data.catalog[1].name='Другая башня';data.finalWorks.push({id:'w-other',studentId:'other'});assert.equal(studentViewRevision(data,'s'),revision);
 data.finalWorks.push({id:'w',studentId:'s',contentVersion:'v1'});assert.notEqual(studentViewRevision(data,'s'),revision);
 const before=studentViewRevision(data,'s');data.finalWorks[1].contentVersion='v2';assert.notEqual(studentViewRevision(data,'s'),before);
});
test('real source arrival and original download completion invalidate the card',()=>{
 const data=base(),before=studentViewRevision(data,'s');data.media[0].blob=null;assert.notEqual(studentViewRevision(data,'s'),before);
 assert.notEqual(studentViewRevision(data,'s',[{id:'new-photo',studentId:'s',createdAt:'2026-11-22'}]),studentViewRevision(data,'s'));
 assert.equal(studentViewRevision(data,'s',[{id:'unrelated',studentId:'other'}]),studentViewRevision(data,'s'));
});
test('meaningful card refresh retains open sections, inner scroll, focus and page position',()=>{
 const make=(id,open)=>({id,tagName:'DETAILS',dataset:{},className:'',open,scrollTop:0,scrollLeft:0,querySelector:()=>null});
 const first=make('summary',true),second=make('services',false),scroll={id:'images',tagName:'DIV',dataset:{},className:'',scrollTop:91,scrollLeft:12,querySelector:()=>null};let focused=false,position;
 const button={tagName:'BUTTON',attributes:[{name:'data-student-tab',value:'media'}],getAttribute:key=>key==='data-student-tab'?'media':null,focus:()=>focused=true};
 const root={ownerDocument:{activeElement:button},contains:n=>n===button,querySelectorAll:selector=>selector==='details'?[first,second]:selector==='*'?[first,second,scroll]:[button]};
 const win={scrollY:704,scrollX:0,scrollTo:value=>position=value},saved=captureStudentView(root,win);first.open=false;second.open=true;scroll.scrollTop=0;
 restoreStudentView(saved,root,win);assert.equal(first.open,true);assert.equal(second.open,false);assert.equal(scroll.scrollTop,91);assert.equal(scroll.scrollLeft,12);assert.equal(position.top,704);assert.equal(focused,true);
});

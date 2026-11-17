import test from 'node:test';import assert from 'node:assert/strict';
import {groupedPrintPages} from '../../js/services/print-group-pages.js';
import {createPhotoPagesPdf} from '../../js/services/photo-pdf-service.js';
test('selected groups stay together with two ink-free separators each',()=>{
 const pages=['a','b','a'].map((group,i)=>({work:{group,id:i}}));
 const result=groupedPrintPages(pages,w=>w.group);
 assert.deepEqual(result.map(p=>p.blank?'blank-'+p.groupId:p.work.id),['blank-a',0,2,'blank-a','blank-b',1,'blank-b']);
 assert.equal(groupedPrintPages([],w=>w.group).length,0);assert.equal(groupedPrintPages(pages,w=>w.group,false).length,3);
});
test('blank PDF sheets contain no image or drawing operations',async()=>{
 const pdf=await createPhotoPagesPdf([{blank:true,width:2480,height:3508}]);const text=await pdf.text();
 assert.match(text,/Count 1/);assert.match(text,/Length 0/);assert.doesNotMatch(text,/Subtype \/Image|\/Photo Do/);
});

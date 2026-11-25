import test from 'node:test';
import assert from 'node:assert/strict';
import {createMultiProjectPrintRequest} from '../../js/services/multi-project-print.js';
const part=(id,projectId,workId)=>({id,projectId,title:projectId,revision:0,ready:false,groups:[{id:projectId+'-g',name:'1а'}],students:[{id:projectId+'-s'}],works:[{id:workId,image:{$syncBlob:'a'}}],items:[]});
test('cross-project selection keeps blob scope and writes only the owning list',async()=>{
 const db=new Map([['one',part('one','school','w1')],['two',part('two','garden','w2')]]),writes=[];
 const request=async(method,id,body)=>{if(!id)return structuredClone([...db.values()].find(p=>p.projectId===body.projectId));const p=db.get(id);if(method==='POST'){writes.push(id);p.revision++;p.items=[{workId:body.workId,imageHash:'a',copies:1}];}return structuredClone(p);};
 const requestAll=createMultiProjectPrintRequest(request);const initial=await requestAll('POST','',{projectIds:['school','garden','school']});assert.equal(initial.id,'multi_one_two');assert.equal(initial.works[1].projectId,'garden');assert.match(initial.groups[1].name,/garden/);
 const updated=await requestAll('POST',initial.id,{workId:'w2',selected:true});assert.deepEqual(writes,['two']);assert.equal(updated.items[0].workId,'w2');assert.equal(updated.revision,1);assert.deepEqual(await requestAll('GET',initial.id,null,1),{unchanged:true,revision:1});
 await assert.rejects(()=>requestAll('POST',initial.id,{workId:'foreign',selected:true}),/недоступна/);
});
test('an inaccessible constituent project fails the whole shared read',async()=>{
 const request=createMultiProjectPrintRequest(async(_,id)=>{if(id==='two')throw Error('Forbidden');return part('one','school','w1');});await assert.rejects(()=>request('GET','multi_one_two'),/Forbidden/);
});

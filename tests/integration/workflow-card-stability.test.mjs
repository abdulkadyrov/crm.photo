import test from 'node:test';import assert from 'node:assert/strict';
import {createWorkflowWorkspace} from '../../js/ui/workflow-workspace.js';
test('repeated workflow refreshes keep the same open student card node; real changes update it in place',t=>{
 const oldDocument=globalThis.document,oldStorage=globalThis.localStorage;let card=null,writes=0,appends=0;
 const root={querySelector:selector=>selector==='[data-workflow-card]'?card:selector==='[data-workflow-new]'?{}:null,append:node=>{card=node;appends++;}};
 globalThis.document={querySelector:selector=>selector==='.student-overview-card'?root:selector==='.student-detail-shell'?{dataset:{studentState:'s'}}:null,createElement:()=>({dataset:{},open:false,set innerHTML(value){writes++;},querySelectorAll:()=>[]})};
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 const data={projects:[{id:'p'}],classes:[{id:'g',projectId:'p'}],students:[{id:'s',classId:'g',catalogIds:['wolf']}],catalog:[{id:'wolf',name:'Волк'}],orders:[],media:[],finalWorks:[]};
 const workspace=createWorkflowWorkspace({getData:()=>data,account:()=>({id:'owner',role:'admin'}),enabled:false,getRoute:()=> 'student'});
 t.after(()=>{workspace.stop();globalThis.document=oldDocument;globalThis.localStorage=oldStorage;});
 workspace.refresh();const original=card;card.open=true;assert.equal(writes,1);
 for(let i=0;i<8;i++)workspace.refresh();assert.equal(card,original);assert.equal(writes,1);assert.equal(card.open,true);assert.equal(appends,1);
 data.media.push({id:'photo',studentId:'s',type:'photo',orderType:'wolf__portrait',blob:new Blob(['photo']),createdAt:'2026-11-22'});workspace.refresh();assert.equal(card,original);assert.equal(card.open,true);assert.equal(writes,2);assert.equal(appends,1);
});

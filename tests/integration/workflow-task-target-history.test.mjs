import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigationHistory} from '../../js/services/navigation-history.js';
import {createWorkflowWorkspace} from '../../js/ui/workflow-workspace.js';
test('task target links and browser Back restore filters, expanded schools and list scroll',()=>{
 let state,listener,index=0;const entries=[null];
 const win={addEventListener:(_,fn)=>listener=fn,history:{get state(){return entries[index];},replaceState:v=>entries[index]=structuredClone(v),pushState(v){entries.splice(++index);entries[index]=structuredClone(v);},back(){index--;listener({state:entries[index]});}}};
 const nav=createNavigationHistory({win,scope:()=> 'owner',capture:()=>structuredClone(state),restore:v=>state=structuredClone(v)});
 const data={projects:[{id:'p',name:'Школа'}],classes:[{id:'g',projectId:'p'}],students:[{id:'s',classId:'g'}]};
 const workspace=createWorkflowWorkspace({getData:()=>data,account:()=>({id:'owner',role:'admin'}),enabled:false,navigate:(route,params)=>nav.transition(()=>state={route,...params}),notify:message=>{throw Error(message);}});
 const origin={route:'tasks',workflowFilters:{projectId:'p',period:'week',action:'capture',classId:'g'},openDetails:[1,3],innerScroll:[{index:2,top:90,left:0}],scrollY:740};
 nav.transition(()=>state=structuredClone(origin));
 for(const task of [{entityKind:'project',projectId:'p',classId:'project-notes:p'},{entityKind:'project',projectId:'p',classId:'g'},{entityKind:'student',projectId:'p',studentId:'s',classId:'g'}]){
  workspace.openLinkedTarget(task);assert.notEqual(state.route,'tasks');if(task.studentId)assert.equal(state.studentId,'s');
  win.history.back();assert.deepEqual(state,origin);
 }
 workspace.stop();
});

import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('the real route snapshot captures an editor draft for return from its linked record',()=>{
 const source=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
 const draft={accountId:'owner',task:{id:'t',projectId:'p'},values:{reason:'Ещё не сохранено',dueAt:'2026-11-25'}};
 const context=vm.createContext({state:{route:'tasks',query:'школа',filter:'all'},view:{querySelector:()=>null,querySelectorAll:()=>[]},document:{activeElement:null},window:{scrollY:740,scrollX:0},studentDirectoryQueries:new Map(),workflowWorkspace:{filters:()=>({period:'week',projectId:'p'}),editorNavigationState:()=>draft}});
 vm.runInContext(source.slice(source.indexOf('function routeSnapshot()'),source.indexOf('\nlet cancelRouteScrollRestore')),context);
 const result=context.routeSnapshot();assert.deepEqual(JSON.parse(JSON.stringify(result.workflowEditor)),draft);assert.equal(result.scrollY,740);assert.equal(result.workflowFilters.period,'week');
});

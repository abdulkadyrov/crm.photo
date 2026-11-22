import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveWorkflowTaskTarget,workflowTaskTargetLabel} from '../../js/services/workflow-task-target.js';
import {renderWorkflowTasks,bindWorkflowTasks} from '../../js/ui/workflow-tasks.js';
const data={projects:[{id:'p',name:'Школа'},{id:'other'}],classes:[{id:'g',projectId:'p'},{id:'foreign',projectId:'other'}],students:[{id:'s',classId:'g'},{id:'foreign-child',classId:'foreign'}]};
test('task targets open the exact project, group or child without leaking another scope',()=>{
 const project={entityKind:'project',projectId:'p',studentId:'project_p',classId:'project-notes:p'};
 assert.deepEqual(resolveWorkflowTaskTarget(project,data),{route:'classes',params:{projectId:'p',classId:null,studentId:null,studentFormClassId:null,query:'',filter:'all'},kind:'project',label:'Открыть проект'});
 const group=resolveWorkflowTaskTarget({...project,classId:'g'},data);assert.equal(group.kind,'group');assert.equal(group.params.classId,'g');assert.equal(group.label,'Открыть группу');
 for(const entityKind of ['student',undefined]){const child=resolveWorkflowTaskTarget({entityKind,projectId:'p',studentId:'s',classId:'g'},data);assert.equal(child.route,'student');assert.equal(child.params.studentId,'s');assert.equal(child.label,'Открыть ребёнка');}
 assert.equal(resolveWorkflowTaskTarget({...project,classId:'foreign'},data),null);
 assert.equal(resolveWorkflowTaskTarget({entityKind:'student',projectId:'p',studentId:'foreign-child'},data),null);
 assert.equal(resolveWorkflowTaskTarget({entityKind:'student',projectId:'p',studentId:'deleted'},data),null);
 assert.equal(resolveWorkflowTaskTarget(project,{...data,projects:[{id:'p',deletedAt:'now'}]}),null);
});
test('target navigation has its own explicit control and does not open task editing',()=>{
 const tasks=[{id:'t',entityKind:'student',projectId:'p',studentId:'s',classId:'g',projectName:'Школа',className:'3а',studentName:'Ребёнок',serviceName:'Напомнить',action:'reminder',title:'Уточнить имя'}];
 const html=renderWorkflowTasks({tasks});assert.match(html,/data-wt-target="t"/);assert.match(html,/Открыть ребёнка/);assert.match(html,/data-wt-open="t"/);
 let click;const calls=[];const root={contains:()=>true,addEventListener:(name,fn)=>{if(name==='click')click=fn;},removeEventListener(){}};
 bindWorkflowTasks(root,{onTarget:id=>calls.push(['target',id]),onOpen:id=>calls.push(['task',id]),onEdit:id=>calls.push(['edit',id])});
 const button={dataset:{wtTarget:'t'},hasAttribute:key=>key==='data-wt-target'};click({target:{closest:()=>button}});assert.deepEqual(calls,[['target','t']]);
 assert.equal(workflowTaskTargetLabel({entityKind:'project',classId:'g'}),'Открыть группу');
});

test('task editor exposes an explicit target link independently of saving',async()=>{
 const {renderWorkflowTaskEditor,bindWorkflowTaskEditor}=await import('../../js/ui/workflow-tasks.js');
 const html=renderWorkflowTaskEditor({task:{entityKind:'student',projectId:'p',studentId:'s',classId:'g'},override:{reason:'Несохранённый комментарий',dueAt:'2026-11-25'}});
 assert.match(html,/data-wt-linked-target>Открыть ребёнка/);assert.match(html,/Несохранённый комментарий/);assert.match(html,/2026-11-25/);
 let linked;const calls=[];const form={matches:()=>true,querySelector:selector=>selector==='[data-wt-linked-target]'?{addEventListener:(_,fn)=>linked=fn,removeEventListener(){}}:null,addEventListener(){},removeEventListener(){}};
 bindWorkflowTaskEditor(form,{onTarget:()=>calls.push('target'),onSave:()=>calls.push('save')});linked();assert.deepEqual(calls,['target']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {workflowCreationTarget} from '../../js/ui/workflow-task-create.js';
import {deriveWorkflowTasks} from '../../js/services/workflow-tasks.js';
const data={projects:[{id:'p',name:'Школа'},{id:'other',name:'Другой проект'}],classes:[{id:'g',name:'3а',projectId:'p'},{id:'foreign',projectId:'other'}],students:[{id:'s',firstName:'Алина',lastName:'Смирнова',classId:'g'}],catalog:[],orders:[],media:[],finalWorks:[]};
test('target can stop at project, group or child without an order',()=>{
 assert.equal(workflowCreationTarget(data,{projectId:'p'}).label,'Школа');
 assert.equal(workflowCreationTarget(data,{projectId:'p',classId:'g'}).label,'Школа · 3а');
 assert.equal(workflowCreationTarget(data,{projectId:'p',classId:'g',studentId:'s'}).label,'Школа · 3а · Смирнова Алина');
 assert.equal(workflowCreationTarget(data,{projectId:'p',classId:'foreign'}),null);
 assert.equal(workflowCreationTarget(data,{projectId:'other',classId:'foreign',studentId:'s'}),null);
 assert.equal(workflowCreationTarget({...data,students:[{...data.students[0],deletedAt:'now'}]},{projectId:'p',classId:'g',studentId:'s'}),null);
});
test('independent child reminders coexist and complete separately without old statuses',()=>{
 const plans=['one','two'].map((id,i)=>({scopeKey:'s::task_'+id,studentId:'s',serviceId:'task_'+id,projectId:'p',classId:'g',entityKind:'student',requestedAction:i?'send':'contact_teacher',title:i?'Отправить готовые фото':'Уточнить написание имени',reason:'Связаться с учителем',dueAt:'2026-11-25'}));
 const tasks=deriveWorkflowTasks(data,{role:'admin',overrides:plans});assert.equal(tasks.length,2);assert.equal(tasks[0].studentName,'Смирнова Алина');assert.equal(tasks[0].className,'3а');assert.equal(tasks[0].manual,true);
 const completed=deriveWorkflowTasks(data,{role:'admin',overrides:[{...plans[0],completedAt:'2026-11-22T10:00:00Z'},plans[1]]});assert.equal(completed.length,1);assert.equal(completed[0].serviceId,'task_two');
 assert.equal(deriveWorkflowTasks({...data,projects:[{id:'other'}]},{role:'admin',overrides:plans}).length,0);
});

test('individual task remains a distinct action with its own description',()=>{
 const data={projects:[{id:'p',name:'Школа'}],classes:[],students:[]};
 const tasks=deriveWorkflowTasks(data,{overrides:[{scopeKey:'project_p::task_custom',studentId:'project_p',serviceId:'task_custom',entityKind:'project',projectId:'p',requestedAction:'custom',title:'Подготовить индивидуальную рамку',reason:'Согласовать цвет с родителем'}]});
 assert.equal(tasks[0].action,'custom');assert.equal(tasks[0].title,'Подготовить индивидуальную рамку');assert.equal(tasks[0].reason,'Согласовать цвет с родителем');
});

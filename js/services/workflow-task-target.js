const visible=record=>record&&!record.deletedAt&&!record.archivedAt&&!record.archived;
export function workflowTaskTargetKind(task={}){
 if(task.entityKind==='student'||task.entityKind!=='project'&&task.studentId&&!task.studentId.startsWith('project_'))return 'student';
 return task.classId&&!task.classId.startsWith('project-notes:')?'group':'project';
}
export function workflowTaskTargetLabel(task){return {student:'Открыть ребёнка',group:'Открыть группу',project:'Открыть проект'}[workflowTaskTargetKind(task)];}
export function resolveWorkflowTaskTarget(task={},data={}){
 const project=(data.projects||[]).find(p=>p.id===task.projectId&&visible(p));if(!project)return null;
 const kind=workflowTaskTargetKind(task),params={projectId:project.id,classId:null,studentId:null,studentFormClassId:null,query:'',filter:'all'};
 if(kind==='student'){
  const student=(data.students||[]).find(s=>s.id===task.studentId&&visible(s));if(!student)return null;
  const group=(data.classes||[]).find(g=>g.id===student.classId&&g.projectId===project.id&&visible(g));if(!group)return null;
  return {route:'student',params:{...params,classId:group.id,studentId:student.id},kind,label:workflowTaskTargetLabel(task)};
 }
 if(kind==='group'){
  const group=(data.classes||[]).find(g=>g.id===task.classId&&g.projectId===project.id&&visible(g));if(!group)return null;
  params.classId=group.id;
 }
 return {route:'classes',params,kind,label:workflowTaskTargetLabel(task)};
}

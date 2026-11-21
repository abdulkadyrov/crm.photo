import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2]||'.';
const file=path.join(root,'js/core/legacy-app.js');let s=fs.readFileSync(file,'utf8');
function replace(a,b){if(!s.includes(a))throw new Error('Missing integration anchor: '+a.slice(0,95));s=s.replace(a,b);}
if(!s.includes('createWorkflowWorkspace')){
 s=`import {createWorkflowWorkspace} from '../ui/workflow-workspace.js?v=275';\nlet workflowWorkspace=null;\n`+s;
 replace('async function refreshData() {',`function workflowTasksWorkspace(){
  if(workflowWorkspace)return workflowWorkspace;
  workflowWorkspace=createWorkflowWorkspace({getData:()=>state.data,account:cloudAccount,enabled:cloudRequired,getRoute:()=>state.route,navigate,setShell,notify,
    mountHistory:finish=>mountDialogHistory({id:'workflow-'+crypto.randomUUID(),restore:finish}),
    readSessions:()=>{const journal=typeof cloudScanJournal==='function'?cloudScanJournal():null;if(journal)return [journal.read('*')];const scope=cloudAccount()?.id||state.currentOperatorId||'local';return ['*',...state.data.classes.map(c=>c.id)].flatMap(id=>{try{const value=JSON.parse(localStorage.getItem('crm-group-scan-v1:'+scope+':'+id)||'null');return value?[value]:[];}catch{return [];}});},
    openTask:task=>{
      if(task.action==='sort_sources')return workflowTasksWorkspace().edit(task);
      navigate('student',{studentId:task.studentId});
      if(['redo','review'].includes(task.action)&&task.workId)return (typeof showFinalWorkComparison==='function'?showFinalWorkComparison(task.workId):showFinalWorkViewer(task.workId,{initialView:'compare'}).then(()=>document.querySelector('.final-work-viewer-backdrop'))).then(panel=>{if(!panel||!['admin','manager'].includes(cloudAccount()?.role||'admin'))return;const actions=document.createElement('div');actions.className='workflow-review-decisions';actions.innerHTML='<button type="button" data-task-reject>Брак / не похож</button><button type="button" data-task-approve>Совпадает</button>';(panel.querySelector('.qr-panel')||panel).append(actions);actions.querySelector('[data-task-approve]').onclick=async()=>{const work=finalWorkById(task.workId);if(!work||work.correction?.status==='open')return notify('Сначала закройте замечание к исправленной работе.');await workflowTasksWorkspace().approveWork(work);notify('Сходство подтверждено');panel.querySelector('[data-close],[data-close-final-work-viewer]')?.click();};actions.querySelector('[data-task-reject]').onclick=async()=>{const work=finalWorkById(task.workId);if(!work)return;await put('finalWorks',stampUpdated({...work,correction:{status:'open',reason:'likeness',comment:'Не похож: отмечено при проверке результата',createdAt:now(),updatedAt:now()}}));await refreshData();notify('Добавлена задача на исправление');panel.querySelector('[data-close],[data-close-final-work-viewer]')?.click();};});
      if(task.action==='generate')return showMontagePanel(task.studentId,task.serviceId,task.sourceId);
      if(task.action==='print')return reviewFinalWorksForPrint({studentIds:[task.studentId],selectedWorks:state.data.finalWorks.filter(w=>w.id===task.workId)});
      if(['deliver','payment'].includes(task.action)&&typeof showFulfillmentPanel==='function')return showFulfillmentPanel('student',task.studentId);
    }});
  return workflowWorkspace;
}

async function refreshData() {`);
 replace('state.data[name] = entries[index];\n  });','state.data[name] = entries[index];\n  });\n  workflowTasksWorkspace().refresh();');
 replace('home: renderHome,','home: renderHome,\n    tasks: ()=>workflowTasksWorkspace().renderPage(),');
 replace('state.lastRenderedRoute = state.route;','state.lastRenderedRoute = state.route;\n  workflowTasksWorkspace().mountShell();\n  if(state.route===\'student\')workflowTasksWorkspace().mountCard(state.studentId);\n  if(state.route===\'home\'&&!view.querySelector(\'[data-open-workflow]\')){const shortcut=document.createElement(\'button\');shortcut.type=\'button\';shortcut.className=\'secondary-button workflow-home-shortcut\';shortcut.dataset.openWorkflow=\'\';shortcut.textContent=\'Задачи и напоминания\';shortcut.onclick=()=>navigate(\'tasks\');view.querySelector(\'.home-toolbar\')?.append(shortcut);}');
 replace('directoryQueries: [...studentDirectoryQueries],','directoryQueries: [...studentDirectoryQueries],\n    workflowFilters: workflowWorkspace?.filters(),');
 replace('const {scrollY,scrollX,rosterDetails,rosterFocus,rosterLetter,directoryQueries,openDetails,innerScroll,...route} = target;','const {scrollY,scrollX,rosterDetails,rosterFocus,rosterLetter,directoryQueries,workflowFilters,openDetails,innerScroll,...route} = target;\n  if(workflowFilters)workflowTasksWorkspace().restoreFilters(workflowFilters);');
 // Existing capture/save flow is retained. Only provenance is added to its media record.
 replace('const mediaRecord = {\n      id,','const mediaRecord = {\n      ...workflowTasksWorkspace().captureMetadata(target),\n      id,');
 replace('capturedBy: target.source === "capture" ? operatorId : undefined,','capturedBy: target.source === "capture" ? (cloudAccount()?.id || operatorId) : undefined,');
 // Stamp only newly created results. Legacy delivered images keep their history.
 s=s.replace(/finalImageVersion: (\d+),/, 'finalImageVersion: $1,\n    workflowVersion: id,\n    workflowReview: {required:true},');
 // Copy an exact approval to the task plan only for newly added scan events.
 const anchor='writeSession:(id,session,archive=false)=>{';
 if(s.includes(anchor))replace(anchor,`writeSession:(id,session,archive=false)=>{
      if(!archive){let previous;try{previous=scanSync?scanSync.read(id):JSON.parse(localStorage.getItem(key(id))||'null');}catch{}const known=new Set((previous?.events||[]).map(e=>e.id));for(const event of session.events||[]){if(known.has(event.id))continue;const work=finalWorkById(event.workId);if(work&&Number(event.version||0)===Number(work.finalImageVersion||0)){if(event.accepted)void workflowTasksWorkspace().approveWork(work).catch(error=>notify(error.message));else if(event.status==='rejected')void put('finalWorks',stampUpdated(correctionUpdate(work,{reason:'likeness',comment:'Не похож: отмечено в QR-проверке'},now()))).then(refreshData).catch(error=>notify(error.message));}}}
      `);
 fs.writeFileSync(file,s);
}
let index=fs.readFileSync(path.join(root,'index.html'),'utf8');if(!index.includes('css/workflow-tasks.css'))index=index.replace('</head>','  <link rel="stylesheet" href="./css/workflow-tasks.css" />\n  </head>');fs.writeFileSync(path.join(root,'index.html'),index);
let sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');const assets=['js/services/workflow-tasks.js','js/services/workflow-task-store.js','js/ui/workflow-tasks.js','js/ui/workflow-workspace.js','js/ui/workflow-scope-panel.js','css/workflow-tasks.css'];const at=sw.indexOf('const APP_SHELL = [');if(at<0)throw new Error('Missing APP_SHELL');const start=at+'const APP_SHELL = ['.length;for(const asset of assets)if(!sw.includes('"./'+asset+'"'))sw=sw.slice(0,start)+'\n  "./'+asset+'",'+sw.slice(start);fs.writeFileSync(path.join(root,'sw.js'),sw);

const backend=path.join(root,'server/app.py');if(fs.existsSync(backend)){let api=fs.readFileSync(backend,'utf8');if(!api.includes('import workflow_tasks'))api=api.replace('import sync_api','import sync_api\nimport workflow_tasks');if(!api.includes('workflow_tasks.initialize(c)'))api=api.replace('sync_api.initialize(c)','sync_api.initialize(c)\n        workflow_tasks.initialize(c)');if(!api.includes("if path=='/workflow-tasks':"))api=api.replace('u=self.user(c)',"u=self.user(c)\n            if path=='/workflow-tasks': return workflow_tasks.route(self,c,u,SimpleNamespace(**globals()))");fs.writeFileSync(backend,api);}

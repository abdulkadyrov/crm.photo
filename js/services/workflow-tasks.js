// Read-only workflow projection. No status, fulfilment history or deadline is inferred by writing records.
export const WORKFLOW_TASK_ACTIONS = Object.freeze({
  custom: 'Индивидуальное', capture: 'Доснять', generate: 'Сгенерировать', redo: 'Переделать', review: 'Проверить',
  print: 'Напечатать', deliver: 'Отдать', payment: 'Проверить оплату', sort_sources: 'Разобрать новые фотографии', contact_teacher:'Уточнить у учителя', send:'Отправить', reminder:'Напомнить'
});
export const TASK_ACTION_LABELS = WORKFLOW_TASK_ACTIONS;
const list = value => Array.isArray(value) ? value : [];
const str = value => value == null ? '' : String(value);
const time = value => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
export const workflowPlanRows = overrides => overrides instanceof Map ? [...overrides.values()] : Array.isArray(overrides) ? overrides : Object.values(overrides || {});
const idPart = value => encodeURIComponent(str(value));
function isOverdue(value, timestamp) {
  if (!time(value)) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(timestamp), today = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return value < today;
  }
  return time(value) < timestamp;
}
export const workflowTaskScopeKey = (studentId, serviceId) => `${str(studentId)}::${str(serviceId)}`;

// finalImageVersion describes the QR/print format in legacy records, not an image revision.
export function workflowWorkRevision(work) {
  if (!work) return 'source';
  const revision = work.workflowVersion || work.contentVersion || work.imageRevision || work.montageRevision;
  return [work.id, revision || work.resultMediaId || work.generatedAt || work.createdAt || 'legacy'].map(idPart).join('@');
}

function overrideFor(overrides, scopeKey, studentId, serviceId) {
  if (overrides instanceof Map) return overrides.get(scopeKey) || {};
  if (Array.isArray(overrides)) return overrides.find(row => row.scopeKey === scopeKey || (str(row.studentId) === str(studentId) && str(row.serviceId) === str(serviceId))) || {};
  return overrides?.[scopeKey] || {};
}
function serviceSelections(student) {
  const selected = list(student.selectedServices).filter(row => row?.serviceId || row?.id);
  const entries = selected.length ? selected : (list(student.catalogIds).length ? student.catalogIds : [student.catalogId]).filter(Boolean).map(serviceId => ({ serviceId }));
  const result = new Map();
  for (const row of entries) {
    const serviceId = str(row.serviceId || row.id);
    if (!result.has(serviceId)) result.set(serviceId, { ...row, serviceId, mediaIds: [...new Set(list(row.mediaIds))] });
    else result.get(serviceId).mediaIds.push(...list(row.mediaIds));
  }
  return [...result.values()];
}
function sourceMatches(media, serviceId, entry, orderItems) {
  if (list(entry.mediaIds).includes(media.id)) return true;
  if (str(media.serviceId) === serviceId || str(media.orderType) === serviceId || str(media.orderType).startsWith(`${serviceId}__`)) return true;
  return orderItems.some(row => (str(row.serviceId) === serviceId || str(row.type) === serviceId || str(row.type).startsWith(`${serviceId}__`)) && list(row.fileIds).includes(media.id));
}
function isSource(media) {
  return media && !media.deletedAt && !media.isResult && media.purpose !== 'result' && !['result', 'final', 'animation', 'video'].includes(media.type);
}
function received(media) { return !['pending', 'uploading', 'failed', 'incomplete'].includes(media.uploadStatus || media.transferStatus) && media.received !== false; }
function latest(rows) { return [...rows].sort((a,b) => time(b.generatedAt || b.createdAt) - time(a.generatedAt || a.createdAt) || str(b.id).localeCompare(str(a.id)))[0]; }
function sourceDate(source) { return source?.capturedAt || (source?.capturedBy ? source?.createdAt : '') || ''; }
export function workflowLatestScanEvent(work, sessions = []) {
  if (!work) return null;
  const revision=workflowWorkRevision(work);
  return list(sessions).flatMap(session=>list(session.events)).filter(event=>event.workId===work.id && Number(event.version||0)===Number(work.finalImageVersion||0) && (!event.workflowRevision||event.workflowRevision===revision) && (!work.workflowReview?.required||!event.at||time(event.at)>=time(work.generatedAt||work.createdAt))).sort((a,b)=>time(b.at)-time(a.at)).find(event=>event.accepted||event.status==='rejected') || null;
}
function isApproved(work, revision, override, scanEvent) {
  if (!work) return false;
  // Fulfilled legacy images remain fulfilled; never turn the whole archive into a review queue.
  if (['printed','delivered'].includes(work.status) && !work.workflowReview?.required) return true;
  if (override.approvedRevision === revision || work.workflowReview?.approvedRevision === revision) return true;
  if (work.workflowReview?.required) return false;
  if (work.reviewStatus === 'approved' || work.approval?.status === 'approved') return true;
  return !!scanEvent?.accepted;
}
function knownPrice(student, serviceId, entry, catalog) {
  const saved = student.parentPrices?.[serviceId]?.price;
  const raw = typeof saved === 'number' ? saved : entry.unitPrice ?? catalog?.price;
  if (raw === '' || raw == null) return null;
  const price = typeof raw === 'number' ? raw : Number(str(raw).replace(/\s+/g,'').replace(',','.'));
  return Number.isFinite(price) && price >= 0 ? price : null;
}
function operatorName(data, source) {
  const id = source?.capturedBy || source?.operatorId || source?.createdBy || '';
  const operator = [...list(data.operators), ...list(data.users)].find(row => row.id === id);
  return source?.operatorName || operator?.name || operator?.displayName || '';
}
function overrideDue(override, entry, student) { return override.dueAt || entry.promisedAt || entry.dueAt || student.promisedAt || ''; }

export function deriveWorkflowTasks(data = {}, { now = new Date(), role = 'admin', userId = '', overrides = {} } = {}) {
  const tasks = [], projects = new Map(list(data.projects).map(row => [row.id,row])), classes = new Map(list(data.classes).map(row => [row.id,row]));
  const catalog = new Map(list(data.catalog).map(row => [str(row.id),row]));
  const timestamp = now instanceof Date ? now.getTime() : time(now);
  const byStudent = rows => { const map=new Map();for (const row of rows) {const records=map.get(row.studentId)||[];records.push(row);map.set(row.studentId,records);}return map;};
  const workIndex=byStudent(list(data.finalWorks || data.works).filter(row=>!row.deletedAt&&!row.archived&&!row.supersededBy));
  const mediaIndex=byStudent(list(data.media).filter(isSource));
  const orderIndex=new Map(list(data.orders).map(row=>[row.studentId,row]));
  const scansByWork=new Map();for(const session of list(data.scanSessions || data.sessions))for(const event of list(session.events)){const events=scansByWork.get(event.workId)||[];events.push(event);scansByWork.set(event.workId,events);}
  for (const student of list(data.students)) {
    if (student.deletedAt) continue;
    const klass = classes.get(student.classId), project = projects.get(klass?.projectId || student.projectId);
    const childWorks = workIndex.get(student.id)||[];
    const childMedia = mediaIndex.get(student.id)||[];
    const order = orderIndex.get(student.id), orderItems = list(order?.items);
    const selections = serviceSelections(student);
    for (const item of orderItems) {
      const serviceId = str(item.serviceId || str(item.type).split('__')[0]);
      if (catalog.has(serviceId) && !selections.some(row=>row.serviceId === serviceId)) selections.push({serviceId,mediaIds:list(item.fileIds)});
    }
    // Existing results without a surviving catalog selection still need handout/correction handling.
    for (const work of childWorks) if (work.serviceId && !selections.some(row => row.serviceId === str(work.serviceId))) selections.push({serviceId:str(work.serviceId)});
    for (const entry of selections) {
      const serviceId = entry.serviceId, scopeKey = workflowTaskScopeKey(student.id,serviceId), override = overrideFor(overrides,scopeKey,student.id,serviceId);
      const service = catalog.get(serviceId), work = latest(childWorks.filter(row => str(row.serviceId) === serviceId)), revision = workflowWorkRevision(work);
      const scanEvent=workflowLatestScanEvent(work,[{events:scansByWork.get(work?.id)||[]}]);
      const matching = childMedia.filter(row => sourceMatches(row,serviceId,entry,orderItems));
      // Shared photo is a safe fallback only for one selected service, or the explicit final-work source.
      for (const sourceId of [work?.sourceMediaId,override.sourceMediaId].filter(Boolean)) if (!matching.some(row => row.id === sourceId)) matching.push(...childMedia.filter(row => row.id === sourceId));
      if (selections.length === 1) for (const row of childMedia.filter(row => !row.serviceId && !str(row.orderType).includes('__'))) if (!matching.some(item => item.id === row.id)) matching.push(row);
      const pendingReshoot = (override.requestedAction || override.action)==='capture' ? latest(matching.filter(row=>received(row)&&time(row.capturedAt||row.createdAt)>time(override.requestedAt)&&!['additional_reference','reference'].includes(row.capturePurpose||row.purpose))) : null;
      const source = pendingReshoot || matching.find(row => row.id === override.sourceMediaId) || latest(matching.filter(received));
      const dueAt = overrideDue(override,entry,student), assigneeId = override.assigneeId || entry.assigneeId || '';
      const common = { scopeKey, projectId: project?.id || klass?.projectId || student.projectId || '', classId: student.classId || '', studentId:student.id, serviceId,
        studentName:[student.lastName,student.firstName].filter(Boolean).join(' ') || student.name || 'Ребёнок', serviceName:service?.name || service?.title || work?.title || serviceId,
        projectName:project?.name || 'Проект', className:klass?.name || 'Группа', workId:work?.id || '', sourceId:source?.id || '', version:revision,
        capturedAt:sourceDate(source), receivedAt:source?.receivedAt || source?.importedAt || '', operatorId:source?.capturedBy || source?.operatorId || source?.createdBy || '', operatorName:operatorName(data,source),
        dueAt, assigneeId, snoozedUntil:override.snoozedUntil || '', overdue:isOverdue(dueAt,timestamp), reason:'', automatic:true };
      const add = (action,reason,extra={}) => {
        if (role === 'photographer' && (!['capture','sort_sources'].includes(action) || !userId || assigneeId !== userId && common.operatorId !== userId)) return;
        const task={...common,...extra,id:`${scopeKey}::${idPart(revision)}::${action}`,action,title:WORKFLOW_TASK_ACTIONS[action],reason};
        const specific = overrides instanceof Map ? overrides.get(task.id) : !Array.isArray(overrides) ? overrides?.[task.id] : null;
        if (specific) Object.assign(task,{dueAt:specific.dueAt ?? task.dueAt,assigneeId:specific.assigneeId ?? task.assigneeId,snoozedUntil:specific.snoozedUntil ?? task.snoozedUntil});
        tasks.push(task);
      };
      const requested = override.requestedAction || override.action;
      const beforeCount=tasks.length;
      const freshForRequest = source && time(override.requestedAt) && time(source.capturedAt || source.createdAt) > time(override.requestedAt) && source.id !== override.previousSourceId;
      if (requested === 'capture' && !freshForRequest) add('capture',override.reason || 'Назначена пересъёмка');
      else if (work?.correction?.status === 'open') add('redo',work.correction.comment || 'Открыто замечание к результату');
      else if (scanEvent?.status === 'rejected') add('redo',scanEvent.comment || 'Брак / не похож — отмечено при проверке QR');
      else if (!work) {
        if (!source || !received(source)) add('capture',matching.some(row=>!received(row)) ? 'Исходные файлы ещё передаются' : 'Нет исходной фотографии для услуги');
        else add('generate','Исходная фотография получена, результат ещё не сохранён');
      } else {
        const approved = isApproved(work,revision,override,scanEvent);
        const fulfilledVersion = work.workflowFulfillment?.version;
        const staleFulfillment = fulfilledVersion && fulfilledVersion !== revision;
        const reviewRequired = !approved && (work.workflowReview?.required || work.correction?.status === 'resolved');
        const sourcePurpose = source?.capturePurpose || source?.purpose || (source?.id === override.sourceMediaId ? override.sourcePurpose : '');
        const replacementSource = source && source.id !== work.sourceMediaId && ['reshoot','correction','new_service','new-service'].includes(sourcePurpose) && (source.id === override.sourceMediaId || time(source.receivedAt || source.createdAt || source.capturedAt) > time(work.generatedAt || work.createdAt));
        if (replacementSource || requested === 'capture' && freshForRequest && source.id !== work.sourceMediaId) add(sourcePurpose === 'correction' ? 'redo' : 'generate','Новый исходник получен: подготовьте новую версию результата');
        else if (!approved || reviewRequired) add('review',work.correction?.status === 'resolved' ? 'Исправленный результат ожидает проверки' : 'Результат ожидает проверки сходства');
        else if (staleFulfillment || !['printed','delivered'].includes(work.status)) add('print','Текущая версия готова к печати');
        else if (work.status !== 'delivered') add('deliver','Фотография напечатана и ожидает выдачи');
        const knownSourceIds = new Set([work.sourceMediaId,work.referenceMediaId,...list(override.reviewedSourceIds)].filter(Boolean));
        const unassigned = entry === selections[0] ? childMedia.filter(row => !row.serviceId && !row.orderType) : [];
        const additional = [...new Map([...matching,...unassigned].map(row=>[row.id,row])).values()].filter(row => !knownSourceIds.has(row.id) && received(row) && time(row.capturedAt || row.createdAt) > time(work.generatedAt || work.createdAt) && !row.capturePurpose && !row.purpose);
        if (additional.length) add('sort_sources','У готовой работы появились новые фотографии: укажите их назначение',{sourceId:latest(additional).id,sourceIds:additional.map(row=>row.id),capturedAt:sourceDate(latest(additional)),operatorName:operatorName(data,latest(additional))});
        const unitPrice = knownPrice(student,serviceId,entry,service);
        const paymentDue = override.paymentCheck === true || entry.paymentCheck === true || !!dueAt || !!student.nextVisitAt || !!project?.nextVisitAt;
        if (['admin','owner'].includes(role) && ['printed','delivered'].includes(work.status) && unitPrice > 0 && student.paymentStatus !== 'paid' && paymentDue) add('payment','Выполненная услуга: нужно проверить оплату',{unitPrice});
      }
      // An explicit assignment is one plan for this service. Real workflow events advance it;
      // selecting a task never rewrites shooting, approval, printing or delivery history.
      if (requested && requested!=='capture' && Object.hasOwn(WORKFLOW_TASK_ACTIONS,requested)) {
        const afterRequest=value=>!!time(override.requestedAt)&&time(value)>=time(override.requestedAt);
        const changedResult=!!work && override.requestedRevision!==revision && (!override.requestedAt || afterRequest(work.generatedAt||work.createdAt));
        const finished=afterRequest(override.completedAt) ||
          (['generate','redo'].includes(requested)&&changedResult) ||
          (requested==='review'&&override.approvedRevision===revision&&afterRequest(override.approvedAt)) ||
          (requested==='print'&&['printed','delivered'].includes(work?.status)&&afterRequest(work.printedAt)) ||
          (requested==='deliver'&&work?.status==='delivered'&&afterRequest(work.deliveredAt)) ||
          (requested==='payment'&&student.paymentStatus==='paid');
        if(!finished && (!work?.correction||work.correction.status!=='open'||requested==='redo') && (requested!=='payment'||['admin','owner'].includes(role))){
          tasks.splice(beforeCount);
          add(requested,override.reason || 'Назначено вручную из карточки',{automatic:false,requestedAt:override.requestedAt||'',manual:true});
        }
      }
    }
  }
  for(const plan of workflowPlanRows(overrides).filter(p=>['project','student'].includes(p.entityKind)&&!p.completedAt)){
    const project=projects.get(plan.projectId), student=plan.entityKind==='student'?list(data.students).find(s=>s.id===plan.studentId&&!s.deletedAt):null, klass=classes.get(student?.classId||plan.classId);
    if(plan.entityKind==='student'&&(!student||klass?.projectId!==project?.id))continue;
    if(!project||plan.classId&&klass?.projectId!==project.id||!Object.hasOwn(WORKFLOW_TASK_ACTIONS,plan.requestedAction))continue;
    if(role==='photographer'&&(plan.requestedAction!=='capture'||plan.assigneeId!==userId)||plan.requestedAction==='payment'&&!['admin','owner'].includes(role))continue;
    tasks.push({...plan,id:'manual::'+plan.scopeKey,action:plan.requestedAction,title:plan.title||WORKFLOW_TASK_ACTIONS[plan.requestedAction],studentName:student?[student.lastName,student.firstName].filter(Boolean).join(' '):plan.title||'Общая задача',serviceName:student?(plan.title||WORKFLOW_TASK_ACTIONS[plan.requestedAction]):WORKFLOW_TASK_ACTIONS[plan.requestedAction],projectName:project.name||'Проект',className:klass?.name||'Общие задачи проекта',classId:klass?.id||'project-notes:'+project.id,automatic:false,manual:true,overdue:isOverdue(plan.dueAt,timestamp),reason:plan.reason||'',version:'manual'});
  }
  const priority = {redo:0,capture:1,generate:2,review:3,print:4,deliver:5,payment:6,sort_sources:7,contact_teacher:8,send:9,reminder:10};
  return [...new Map(tasks.map(task=>[task.id,task])).values()].sort((a,b)=> (a.dueAt ? 0:1)-(b.dueAt ? 0:1) || (time(a.dueAt)||Infinity)-(time(b.dueAt)||Infinity) || priority[a.action]-priority[b.action] || a.projectName.localeCompare(b.projectName,'ru') || a.className.localeCompare(b.className,'ru') || a.studentName.localeCompare(b.studentName,'ru'));
}

// Every ordered child-service pair, including fulfilled ones, for assignment from CRM cards.
export function workflowServiceScopes(data={},scope={}) {
 const classes=new Map(list(data.classes).map(c=>[c.id,c])),catalog=new Map(list(data.catalog).map(c=>[c.id,c]));
 const active=deriveWorkflowTasks(data),byKey=new Map(active.map(t=>[t.scopeKey,t]));
 return list(data.students).filter(s=>!s.deletedAt&&(!scope.studentId||s.id===scope.studentId)&&(!scope.classId||s.classId===scope.classId)&&(!scope.projectId||classes.get(s.classId)?.projectId===scope.projectId)).flatMap(student=>{
  const klass=classes.get(student.classId),works=list(data.finalWorks).filter(w=>w.studentId===student.id&&!w.deletedAt&&!w.archived&&!w.supersededBy),entries=serviceSelections(student);
  for(const item of list(data.orders).find(o=>o.studentId===student.id)?.items||[]){const id=item.serviceId||str(item.type).split('__')[0];if(catalog.has(id)&&!entries.some(e=>e.serviceId===id))entries.push({serviceId:id});}
  for(const work of works)if(work.serviceId&&!entries.some(e=>e.serviceId===work.serviceId))entries.push({serviceId:work.serviceId});
  return entries.map(entry=>{const id=entry.serviceId,key=workflowTaskScopeKey(student.id,id),work=latest(works.filter(w=>w.serviceId===id));return {...byKey.get(key),scopeKey:key,studentId:student.id,serviceId:id,projectId:klass?.projectId||student.projectId||'',classId:student.classId,className:klass?.name||'',studentName:[student.lastName,student.firstName].filter(Boolean).join(' '),serviceName:catalog.get(id)?.name||work?.title||id,version:workflowWorkRevision(work),sourceId:byKey.get(key)?.sourceId||work?.sourceMediaId||''};});
 });
}

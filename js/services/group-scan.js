export function resolveScanTarget(raw, { students, works, parseWork, studentTokens, textMatches, viewerUrl }) {
  const value=String(raw || '').trim();
  if (!value) return {kind:'unknown'};
  const payload=parseWork(value);
  let matches=[];
  if (payload?.finalWorkId) matches=works.filter(work=>work.id===payload.finalWorkId);
  else if (payload?.format==='text') matches=works.filter(work=>textMatches(work,payload));
  else if (payload?.type==='final_work_print') matches=works.filter(work=>(!payload.studentId || work.studentId===payload.studentId) && (!payload.serviceId || work.serviceId===payload.serviceId) && (!payload.resultMediaId || work.resultMediaId===payload.resultMediaId));
  else matches=works.filter(work=>work.id===value || (viewerUrl?.(work) && viewerUrl(work)===value));
  if (matches.length>1) return {kind:'ambiguous',workIds:matches.map(work=>work.id)};
  if (matches.length===1) {
    const work=matches[0],student=students.find(student=>student.id===work.studentId);
    return student ? {kind:'work',studentId:student.id,workId:work.id} : {kind:'unknown'};
  }
  // An explicit work code must never fall back to a different work or child.
  if (payload) return {kind:'unknown'};
  const tokens=new Set([...studentTokens(value)].map(token=>String(token).toLowerCase()));
  const children=students.filter(student=>[student.id,student.qrId].some(id=>id&&tokens.has(String(id).toLowerCase())));
  return children.length===1 ? {kind:'student',studentId:children[0].id} : {kind:'unknown'};
}

export function assessGroupScan(target, groupId, session, {students,works}) {
  if (!['student','work'].includes(target.kind)) return {...target,status:target.kind};
  const student=students.find(row=>row.id===target.studentId),work=works.find(row=>row.id===target.workId);
  if (!student || (target.kind==='work'&&!work)) return {kind:'unknown',status:'unknown'};
  if (groupId!=='*' && student.classId!==groupId) return {...target,status:'foreign'};
  if(target.kind==='student'){const candidates=works.filter(row=>row.studentId===student.id);if(candidates.length===1)return assessGroupScan({kind:'work',studentId:student.id,workId:candidates[0].id},groupId,session,{students,works});if(candidates.length>1)return {...target,status:'choose',workId:undefined};}
  if (work && (work.studentId!==student.id || (work.groupId && work.groupId!==student.classId))) return {...target,status:'inconsistent'};
  const previous=session.events.filter(event=>event.accepted && event.studentId===target.studentId && (target.workId ? event.workId===target.workId : !event.workId));
  const version=work?.finalImageVersion || 0;
  if (work?.correction?.status==='open') return {...target,status:'correction',version};
  if (previous.some(event=>event.version===version)) return {...target,status:'duplicate',version};
  return {...target,status:'matched',version};
}

export function appendScanEvent(session, result, {accept=false,extraCopy=false,comment='',now=new Date().toISOString()}={}) {
  if (accept && !['matched','duplicate'].includes(result.status)) throw new Error('Этот результат нельзя включить в проверенные.');
  if (accept && result.status==='duplicate' && !extraCopy) throw new Error('Повторный экземпляр нужно подтвердить отдельно.');
  const event={id:`${session.id}:${session.events.length+1}`,studentId:result.studentId||'',workId:result.workId||'',version:result.version||0,status:result.status,accepted:accept,extraCopy,comment:String(comment).trim().slice(0,1000),at:now};
  return {...session,updatedAt:now,events:[...session.events,event]};
}

export function scanSessionSummary(session, students) {
  const accepted=session.events.filter(event=>event.accepted);
  const studentIds=[...new Set(accepted.map(event=>event.studentId))],workIds=[...new Set(accepted.map(event=>event.workId).filter(Boolean))];
  return {attempts:session.events.length,accepted:accepted.length,children:studentIds.length,works:workIds.length,copies:accepted.filter(event=>event.workId).length,duplicates:session.events.filter(event=>event.status==='duplicate').length,rejected:session.events.filter(event=>!event.accepted).length,studentIds,workIds,missing:students.filter(student=>!studentIds.includes(student.id))};
}

export function validatedScannedWorks(session, works, studentIds) {
  const ids=new Set(studentIds),accepted=session.events.filter(event=>event.accepted&&event.workId&&ids.has(event.studentId));
  const valid=new Set();
  for (const event of accepted) {
    const work=works.find(row=>row.id===event.workId);
    if (!work || work.studentId!==event.studentId || (work.finalImageVersion||0)!==event.version) throw new Error('После проверки фотография изменилась или удалена. Отсканируйте её заново в новой проверке.');
    valid.add(work.id);
  }
  return valid;
}

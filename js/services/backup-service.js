export function calculateDataCounts(data = {}) {
  return {
    projects: data.projects?.length || 0,
    classes: data.classes?.length || 0,
    students: data.students?.length || 0,
    orders: data.orders?.length || 0,
    media: data.media?.length || 0,
    documents: data.documents?.length || 0,
    finalWorks: data.finalWorks?.length || 0,
    albumProjects: data.albumProjects?.length || 0,
    albumStudents: data.albumStudents?.length || 0
  };
}

export function backupWarnings({ lastBackupAt, filesSinceBackup = 0, usage = 0, quota = 0, hasUnexportedProjects = false, updatePending = false, now = new Date() } = {}) {
  const warnings = [];
  const last = lastBackupAt ? new Date(lastBackupAt) : null;
  const daysSinceBackup = last ? (now.getTime() - last.getTime()) / 86400000 : Infinity;
  if (daysSinceBackup > 3) warnings.push("backup-stale");
  if (filesSinceBackup > 500) warnings.push("many-new-files");
  if (quota > 0 && usage / quota > 0.8) warnings.push("quota-high");
  if (hasUnexportedProjects) warnings.push("unexported-projects");
  if (updatePending) warnings.push("update-pending");
  return warnings;
}


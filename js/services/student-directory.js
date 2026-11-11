const normalized = value => String(value || '').toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();
export function searchStudentDirectory(students, classes, {projectId, classId, query}) {
  const tokens = normalized(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const scope = new Set(classes.filter(group => classId ? group.id === classId && group.projectId === projectId : group.projectId === projectId).map(group => group.id));
  return students.filter(student => scope.has(student.classId) && tokens.every(token => normalized(`${student.lastName || ''} ${student.firstName || ''} ${student.middleName || ''}`).includes(token)))
    .sort((a,b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'ru'));
}
export function resetDirectoryScroll(win = window) {
  win.scrollTo({top: 0, left: 0, behavior: 'instant'});
}

export const rosterName = student => [student.lastName, student.firstName].filter(Boolean).join(' ').trim();
const key = name => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru');
export function parseRoster(text) {
  const names = text.split(/\r?\n/).map(line => line.replace(/^\s*\d+[.)]\s*/, '').trim().replace(/\s+/g, ' ')).filter(Boolean);
  if (names.length > 1000) throw new Error('В списке может быть не больше 1000 детей.');
  const invalid = names.find(name => name.length > 200 || name.split(' ').length < 2);
  if (invalid) throw new Error(`Укажите фамилию и имя: ${invalid}`);
  return names;
}
// Match existing names first, including namesakes, so reordering never swaps identities.
export function planRoster(students, names, assignments = {}) {
  const available = [...students];
  const rows = names.map((name, index) => {
    const found = available.findIndex(student => key(rosterName(student)) === key(name));
    const student = found < 0 ? null : available.splice(found, 1)[0];
    return { index, name, student };
  });
  const unmatched = rows.filter(row => !row.student);
  for (const [index, row] of unmatched.entries()) {
    const chosen = Object.hasOwn(assignments, row.index) ? assignments[row.index] : available[index]?.id || '';
    row.student = available.find(student => student.id === chosen) || null;
    row.needsReview = true;
  }
  const ids = rows.filter(row => row.student).map(row => row.student.id);
  if (new Set(ids).size !== ids.length) throw new Error('Одна карточка выбрана для нескольких строк. Проверьте соответствия.');
  return { rows, candidates: available, removed: students.filter(student => !ids.includes(student.id)) };
}

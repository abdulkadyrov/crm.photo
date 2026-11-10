const surnameEndings = {
  boys: /(?:ов|ев|ёв|ин|ын|ский|цкий|ой)$/iu,
  girls: /(?:ова|ева|ёва|ина|ына|ская|цкая|ая)$/iu
};
const russian = new Intl.Collator("ru");

function studentGroup(student, serviceAudiences) {
  if (serviceAudiences.has("girls") && !serviceAudiences.has("boys")) return "girls";
  if (serviceAudiences.has("boys") && !serviceAudiences.has("girls")) return "boys";
  const surname = student.lastName?.trim() || "";
  return Object.keys(surnameEndings).find(group => surnameEndings[group].test(surname)) || "unknown";
}

export function shootingRoster(students, audiencesForStudent) {
  const groups = { boys: new Map(), girls: new Map(), unknown: new Map() };
  const ordered = [...students].sort((a, b) =>
    russian.compare(a.lastName, b.lastName) || russian.compare(a.firstName, b.firstName)
  );
  for (const student of ordered) {
    const group = groups[studentGroup(student, new Set(audiencesForStudent(student)))];
    const initial = (student.lastName?.trim() || student.firstName?.trim() || "").normalize("NFC")[0];
    const letter = initial && /\p{L}/u.test(initial) ? initial.toLocaleUpperCase("ru") : "#";
    if (!group.has(letter)) group.set(letter, []);
    group.get(letter).push(student);
  }
  return Object.entries(groups)
    .filter(([, letters]) => letters.size)
    .map(([group, letters]) => ({ group, letters: [...letters].sort(([a], [b]) => russian.compare(a, b)) }));
}

export function classServiceCounts(students, classId, serviceIdsForStudent) {
  const counts = new Map();
  if (!classId) return counts;
  for (const student of students) {
    if (student.classId !== classId) continue;
    for (const id of new Set(serviceIdsForStudent(student))) counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

export function splitPopularServices(services, counts, limit = 6) {
  const popular = services
    .filter(item => counts.has(item.id))
    .sort((a, b) => counts.get(b.id) - counts.get(a.id))
    .slice(0, limit);
  const ids = new Set(popular.map(item => item.id));
  return { popular, others: services.filter(item => !ids.has(item.id)) };
}

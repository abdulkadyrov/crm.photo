// Keep spelling from the source. OCR is a draft, never an authority on a child's name.
const nameKey = name => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru');
const word = '[А-ЯЁ][а-яё]+(?:[-‑–][А-ЯЁа-яё][а-яё]+)*';
const pair = new RegExp(`^(${word})\\s+(${word})(?=\\s|$|[.,;|])`, 'u');
const heading = /^(?:фио|фамилия|имя|дата|учитель|директор|математика|учебный|на начало|итог|четверть)(?=\s|:|$)/iu;
export function extractPhotoNames(text, source = '') {
  const rows = [];
  let pending = null, pendingNumber = null;
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim().replace(/[|¦_]/g, ' ').replace(/^[\s\[\]`'‘’“”«».,:;—–-]+/u, '').replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (/^\d{1,3}[.)]?$/.test(line)) { pendingNumber = Number(line.replace(/[.)]/g, '')); pending = null; continue; }
    const numbered = line.match(/^(\d{1,3})\s*[.)]?\s+(?=[А-ЯЁа-яё])/u);
    const number = numbered ? Number(numbered[1]) : pendingNumber;
    pendingNumber = null;
    if (numbered) line = line.slice(numbered[0].length);
    if (heading.test(line)) { pending = null; continue; }
    // A surname and name can wrap onto two lines within the same table cell.
    if (pending && !numbered && new RegExp(`^${word}$`, 'u').test(line)) {
      line = `${pending.line} ${line}`;
    } else pending = null;
    const match = line.match(pair);
    if (match) {
      rows.push({ name: `${match[1]} ${match[2]}`.replace(/[‑–]/g, '-'), number: number ?? pending?.number ?? null, source });
      pending = null;
    } else if (new RegExp(`^${word}$`, 'u').test(line) && !heading.test(line)) {
      pending = { line, number };
    } else pending = null;
  }
  return rows;
}
export function mergePhotoNames(pages) {
  const rows = [], warnings = [];
  let overlaps = 0;
  for (const page of pages) {
    if (!page.rows.length) warnings.push(`${page.source}: имена не найдены. Проверьте фото или внесите их вручную.`);
    for (const row of page.rows) {
      const sameNumber = row.number !== null && rows.find(old => old.source !== row.source && old.number === row.number);
      if (sameNumber && nameKey(sameNumber.name) === nameKey(row.name)) { overlaps++; continue; }
      if (sameNumber) warnings.push(`Строка ${row.number}: разные имена на фотографиях. Проверьте, что это один класс.`);
      if (rows.some(old => nameKey(old.name) === nameKey(row.name))) warnings.push(`Повтор имени «${row.name}»: проверьте, повторная ли это строка или тёзки.`);
      rows.push(row);
    }
  }
  const numbers = rows.map(row => row.number).filter(n => n !== null && n > 0);
  if (numbers.length) {
    const missing = Array.from({length: Math.max(...numbers)}, (_, i) => i + 1).filter(n => !numbers.includes(n));
    if (missing.length) warnings.push(`Не найдены номера: ${missing.join(', ')}. Возможно, часть списка обрезана.`);
  }
  if (rows.length && numbers.length === rows.length && new Set(numbers).size === rows.length) rows.sort((a, b) => a.number - b.number);
  if (numbers.length < rows.length) warnings.push('Не у всех строк прочитаны номера. Проверьте повторы, порядок и полноту списка.');
  return {rows, overlaps, warnings: [...new Set(warnings)]};
}
// Append only the excess occurrences; existing cards, including namesakes, stay intact.
export function appendPhotoNames(existing, incoming) {
  const available = new Map();
  existing.forEach(name => available.set(nameKey(name), (available.get(nameKey(name)) || 0) + 1));
  const added = incoming.filter(name => {
    const key = nameKey(name), count = available.get(key) || 0;
    if (count) { available.set(key, count - 1); return false; }
    return true;
  });
  return [...existing, ...added];
}

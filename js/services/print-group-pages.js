// Keep a group's copies together; separators are real, ink-free PDF pages.
export function groupedPrintPages(pages, groupOf, separators = true) {
  const groups = new Map();
  for (const page of pages) {
    const id = groupOf(page.work);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(page);
  }
  return [...groups].flatMap(([groupId, photos]) => separators
    ? [{blank:true,groupId}, ...photos, {blank:true,groupId}] : photos);
}

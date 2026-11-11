// Stop at the end; never wrap into another group or project.
export function nextInSequence(items, currentId) {
 const index = items.findIndex(item => item.id === currentId);
 return index < 0 ? null : items[index + 1] || null;
}

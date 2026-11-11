// Stop at the end; never wrap into another group or project.
export function nextInSequence(items, currentId, direction = 1) {
 const index = items.findIndex(item => item.id === currentId);
 return index < 0 ? null : items[index + (direction < 0 ? -1 : 1)] || null;
}

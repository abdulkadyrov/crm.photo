export function servicePositions(ids, entries = []) {
 return [...new Set(ids)].flatMap(serviceId => {
  const matching = entries.filter(item => item.serviceId === serviceId);
  return (matching.length ? matching : [{serviceId}]).map(item => ({...item, serviceId, entryId: item.entryId || serviceId, quantity: Math.max(1,parseInt(item.quantity,10)||1), comment: String(item.comment || ''), mediaIds: [...new Set(item.mediaIds || [])]}));
 });
}
export function duplicatePosition(position, entryId) {
 return {...position, entryId, quantity: 1, comment: '', mediaIds: []};
}

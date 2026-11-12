// Recognize both CRM requests and Vakha transfers, including text-only orders.
export function isIndividualOrderItem(item) {
  return item?.requestType === 'custom' || Boolean(item?.referenceServiceName || item?.referenceMediaId || item?.parentVideoMediaId) || /индивидуальн.*заказ/iu.test(item?.title || item?.label || item?.name || '');
}
export function retainedIndividualItems(items = []) {
  return items.filter(isIndividualOrderItem).map(item => ({ ...item, fileIds: Array.isArray(item.fileIds) ? item.fileIds : [], requestType: isIndividualOrderItem(item) ? 'custom' : item.requestType }));
}

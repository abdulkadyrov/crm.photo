export const TRANSFER_MERGE_RESOLUTION = "merge";

const SAFE_REPEAT_IMPORT_MODES = new Set(["project", "class"]);

export function isSafeRepeatImportMode(mode) {
  return SAFE_REPEAT_IMPORT_MODES.has(String(mode || "").toLowerCase());
}

export function defaultTransferResolution({ mode = "auto", existing = null } = {}) {
  if (!existing) return "update";
  return isSafeRepeatImportMode(mode) ? TRANSFER_MERGE_RESOLUTION : "update";
}

export function defaultBulkTransferResolution(mode = "auto") {
  return isSafeRepeatImportMode(mode) ? TRANSFER_MERGE_RESOLUTION : "update";
}

export function mergeTransferRecord(dataKey, existing, incoming) {
  if (!existing) return incoming;
  if (dataKey === "orders") return mergeOrderRecord(existing, incoming);
  return existing;
}

export function mergeOrderRecord(existing = {}, incoming = {}) {
  const existingItems = Array.isArray(existing.items) ? existing.items : [];
  const incomingItems = Array.isArray(incoming.items) ? incoming.items : [];
  const mergedItems = existingItems.map((item) => ({ ...item, fileIds: normalizeFileIds(item.fileIds) }));

  incomingItems.forEach((incomingItem) => {
    const index = findMatchingOrderItemIndex(mergedItems, incomingItem);
    if (index < 0) {
      mergedItems.push({ ...incomingItem, fileIds: normalizeFileIds(incomingItem.fileIds) });
      return;
    }
    mergedItems[index] = mergeOrderItem(mergedItems[index], incomingItem);
  });

  return {
    ...incoming,
    ...existing,
    items: mergedItems,
    status: existing.status || incoming.status || ""
  };
}

export function mergeOrderItem(existing = {}, incoming = {}) {
  const existingDone = existing.status === "done";
  const incomingDone = incoming.status === "done";
  const next = {
    ...incoming,
    ...existing,
    fileIds: Array.from(new Set([
      ...normalizeFileIds(existing.fileIds),
      ...normalizeFileIds(incoming.fileIds)
    ]))
  };

  if (existingDone) return next;
  if (incomingDone) {
    next.status = "done";
    next.updatedBy = incoming.updatedBy || existing.updatedBy;
    next.completedBy = incoming.completedBy || existing.completedBy;
    next.completedAt = incoming.completedAt || existing.completedAt;
  }
  return next;
}

export function detectTransferProjectIdentity(incomingProjects = [], existingProjects = []) {
  const incoming = incomingProjects.find((project) => project?.id) || null;
  if (!incoming) return { kind: "none", incoming: null, existing: null };

  const byId = existingProjects.find((project) => project?.id === incoming.id) || null;
  if (byId) return { kind: "existing", incoming, existing: byId };

  const incomingName = normalizeProjectName(incoming.name || incoming.schoolName);
  const byName = incomingName
    ? existingProjects.find((project) => normalizeProjectName(project?.name || project?.schoolName) === incomingName) || null
    : null;
  if (byName) return { kind: "same-name-different-id", incoming, existing: byName };
  return { kind: "new", incoming, existing: null };
}

export function normalizeProjectName(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/\s+/g, " ");
}

function normalizeFileIds(fileIds) {
  return Array.isArray(fileIds) ? fileIds.filter(Boolean) : [];
}

function findMatchingOrderItemIndex(items, incoming) {
  const identifiers = [incoming?.id, incoming?.taskId, incoming?.type].filter(Boolean);
  return items.findIndex((item) => identifiers.some((identifier) => (
    item?.id === identifier || item?.taskId === identifier || item?.type === identifier
  )));
}

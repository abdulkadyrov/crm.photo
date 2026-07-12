export const CONFLICT_RESOLUTIONS = {
  update: "update",
  keep: "keep",
  copy: "copy",
  skipIdentical: "skip-identical",
  rename: "rename",
  replace: "replace"
};

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function stripRuntimeFields(record = {}) {
  const next = { ...record };
  delete next.blob;
  delete next.file;
  delete next.image;
  delete next.mergedPrintImage;
  delete next.objectUrl;
  return next;
}

export function sameEntity(existing, incoming) {
  return stableJson(stripRuntimeFields(existing)) === stableJson(stripRuntimeFields(incoming));
}

export function classifyEntityConflict({ store, existing, incoming, label = "" }) {
  if (!existing) {
    return { store, id: incoming?.id || "", label, status: "new", defaultResolution: CONFLICT_RESOLUTIONS.update };
  }
  if (sameEntity(existing, incoming)) {
    return { store, id: incoming?.id || existing.id || "", label, status: "identical", defaultResolution: CONFLICT_RESOLUTIONS.keep };
  }
  return { store, id: incoming?.id || existing.id || "", label, status: "conflict", defaultResolution: CONFLICT_RESOLUTIONS.update };
}

export function resolveEntityConflict({ existing, incoming, resolution = CONFLICT_RESOLUTIONS.update, copyIdFactory } = {}) {
  if (resolution === CONFLICT_RESOLUTIONS.keep) return { action: "keep", record: existing };
  if (resolution === CONFLICT_RESOLUTIONS.copy) {
    const id = copyIdFactory ? copyIdFactory(incoming) : `${incoming.id}_copy`;
    return { action: "copy", record: { ...incoming, id } };
  }
  return { action: existing ? "update" : "add", record: incoming };
}

export function classifyFileConflict({ existing, incoming }) {
  if (!existing) return { status: "new", defaultResolution: CONFLICT_RESOLUTIONS.replace };
  if (existing.sha256 && incoming.sha256 && existing.sha256 === incoming.sha256) {
    return { status: "identical", defaultResolution: CONFLICT_RESOLUTIONS.skipIdentical };
  }
  if (existing.path === incoming.path) {
    return { status: "name-conflict", defaultResolution: CONFLICT_RESOLUTIONS.rename };
  }
  return { status: "different", defaultResolution: CONFLICT_RESOLUTIONS.replace };
}

export function renameConflictingPath(path, exists) {
  const normalized = String(path || "");
  const dot = normalized.lastIndexOf(".");
  const slash = Math.max(normalized.lastIndexOf("/"), normalized.lastIndexOf("\\"));
  const hasExtension = dot > slash;
  const base = hasExtension ? normalized.slice(0, dot) : normalized;
  const ext = hasExtension ? normalized.slice(dot) : "";
  let index = 2;
  let candidate = `${base}_${index}${ext}`;
  while (exists(candidate)) {
    index += 1;
    candidate = `${base}_${index}${ext}`;
  }
  return candidate;
}


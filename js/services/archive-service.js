import { assertSafeRelativePath, sanitizePathSegment } from "./file-system-service.js";

export const TRANSFER_FORMAT = "vakha-studio-transfer";
export const TRANSFER_SCHEMA_VERSION = 2;

export function createTransferManifest({
  appVersion = "0.1.0",
  createdAt = new Date().toISOString(),
  deviceId = "",
  operatorId = "",
  projectId = "",
  counts = {}
} = {}) {
  return {
    format: TRANSFER_FORMAT,
    schemaVersion: TRANSFER_SCHEMA_VERSION,
    appVersion,
    createdAt,
    deviceId,
    operatorId,
    projectId,
    counts: normalizeCounts(counts)
  };
}

export function normalizeCounts(counts = {}) {
  return {
    classes: Number(counts.classes || 0),
    students: Number(counts.students || 0),
    media: Number(counts.media || 0),
    documents: Number(counts.documents || 0)
  };
}

export function createPortableArchiveName(projectName, date = new Date()) {
  const day = typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);
  return `${sanitizePathSegment(projectName, "project")}_${day}.vakhastudio.zip`;
}

export function validateTransferManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") errors.push("Manifest is missing.");
  if (manifest?.format !== TRANSFER_FORMAT) errors.push("Unsupported transfer format.");
  if (Number(manifest?.schemaVersion || 0) > TRANSFER_SCHEMA_VERSION) errors.push("Transfer schema is newer than this app.");
  if (!manifest?.createdAt) errors.push("Manifest createdAt is missing.");
  return { ok: errors.length === 0, errors };
}

export function validateArchivePaths(paths = []) {
  const errors = [];
  for (const path of paths) {
    try {
      assertSafeRelativePath(path);
    } catch (error) {
      errors.push(error.message);
    }
  }
  return { ok: errors.length === 0, errors };
}


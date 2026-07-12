import { validateArchivePaths, validateTransferManifest } from "./archive-service.js";
import { verifyChecksumEntry } from "./integrity-service.js";

export async function createImportPreflightReport({ manifest, paths = [], checksumEntries = [], filesByPath = new Map() } = {}) {
  const checks = [];
  const manifestCheck = validateTransferManifest(manifest);
  checks.push({ name: "manifest", ok: manifestCheck.ok, errors: manifestCheck.errors });

  const pathCheck = validateArchivePaths(paths);
  checks.push({ name: "paths", ok: pathCheck.ok, errors: pathCheck.errors });

  const checksumCheck = await verifyChecksumEntries(checksumEntries, filesByPath);
  checks.push(checksumCheck);

  return {
    ok: checks.every((check) => check.ok),
    checks,
    counts: manifest?.counts || {},
    errors: checks.flatMap((check) => check.errors.map((error) => `${check.name}: ${error}`))
  };
}

export async function verifyChecksumEntries(entries = [], filesByPath = new Map()) {
  const errors = [];
  for (const entry of entries) {
    const data = filesByPath.get(entry.path);
    if (!data) {
      errors.push(`Missing file: ${entry.path}`);
      continue;
    }
    const ok = await verifyChecksumEntry(entry, data).catch((error) => {
      errors.push(error.message);
      return false;
    });
    if (!ok && !errors.some((message) => message.includes(entry.path))) {
      errors.push(`Checksum mismatch: ${entry.path}`);
    }
  }
  return { name: "checksums", ok: errors.length === 0, errors };
}

export function compareManifestCounts(manifestCounts = {}, actualCounts = {}) {
  const errors = [];
  Object.entries(manifestCounts || {}).forEach(([key, expected]) => {
    const actual = Number(actualCounts[key] || 0);
    if (actual !== Number(expected || 0)) errors.push(`${key}: expected ${expected}, got ${actual}`);
  });
  return { name: "counts", ok: errors.length === 0, errors };
}


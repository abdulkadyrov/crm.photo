export const STORAGE_MODES = {
  internal: "internal",
  zipDownload: "zip-download",
  directory: "directory",
  transferPackage: "transfer-package"
};

export const DIRECTORY_ACCESS_STATUS = {
  granted: "granted",
  prompt: "prompt",
  denied: "denied",
  unavailable: "unavailable",
  unsupported: "unsupported"
};

const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const FORBIDDEN_SEGMENT_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;
const UNSAFE_PATH_RE = /(^|[\\/])\.\.([\\/]|$)|^[\\/]|^[a-zA-Z]:[\\/]/;

export function supportsDirectoryPicker(win = globalThis) {
  return typeof win.showDirectoryPicker === "function";
}

export function sanitizePathSegment(value, fallback = "Без названия") {
  const cleaned = String(value ?? "")
    .normalize("NFC")
    .replace(FORBIDDEN_SEGMENT_CHARS, " ")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim();
  const safe = cleaned || fallback;
  return WINDOWS_RESERVED_NAMES.test(safe) ? `${safe}_` : safe;
}

export function assertSafeRelativePath(path) {
  const value = String(path || "").replace(/\\/g, "/");
  if (!value || UNSAFE_PATH_RE.test(value) || value.split("/").some((part) => part === ".." || part === "")) {
    throw new Error(`Unsafe archive path: ${path}`);
  }
  return value;
}

export function safeJoinPath(parts) {
  return parts.map((part) => sanitizePathSegment(part)).filter(Boolean).join("/");
}

export function buildStoragePath(template, values = {}) {
  const rendered = String(template || "{school}/{project}/{class}/{student_number}_{student_name}")
    .replace(/\{([a-z_]+)\}/g, (_, key) => sanitizePathSegment(values[key] || ""));
  return assertSafeRelativePath(
    rendered
      .split(/[\\/]+/)
      .map((part) => sanitizePathSegment(part))
      .filter(Boolean)
      .join("/")
  );
}

export async function getStorageEstimate(nav = globalThis.navigator) {
  if (!nav?.storage?.estimate) return { usage: 0, quota: 0, persisted: false, supported: false };
  const estimate = await nav.storage.estimate();
  const persisted = nav.storage.persisted ? await nav.storage.persisted() : false;
  return {
    usage: estimate.usage || 0,
    quota: estimate.quota || 0,
    persisted,
    supported: true
  };
}

export async function requestPersistentStorage(nav = globalThis.navigator) {
  if (!nav?.storage?.persist) return false;
  return nav.storage.persist();
}

export async function queryDirectoryPermission(directoryHandle, mode = "readwrite") {
  if (!directoryHandle?.queryPermission) return DIRECTORY_ACCESS_STATUS.unavailable;
  const result = await directoryHandle.queryPermission({ mode });
  return result === "granted" ? DIRECTORY_ACCESS_STATUS.granted : result === "prompt" ? DIRECTORY_ACCESS_STATUS.prompt : DIRECTORY_ACCESS_STATUS.denied;
}

export async function ensureDirectoryPermission(directoryHandle, mode = "readwrite") {
  const current = await queryDirectoryPermission(directoryHandle, mode);
  if (current === DIRECTORY_ACCESS_STATUS.granted) return current;
  if (current !== DIRECTORY_ACCESS_STATUS.prompt || !directoryHandle?.requestPermission) return current;
  const requested = await directoryHandle.requestPermission({ mode });
  return requested === "granted" ? DIRECTORY_ACCESS_STATUS.granted : DIRECTORY_ACCESS_STATUS.denied;
}

export async function testDirectoryWrite(directoryHandle) {
  const status = await ensureDirectoryPermission(directoryHandle, "readwrite");
  if (status !== DIRECTORY_ACCESS_STATUS.granted) return { ok: false, status };

  const fileName = ".vakha-write-test";
  const expected = `vakha-write-test:${Date.now()}`;
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(expected);
  await writable.close();
  const file = await fileHandle.getFile();
  const actual = await file.text();
  await directoryHandle.removeEntry(fileName);
  return { ok: actual === expected, status: actual === expected ? DIRECTORY_ACCESS_STATUS.granted : DIRECTORY_ACCESS_STATUS.unavailable };
}


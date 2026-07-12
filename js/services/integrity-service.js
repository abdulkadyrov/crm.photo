import { assertSafeRelativePath } from "./file-system-service.js";

export async function sha256Hex(input) {
  const bytes = await inputToUint8Array(input);
  const subtle = await getSubtleCrypto();
  const digest = await subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createChecksumEntry({ path, data, mimeType = "", entity = null, createdAt = new Date().toISOString() }) {
  assertSafeRelativePath(path);
  const bytes = await inputToUint8Array(data);
  return {
    path,
    size: bytes.byteLength,
    mimeType,
    sha256: await sha256Hex(bytes),
    entity,
    createdAt
  };
}

export async function verifyChecksumEntry(entry, data) {
  assertSafeRelativePath(entry.path);
  const bytes = await inputToUint8Array(data);
  if (Number(entry.size) !== bytes.byteLength) return false;
  return entry.sha256 === await sha256Hex(bytes);
}

async function inputToUint8Array(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (typeof Blob !== "undefined" && input instanceof Blob) return new Uint8Array(await input.arrayBuffer());
  if (typeof input === "string") return new TextEncoder().encode(input);
  throw new TypeError("Unsupported checksum input type.");
}

async function getSubtleCrypto() {
  if (globalThis.crypto?.subtle) return globalThis.crypto.subtle;
  const nodeCrypto = await import("node:crypto");
  return nodeCrypto.webcrypto.subtle;
}


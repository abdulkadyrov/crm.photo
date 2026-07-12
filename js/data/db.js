import { DB_NAME, DB_VERSION, STORE_NAMES } from "../core/constants.js";

export const MIGRATION_STORE = "migrationJournal";

export function openVakhaDb({ name = DB_NAME, version = DB_VERSION, stores = STORE_NAMES, upgrade } = {}) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      ensureObjectStores(db, stores);
      upgrade?.(db, event.oldVersion, event.newVersion, event);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked by another open tab."));
  });
}

export function ensureObjectStores(db, stores = STORE_NAMES) {
  stores.forEach((name) => {
    if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
  });
}

export function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted."));
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
  });
}

export function store(db, storeName, mode = "readonly") {
  return db.transaction(storeName, mode).objectStore(storeName);
}

export function getAllRecords(db, storeName) {
  return requestToPromise(store(db, storeName).getAll());
}

export function getRecord(db, storeName, id) {
  return requestToPromise(store(db, storeName).get(id));
}

export function countRecords(db, storeName) {
  return requestToPromise(store(db, storeName).count());
}

export async function putRecord(db, storeName, value) {
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).put(value);
  await transactionDone(tx);
  return value;
}

export async function deleteRecord(db, storeName, id) {
  const tx = db.transaction(storeName, "readwrite");
  tx.objectStore(storeName).delete(id);
  await transactionDone(tx);
}

export async function bulkPutRecords(db, storeName, records = []) {
  const tx = db.transaction(storeName, "readwrite");
  const target = tx.objectStore(storeName);
  records.forEach((record) => target.put(record));
  await transactionDone(tx);
  return records.length;
}

export async function bulkDeleteRecords(db, storeName, ids = []) {
  const tx = db.transaction(storeName, "readwrite");
  const target = tx.objectStore(storeName);
  ids.forEach((id) => target.delete(id));
  await transactionDone(tx);
  return ids.length;
}


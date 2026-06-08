import { DB_NAME, DB_VERSION } from "./constants.js";

export function openDB({ name = DB_NAME, version = DB_VERSION, upgrade } = {}) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = (event) => upgrade?.(request.result, event.oldVersion, event.newVersion);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function transaction(db, stores, mode = "readonly") {
  return db.transaction(stores, mode);
}

export function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getRecord(db, storeName, key) {
  return requestToPromise(transaction(db, storeName).objectStore(storeName).get(key));
}

export function getAllRecords(db, storeName) {
  return requestToPromise(transaction(db, storeName).objectStore(storeName).getAll());
}

export function putRecord(db, storeName, value) {
  return requestToPromise(transaction(db, storeName, "readwrite").objectStore(storeName).put(value));
}

export function deleteRecord(db, storeName, key) {
  return requestToPromise(transaction(db, storeName, "readwrite").objectStore(storeName).delete(key));
}

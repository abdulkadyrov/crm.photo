import test from "node:test";
import assert from "node:assert/strict";

import { createRepository } from "../../js/data/repositories/base-repository.js";

function createMemoryDb() {
  const stores = new Map();
  return {
    transaction(storeName) {
      if (!stores.has(storeName)) stores.set(storeName, new Map());
      const store = stores.get(storeName);
      const tx = {};
      queueMicrotask(() => tx.oncomplete?.());
      return {
        objectStore() {
          return {
            get(id) {
              return request(store.get(id));
            },
            getAll() {
              return request([...store.values()]);
            },
            count() {
              return request(store.size);
            },
            put(record) {
              store.set(record.id, record);
              return request(record);
            },
            delete(id) {
              store.delete(id);
              return request(undefined);
            }
          };
        },
        get oncomplete() {
          return tx.oncomplete;
        },
        set oncomplete(value) {
          tx.oncomplete = value;
        },
        get onabort() {
          return tx.onabort;
        },
        set onabort(value) {
          tx.onabort = value;
        },
        get onerror() {
          return tx.onerror;
        },
        set onerror(value) {
          tx.onerror = value;
        }
      };
    }
  };
}

function request(result) {
  const req = { result, error: null };
  queueMicrotask(() => req.onsuccess?.());
  return req;
}

test("repository supports bulkPut, all, count and delete through the IndexedDB adapter contract", async () => {
  const db = createMemoryDb();
  const repo = createRepository("students");

  await repo.bulkPut(db, [{ id: "s1", name: "One" }, { id: "s2", name: "Two" }]);
  assert.equal(await repo.count(db), 2);
  assert.deepEqual(await repo.get(db, "s2"), { id: "s2", name: "Two" });
  assert.equal((await repo.all(db)).length, 2);
  await repo.delete(db, "s1");
  assert.equal(await repo.count(db), 1);
});


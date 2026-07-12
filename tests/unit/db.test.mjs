import test from "node:test";
import assert from "node:assert/strict";

import { ensureObjectStores } from "../../js/data/db.js";

test("ensureObjectStores creates only missing stores", () => {
  const existing = new Set(["projects"]);
  const created = [];
  const db = {
    objectStoreNames: {
      contains(name) {
        return existing.has(name);
      }
    },
    createObjectStore(name, options) {
      existing.add(name);
      created.push({ name, options });
    }
  };

  ensureObjectStores(db, ["projects", "students", "media"]);

  assert.deepEqual(created, [
    { name: "students", options: { keyPath: "id" } },
    { name: "media", options: { keyPath: "id" } }
  ]);
});


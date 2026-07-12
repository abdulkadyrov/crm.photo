import test from "node:test";
import assert from "node:assert/strict";

import { createObjectUrlRegistry } from "../../js/services/object-url-service.js";

test("object url registry creates and revokes individual URLs", () => {
  const revoked = [];
  let index = 0;
  const registry = createObjectUrlRegistry({
    createObjectURL() {
      index += 1;
      return `blob:test-${index}`;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    }
  });

  const url = registry.create({});
  assert.equal(url, "blob:test-1");
  assert.equal(registry.has(url), true);
  assert.equal(registry.revoke(url), true);
  assert.deepEqual(revoked, ["blob:test-1"]);
  assert.equal(registry.revoke(url), false);
});

test("object url registry revokes all tracked URLs", () => {
  const revoked = [];
  let index = 0;
  const registry = createObjectUrlRegistry({
    createObjectURL() {
      index += 1;
      return `blob:all-${index}`;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    }
  });

  registry.create({});
  registry.create({});
  assert.equal(registry.size(), 2);
  assert.equal(registry.revokeAll(), 2);
  assert.equal(registry.size(), 0);
  assert.deepEqual(revoked, ["blob:all-1", "blob:all-2"]);
});


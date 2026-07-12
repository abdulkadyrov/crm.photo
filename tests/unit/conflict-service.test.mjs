import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyEntityConflict,
  classifyFileConflict,
  renameConflictingPath,
  resolveEntityConflict,
  sameEntity
} from "../../js/services/conflict-service.js";

test("sameEntity ignores runtime blobs and object urls", () => {
  assert.equal(sameEntity({ id: "s1", name: "A", blob: {} }, { id: "s1", name: "A", objectUrl: "blob:1" }), true);
});

test("classifyEntityConflict separates new, identical and changed records", () => {
  assert.equal(classifyEntityConflict({ store: "students", incoming: { id: "s1" } }).status, "new");
  assert.equal(classifyEntityConflict({ store: "students", existing: { id: "s1" }, incoming: { id: "s1" } }).status, "identical");
  assert.equal(classifyEntityConflict({ store: "students", existing: { id: "s1", name: "Old" }, incoming: { id: "s1", name: "New" } }).status, "conflict");
});

test("resolveEntityConflict supports keep, update and copy", () => {
  assert.deepEqual(resolveEntityConflict({ existing: { id: "s1", name: "Old" }, incoming: { id: "s1", name: "New" }, resolution: "keep" }), {
    action: "keep",
    record: { id: "s1", name: "Old" }
  });
  assert.deepEqual(resolveEntityConflict({ existing: { id: "s1" }, incoming: { id: "s1", name: "New" }, resolution: "copy", copyIdFactory: () => "s2" }), {
    action: "copy",
    record: { id: "s2", name: "New" }
  });
});

test("file conflicts prefer SHA-256 over file name", () => {
  assert.equal(classifyFileConflict({ existing: { path: "a.jpg", sha256: "same" }, incoming: { path: "a-copy.jpg", sha256: "same" } }).status, "identical");
  assert.equal(classifyFileConflict({ existing: { path: "a.jpg", sha256: "old" }, incoming: { path: "a.jpg", sha256: "new" } }).status, "name-conflict");
});

test("renameConflictingPath keeps extension and increments until free", () => {
  const taken = new Set(["media/a_2.jpg", "media/a_3.jpg"]);
  assert.equal(renameConflictingPath("media/a.jpg", (path) => taken.has(path)), "media/a_4.jpg");
});


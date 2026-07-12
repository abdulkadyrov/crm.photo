import test from "node:test";
import assert from "node:assert/strict";

import { createChecksumEntry, sha256Hex, verifyChecksumEntry } from "../../js/services/integrity-service.js";

test("sha256Hex calculates stable SHA-256", async () => {
  assert.equal(await sha256Hex("vakha"), "d81c0702cbd20c2f74b2f737b3e20c5da2179df6a06686dd8c83b335e87d93ee");
});

test("checksum entry stores safe relative path, size and digest", async () => {
  const entry = await createChecksumEntry({
    path: "media/photo.txt",
    data: "hello",
    mimeType: "text/plain",
    entity: { type: "media", id: "m1" },
    createdAt: "2026-07-12T12:00:00Z"
  });

  assert.equal(entry.size, 5);
  assert.equal(entry.mimeType, "text/plain");
  assert.equal(await verifyChecksumEntry(entry, "hello"), true);
  assert.equal(await verifyChecksumEntry(entry, "HELLO"), false);
});

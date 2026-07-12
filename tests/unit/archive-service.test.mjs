import test from "node:test";
import assert from "node:assert/strict";

import {
  TRANSFER_FORMAT,
  createPortableArchiveName,
  createTransferManifest,
  validateArchivePaths,
  validateTransferManifest
} from "../../js/services/archive-service.js";

test("createTransferManifest creates schema v2 transfer manifest", () => {
  const manifest = createTransferManifest({
    appVersion: "2026.7",
    createdAt: "2026-07-12T12:00:00Z",
    deviceId: "device-id",
    operatorId: "operator-id",
    projectId: "project-id",
    counts: { classes: 1, students: 25, media: 450, documents: 4 }
  });

  assert.equal(manifest.format, TRANSFER_FORMAT);
  assert.equal(manifest.schemaVersion, 2);
  assert.deepEqual(manifest.counts, { classes: 1, students: 25, media: 450, documents: 4 });
  assert.equal(validateTransferManifest(manifest).ok, true);
});

test("createPortableArchiveName keeps the legacy-friendly vakhastudio suffix", () => {
  assert.equal(createPortableArchiveName("Гимназия №12: 4А", "2026-07-12T12:00:00Z"), "Гимназия №12 4А_2026-07-12.vakhastudio.zip");
});

test("validateArchivePaths rejects unsafe imported archive paths", () => {
  assert.equal(validateArchivePaths(["media/a.jpg", "documents/b.pdf"]).ok, true);
  assert.equal(validateArchivePaths(["../secret.txt"]).ok, false);
});


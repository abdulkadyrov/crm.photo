import test from "node:test";
import assert from "node:assert/strict";

import { createTransferManifest } from "../../js/services/archive-service.js";
import { createChecksumEntry } from "../../js/services/integrity-service.js";
import {
  compareManifestCounts,
  createImportPreflightReport,
  verifyChecksumEntries
} from "../../js/services/import-preflight-service.js";

test("verifyChecksumEntries reports missing files and mismatches", async () => {
  const entry = await createChecksumEntry({ path: "media/a.txt", data: "hello" });
  assert.equal((await verifyChecksumEntries([entry], new Map([["media/a.txt", "hello"]]))).ok, true);
  assert.equal((await verifyChecksumEntries([entry], new Map())).ok, false);
  assert.equal((await verifyChecksumEntries([entry], new Map([["media/a.txt", "HELLO"]]))).ok, false);
});

test("createImportPreflightReport validates manifest, paths and checksums together", async () => {
  const manifest = createTransferManifest({ counts: { classes: 1, students: 2, media: 1, documents: 0 } });
  const checksum = await createChecksumEntry({ path: "media/a.txt", data: "hello" });
  const report = await createImportPreflightReport({
    manifest,
    paths: ["manifest.json", "media/a.txt"],
    checksumEntries: [checksum],
    filesByPath: new Map([["media/a.txt", "hello"]])
  });

  assert.equal(report.ok, true);
  assert.deepEqual(report.counts, { classes: 1, students: 2, media: 1, documents: 0 });
});

test("createImportPreflightReport rejects unsafe archive paths before import", async () => {
  const report = await createImportPreflightReport({
    manifest: createTransferManifest(),
    paths: ["../secret.txt"],
    checksumEntries: [],
    filesByPath: new Map()
  });

  assert.equal(report.ok, false);
  assert.ok(report.errors.some((error) => error.includes("Unsafe archive path")));
});

test("compareManifestCounts catches entity count drift", () => {
  assert.equal(compareManifestCounts({ students: 25 }, { students: 25 }).ok, true);
  assert.deepEqual(compareManifestCounts({ students: 25 }, { students: 24 }).errors, ["students: expected 25, got 24"]);
});


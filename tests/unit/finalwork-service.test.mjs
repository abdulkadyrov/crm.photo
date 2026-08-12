import assert from "node:assert/strict";
import test from "node:test";
import {
  createFinalWork,
  hydrateImportedFinalWorkImage,
  prepareTransferRecordForStorage
} from "../../js/services/finalwork-service.js";

test("hydrateImportedFinalWorkImage makes the imported result authoritative", () => {
  const imageBlob = new Blob(["result"], { type: "image/jpeg" });
  const hydrated = hydrateImportedFinalWorkImage({ id: "final-demo" }, imageBlob);

  assert.equal(hydrated.image, imageBlob);
  assert.equal(hydrated.originalFinalImage, imageBlob);
  assert.equal(hydrated.mergedPrintImage, imageBlob);
  assert.equal(hydrated.a4PrintImage, null);
  assert.equal(hydrated.a4PrintPdf, null);
  assert.equal(hydrated.a4PreparedAt, "");
  assert.equal(hydrated.finalImageVersion, 2);
});

test("hydrateImportedFinalWorkImage replaces stale restored image derivatives", () => {
  const imported = new Blob(["imported"], { type: "image/jpeg" });
  const original = new Blob(["original"], { type: "image/jpeg" });
  const merged = new Blob(["merged"], { type: "image/jpeg" });
  const hydrated = hydrateImportedFinalWorkImage({
    id: "final-demo",
    originalFinalImage: original,
    mergedPrintImage: merged,
    finalImageVersion: 3
  }, imported);

  assert.equal(hydrated.image, imported);
  assert.equal(hydrated.originalFinalImage, imported);
  assert.equal(hydrated.mergedPrintImage, imported);
  assert.equal(hydrated.a4PrintImage, null);
  assert.equal(hydrated.a4PrintPdf, null);
  assert.equal(hydrated.finalImageVersion, 3);
});

test("createFinalWork keeps the existing service contract", () => {
  const work = createFinalWork({
    id: "final-demo",
    projectId: "project-demo",
    groupId: "class-demo",
    studentId: "student-demo",
    serviceId: "service-demo"
  });

  assert.equal(work.id, "final-demo");
  assert.equal(work.studentId, "student-demo");
  assert.equal(work.status, "ready");
  assert.match(work.printQrPayload, /^VSF1:/);
});

test("prepareTransferRecordForStorage keeps hydrated final-work blobs", () => {
  const imported = new Blob(["neural result"], { type: "image/jpeg" });
  const prepared = prepareTransferRecordForStorage("finalWorks", {
    id: "final-demo",
    finalWorkId: "final-demo",
    image: imported,
    originalFinalImage: imported,
    mergedPrintImage: imported
  });

  assert.equal(prepared.finalWorkId, undefined);
  assert.equal(prepared.image, imported);
  assert.equal(prepared.originalFinalImage, imported);
  assert.equal(prepared.mergedPrintImage, imported);
});

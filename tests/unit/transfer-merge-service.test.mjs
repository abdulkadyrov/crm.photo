import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultBulkTransferResolution,
  defaultTransferResolution,
  detectTransferProjectIdentity,
  mergeClassRecord,
  mergeOrderRecord,
  mergeStudentRecord,
  mergeTransferRecord
} from "../../js/services/transfer-merge-service.js";

test("safe class merge imports only the parent catalog link",()=>{const existing={id:"c1",name:"4А",teacher:{name:"Раяна"}};const incoming={id:"c1",name:"changed",parentCatalogUrl:"https://example.test/p/token",parentCatalogToken:"token"};assert.deepEqual(mergeClassRecord(existing,incoming),{...existing,parentCatalogUrl:incoming.parentCatalogUrl,parentCatalogToken:"token"});});

test("repeat import updates service quantity and comment without duplicating the student", () => {
  const existing = {
    id: "student-1",
    firstName: "Адам",
    paymentStatus: "paid",
    catalogIds: ["service-photo"],
    selectedServices: [{ serviceId: "service-photo", quantity: 1, comment: "старый комментарий" }]
  };
  const incoming = {
    id: "student-1",
    firstName: "Адам",
    paymentStatus: "unpaid",
    catalogIds: ["service-photo", "service-mma"],
    selectedServices: [
      { serviceId: "service-photo", quantity: 2, comment: "две фотографии" },
      { serviceId: "service-mma", quantity: 3, comment: "UFC, перчатки" }
    ]
  };

  const merged = mergeStudentRecord(existing, incoming);

  assert.equal(merged.id, "student-1");
  assert.equal(merged.paymentStatus, "paid");
  assert.deepEqual(merged.catalogIds, ["service-photo", "service-mma"]);
  assert.deepEqual(merged.selectedServices, incoming.selectedServices);
});

test("project and class re-imports default to safe merge", () => {
  const existing = { id: "project-bachiyurt" };
  assert.equal(defaultTransferResolution({ mode: "project", existing }), "merge");
  assert.equal(defaultTransferResolution({ mode: "class", existing }), "merge");
  assert.equal(defaultBulkTransferResolution("project"), "merge");
  assert.equal(defaultTransferResolution({ mode: "full_backup", existing }), "update");
  assert.equal(defaultTransferResolution({ mode: "project", existing: null }), "update");
});

test("safe order merge appends reshoot files without rolling local progress back", () => {
  const merged = mergeOrderRecord({
    id: "order-student-2",
    studentId: "student-2",
    status: "printed",
    items: [
      { type: "portrait", status: "pending", fileIds: [], updatedBy: "owner" },
      { type: "full", status: "done", fileIds: ["media-old"], completedBy: "owner", completedAt: "2026-08-10" }
    ]
  }, {
    id: "order-student-2",
    studentId: "student-2",
    status: "",
    items: [
      { type: "portrait", status: "done", fileIds: ["media-reshoot"], completedBy: "rassul", completedAt: "2026-08-12" },
      { type: "full", status: "pending", fileIds: [] },
      { type: "video", status: "done", fileIds: ["video-reshoot"], completedBy: "rassul" }
    ]
  });

  assert.equal(merged.status, "printed");
  assert.deepEqual(merged.items.find((item) => item.type === "portrait").fileIds, ["media-reshoot"]);
  assert.equal(merged.items.find((item) => item.type === "portrait").completedBy, "rassul");
  assert.equal(merged.items.find((item) => item.type === "full").status, "done");
  assert.equal(merged.items.find((item) => item.type === "full").completedBy, "owner");
  assert.deepEqual(merged.items.find((item) => item.type === "video").fileIds, ["video-reshoot"]);
});

test("safe merge keeps the main-computer montage and existing source records", () => {
  const mainImage = new Blob(["main montage"], { type: "image/jpeg" });
  const photographerImage = new Blob(["old copy"], { type: "image/jpeg" });
  const existing = { id: "final-1", status: "printed", montageRevision: 7, image: mainImage };
  const incoming = { id: "final-1", status: "ready", montageRevision: 1, image: photographerImage };

  assert.equal(mergeTransferRecord("finalWorks", existing, incoming), existing);
  assert.equal(mergeTransferRecord("media", { id: "media-1", blob: mainImage }, { id: "media-1", blob: photographerImage }).blob, mainImage);
});

test("project identity distinguishes a restored archive from a recreated project", () => {
  const existing = [{ id: "project-original", name: "Бача-Юрт, школа № 1" }];
  assert.equal(detectTransferProjectIdentity([{ id: "project-original", name: "Бача-Юрт" }], existing).kind, "existing");
  assert.equal(detectTransferProjectIdentity([{ id: "project-new", name: "  БАЧА-ЮРТ,   школа № 1 " }], existing).kind, "same-name-different-id");
  assert.equal(detectTransferProjectIdentity([{ id: "project-other", name: "Майртуп" }], existing).kind, "new");
});

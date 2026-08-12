import assert from "node:assert/strict";
import test from "node:test";

import { calculatePhotographerWorkOverview } from "../../js/services/photographer-analytics-service.js";
import { mergeTransferRecord } from "../../js/services/transfer-merge-service.js";

const transferKeys = ["projects", "classes", "students", "orders", "media", "finalWorks"];

function applySafeProjectImport(current, incoming) {
  const next = Object.fromEntries(transferKeys.map((key) => [key, [...(current[key] || [])]]));
  transferKeys.forEach((key) => {
    (incoming[key] || []).forEach((record) => {
      const index = next[key].findIndex((item) => item.id === record.id);
      if (index < 0) next[key].push(record);
      else next[key][index] = mergeTransferRecord(key, next[key][index], record);
    });
  });
  return next;
}

test("reshoot roundtrip is additive, idempotent and preserves the owner's montage", () => {
  const montage = new Blob(["owner montage revision 12"], { type: "image/jpeg" });
  const initialMainState = {
    projects: [{ id: "project-bachiyurt", name: "Бача-Юрт — монтаж начат", createdBy: "rassul" }],
    classes: [{ id: "class-1a", projectId: "project-bachiyurt", name: "1А", createdBy: "rassul" }],
    students: [
      { id: "student-present", classId: "class-1a", firstName: "Адам", createdBy: "rassul" },
      { id: "student-absent", classId: "class-1a", firstName: "Аминат", createdBy: "rassul", paymentStatus: "paid" }
    ],
    orders: [
      { id: "order-present", studentId: "student-present", items: [{ type: "portrait", status: "done", fileIds: ["media-present"], completedBy: "rassul" }] },
      { id: "order-absent", studentId: "student-absent", status: "printed", items: [{ type: "portrait", status: "pending", fileIds: [] }] }
    ],
    media: [{ id: "media-present", studentId: "student-present", capturedBy: "rassul", blob: new Blob(["source 1"]) }],
    finalWorks: [{ id: "final-present", studentId: "student-present", status: "printed", montageRevision: 12, image: montage }]
  };
  const restoredPhoneExport = {
    projects: [{ id: "project-bachiyurt", name: "Бача-Юрт", createdBy: "rassul" }],
    classes: [{ id: "class-1a", projectId: "project-bachiyurt", name: "1А", createdBy: "rassul" }],
    students: initialMainState.students.map((student) => ({ ...student, paymentStatus: "unpaid" })),
    orders: [
      initialMainState.orders[0],
      { id: "order-absent", studentId: "student-absent", status: "", items: [{ type: "portrait", status: "done", fileIds: ["media-reshoot"], completedBy: "rassul", completedAt: "2026-08-12T10:00:00Z" }] }
    ],
    media: [
      initialMainState.media[0],
      { id: "media-reshoot", studentId: "student-absent", capturedBy: "rassul", createdAt: "2026-08-12T10:00:00Z", blob: new Blob(["source 2"]) }
    ],
    finalWorks: [{ id: "final-present", studentId: "student-present", status: "ready", montageRevision: 1, image: new Blob(["stale result"]) }]
  };

  const firstImport = applySafeProjectImport(initialMainState, restoredPhoneExport);
  const secondImport = applySafeProjectImport(firstImport, restoredPhoneExport);

  assert.equal(firstImport.projects.length, 1);
  assert.equal(firstImport.classes.length, 1);
  assert.equal(firstImport.students.length, 2);
  assert.equal(firstImport.media.length, 2);
  assert.equal(firstImport.finalWorks.length, 1);
  assert.equal(firstImport.projects[0].name, "Бача-Юрт — монтаж начат");
  assert.equal(firstImport.students.find((student) => student.id === "student-absent").paymentStatus, "paid");
  assert.equal(firstImport.orders.find((order) => order.id === "order-absent").status, "printed");
  assert.deepEqual(firstImport.orders.find((order) => order.id === "order-absent").items[0].fileIds, ["media-reshoot"]);
  assert.equal(firstImport.finalWorks[0].image, montage);
  assert.equal(firstImport.finalWorks[0].montageRevision, 12);
  assert.deepEqual(secondImport, firstImport);

  const overview = calculatePhotographerWorkOverview(firstImport, "rassul");
  assert.equal(overview.media, 2);
  assert.equal(overview.photographedStudents, 2);
  assert.equal(overview.completedClasses, 1);
});

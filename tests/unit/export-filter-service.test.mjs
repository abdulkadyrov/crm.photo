import test from "node:test";
import assert from "node:assert/strict";

import { buildExportSelection } from "../../js/services/export-filter-service.js";

const data = {
  projects: [{ id: "p1" }, { id: "p2" }],
  classes: [{ id: "c1", projectId: "p1" }, { id: "c2", projectId: "p2" }],
  students: [
    { id: "s1", classId: "c1", catalogIds: ["svc1"] },
    { id: "s2", classId: "c2", catalogIds: ["svc2"] }
  ],
  orders: [{ id: "o1", studentId: "s1" }, { id: "o2", studentId: "s2" }],
  media: [
    { id: "m1", studentId: "s1", type: "photo" },
    { id: "m2", studentId: "s1", type: "video" },
    { id: "m3", studentId: "s2", type: "photo" }
  ],
  finalWorks: [{ id: "f1", studentId: "s1" }, { id: "f2", studentId: "s2" }],
  documents: [{ id: "d1", projectId: "p1" }, { id: "d2", studentId: "s2" }],
  catalog: [{ id: "svc1" }, { id: "svc2" }],
  settings: [{ id: "settings" }],
  templates: [{ id: "template" }],
  operators: [{ id: "op1" }],
  operatorEvents: [{ id: "ev1" }]
};

test("buildExportSelection selects a whole project with related classes and students", () => {
  const selected = buildExportSelection(data, { projectId: "p1" });
  assert.deepEqual(selected.projects.map((item) => item.id), ["p1"]);
  assert.deepEqual(selected.classes.map((item) => item.id), ["c1"]);
  assert.deepEqual(selected.students.map((item) => item.id), ["s1"]);
  assert.deepEqual(selected.orders.map((item) => item.id), ["o1"]);
  assert.deepEqual(selected.documents.map((item) => item.id), ["d1"]);
});

test("buildExportSelection can export selected students and skip videos", () => {
  const selected = buildExportSelection(data, { studentIds: ["s1"], includeVideo: false });
  assert.deepEqual(selected.media.map((item) => item.id), ["m1"]);
  assert.deepEqual(selected.finalWorks.map((item) => item.id), ["f1"]);
  assert.deepEqual(selected.catalog.map((item) => item.id), ["svc1"]);
});

test("buildExportSelection respects optional content switches", () => {
  const selected = buildExportSelection(data, {
    classId: "c1",
    includeDocuments: false,
    includeFinalWorks: false,
    includeCatalog: false,
    includeSettings: false,
    includeOperators: false
  });
  assert.equal(selected.documents.length, 0);
  assert.equal(selected.finalWorks.length, 0);
  assert.equal(selected.catalog.length, 0);
  assert.equal(selected.settings.length, 0);
  assert.equal(selected.operators.length, 0);
});


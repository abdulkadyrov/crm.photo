import test from "node:test";
import assert from "node:assert/strict";

import { backupWarnings, calculateDataCounts } from "../../js/services/backup-service.js";

test("calculateDataCounts reports stable entity counts", () => {
  assert.deepEqual(calculateDataCounts({
    projects: [{ id: "p1" }],
    classes: [{ id: "c1" }, { id: "c2" }],
    students: [],
    media: [{ id: "m1" }],
    documents: [{ id: "d1" }],
    finalWorks: [{ id: "f1" }],
    albumProjects: [{ id: "a1" }],
    albumStudents: [{ id: "as1" }]
  }), {
    projects: 1,
    classes: 2,
    students: 0,
    orders: 0,
    media: 1,
    documents: 1,
    finalWorks: 1,
    albumProjects: 1,
    albumStudents: 1
  });
});

test("backupWarnings covers stale backup, file growth, quota, unexported projects and updates", () => {
  const warnings = backupWarnings({
    lastBackupAt: "2026-07-08T00:00:00Z",
    filesSinceBackup: 501,
    usage: 81,
    quota: 100,
    hasUnexportedProjects: true,
    updatePending: true,
    now: new Date("2026-07-12T00:00:00Z")
  });
  assert.deepEqual(warnings, ["backup-stale", "many-new-files", "quota-high", "unexported-projects", "update-pending"]);
});


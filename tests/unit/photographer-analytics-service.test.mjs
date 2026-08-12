import assert from "node:assert/strict";
import test from "node:test";

import { calculatePhotographerWorkOverview } from "../../js/services/photographer-analytics-service.js";

test("photographer coverage includes a later reshoot in the original class", () => {
  const data = {
    projects: [{ id: "project-bachiyurt", name: "Бача-Юрт", createdBy: "rassul" }],
    classes: [{ id: "class-1a", projectId: "project-bachiyurt", name: "1А", createdBy: "rassul" }],
    students: [
      { id: "student-1", classId: "class-1a", createdBy: "rassul" },
      { id: "student-2", classId: "class-1a", createdBy: "rassul" }
    ],
    media: [
      { id: "media-first", studentId: "student-1", capturedBy: "rassul" },
      { id: "media-reshoot", studentId: "student-2", capturedBy: "rassul" }
    ],
    orders: [
      { id: "order-1", studentId: "student-1", items: [{ type: "portrait", status: "done", completedBy: "rassul" }] },
      { id: "order-2", studentId: "student-2", items: [{ type: "portrait", status: "done", completedBy: "rassul" }] }
    ]
  };

  const overview = calculatePhotographerWorkOverview(data, "rassul");
  assert.equal(overview.projects, 1);
  assert.equal(overview.classes, 1);
  assert.equal(overview.completedClasses, 1);
  assert.equal(overview.students, 2);
  assert.equal(overview.photographedStudents, 2);
  assert.equal(overview.remainingStudents, 0);
  assert.equal(overview.media, 2);
  assert.equal(overview.doneTasks, 2);
});

test("photographer coverage does not claim another operator's photos", () => {
  const overview = calculatePhotographerWorkOverview({
    projects: [{ id: "p1", name: "Школа" }],
    classes: [{ id: "c1", projectId: "p1", name: "1А" }],
    students: [{ id: "s1", classId: "c1" }],
    media: [{ id: "m1", studentId: "s1", capturedBy: "other" }],
    orders: []
  }, "rassul");

  assert.equal(overview.projects, 0);
  assert.equal(overview.classes, 0);
  assert.equal(overview.media, 0);
});

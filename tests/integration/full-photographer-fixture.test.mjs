import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureRoot = path.join(root, "test-fixtures/full-photographer-demo");
const report = JSON.parse(readFileSync(path.join(fixtureRoot, "report.json"), "utf8"));

test("full photographer fixture covers two schools and four complete classes", () => {
  assert.equal(report.syntheticPeopleOnly, true);
  assert.equal(report.processingMode, "gpt-image-identity-preserve");
  assert.deepEqual(report.counts, {
    projects: 2,
    classes: 4,
    students: 40,
    sourceMedia: 40,
    finalWorks: 40,
    paid: 30,
    unpaid: 10
  });

  const byClass = Map.groupBy(report.students, (student) => student.classId);
  assert.equal(byClass.size, 4);
  for (const students of byClass.values()) {
    assert.equal(students.length, 10);
    assert.equal(new Set(students.map((student) => student.serviceId)).size, 10);
  }
});

test("every photographer fixture student has a source and a distinct final image", () => {
  assert.equal(new Set(report.students.map((student) => student.name)).size, 40);
  for (const student of report.students) {
    assert.equal(student.processingMode, "gpt-image-identity-preserve");
    assert.ok(existsSync(path.join(fixtureRoot, student.source)), student.source);
    assert.ok(existsSync(path.join(fixtureRoot, student.result)), student.result);
    assert.ok(existsSync(path.join(fixtureRoot, student.neuralSource)), student.neuralSource);
    assert.notEqual(student.sourceSha256, student.resultSha256);
  }
  assert.ok(existsSync(path.join(fixtureRoot, report.archive)));
  assert.ok(existsSync(path.join(fixtureRoot, report.overview)));
  assert.ok(existsSync(path.join(fixtureRoot, "report.html")));
});

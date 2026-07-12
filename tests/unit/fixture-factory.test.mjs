import test from "node:test";
import assert from "node:assert/strict";

import { FIXTURE_PROFILES, createFixture, fixtureCounts } from "../../test-fixtures/fixture-factory.mjs";

test("small fixture has the required acceptance shape", () => {
  const fixture = createFixture("small");
  assert.deepEqual(fixtureCounts(fixture), FIXTURE_PROFILES.small);
  assert.equal(fixture.projects.length, 1);
  assert.equal(fixture.classes[0].projectId, fixture.projects[0].id);
  assert.equal(fixture.students.length, 5);
  assert.equal(fixture.catalog.length, 3);
  assert.ok(fixture.documents.length >= 1);
  assert.ok(fixture.finalWorks.length >= 1);
});

test("medium fixture profile is deterministic and linked", () => {
  const first = createFixture("medium");
  const second = createFixture("medium");
  assert.deepEqual(fixtureCounts(first), FIXTURE_PROFILES.medium);
  assert.deepEqual(first.projects, second.projects);
  assert.ok(first.students.every((student) => first.classes.some((klass) => klass.id === student.classId)));
});

test("large fixture profile keeps metadata large without binary media", () => {
  const fixture = createFixture("large");
  assert.deepEqual(fixtureCounts(fixture), FIXTURE_PROFILES.large);
  assert.equal(fixture.media.length, 20000);
  assert.ok(fixture.media.every((item) => !("blob" in item)));
});


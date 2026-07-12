import test from "node:test";
import assert from "node:assert/strict";

import { createMigrationJournalEntry, migrationId, runMigrations } from "../../js/data/migrations.js";

test("migrationId uses stable zero-padded numbering", () => {
  assert.equal(migrationId(2, "settings"), "migration-002-settings");
});

test("createMigrationJournalEntry captures migration status and details", () => {
  const entry = createMigrationJournalEntry({ id: "migration-001-test", description: "Test" }, "applied", { ok: true });
  assert.equal(entry.id, "migration-001-test");
  assert.equal(entry.status, "applied");
  assert.deepEqual(entry.details, { ok: true });
  assert.match(entry.appliedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("runMigrations skips already applied migrations and writes journal", async () => {
  const written = [];
  const applied = await runMigrations({
    db: { name: "db", version: 1 },
    appliedIds: new Set(["migration-001-a"]),
    list: [
      { id: "migration-001-a", run: () => ({ a: true }) },
      { id: "migration-002-b", description: "B", run: () => ({ b: true }) }
    ],
    writeJournal: (entry) => written.push(entry)
  });

  assert.equal(applied.length, 1);
  assert.equal(applied[0].id, "migration-002-b");
  assert.equal(written.length, 1);
});


export const MIGRATION_PREFIX = "migration-";

export const migrations = [
  {
    id: "migration-001-baseline",
    description: "Baseline journal entry for the pre-stabilization IndexedDB schema.",
    run(db) {
      return { dbName: db.name, version: db.version };
    }
  }
];

export function migrationId(number, name) {
  return `${MIGRATION_PREFIX}${String(number).padStart(3, "0")}-${name}`;
}

export function createMigrationJournalEntry(migration, status = "applied", details = {}) {
  return {
    id: migration.id,
    status,
    description: migration.description || "",
    appliedAt: new Date().toISOString(),
    details
  };
}

export async function runMigrations({ db, appliedIds = new Set(), list = migrations, writeJournal } = {}) {
  const journal = [];
  for (const migration of list) {
    if (appliedIds.has(migration.id)) continue;
    const details = await migration.run(db);
    const entry = createMigrationJournalEntry(migration, "applied", details);
    if (writeJournal) await writeJournal(entry);
    journal.push(entry);
  }
  return journal;
}


import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../../js/core/legacy-app.js", import.meta.url), "utf8");

test("transfer settings expose all-project and selectable section exports", () => {
  assert.match(source, /data-export-all-projects[^>]*>Экспорт всех проектов</);
  assert.match(source, /data-export-section value="projects" checked/);
  assert.match(source, /data-export-section value="services"/);
  assert.match(source, /data-export-section value="operators"/);
  assert.match(source, /data-export-selected-data[^>]*>Экспорт выбранного</);
});

test("transfer settings remove the old reshoot instruction and show export progress", () => {
  assert.doesNotMatch(source, /При досъёмке открывайте тот же проект/);
  assert.match(source, /runTransferExport\(event\.currentTarget, "Собираем полную копию…", exportFullBackup\)/);
  assert.match(source, /Не удалось создать ZIP/);
});

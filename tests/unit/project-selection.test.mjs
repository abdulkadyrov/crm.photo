import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../../js/core/legacy-app.js", import.meta.url), "utf8");
const body = source.slice(source.indexOf("function renderClasses()"), source.indexOf("\nfunction classStudentSection("));

function render(projects, projectId) {
  const state = { data: { projects, students: [] }, projectId, classId: null, studentFormClassId: null };
  const view = { innerHTML: "" };
  const renderClasses = vm.runInNewContext(`(${body})`, {
    state, view,
    APP_NAME: "Vakha Studio",
    projectById: id => projects.find(project => project.id === id),
    classesByProject: () => [],
    classSortMode: () => "manual",
    financialStatsForStudents: () => ({}),
    setShell() {},
    bindViewActions() {},
    addContextBackButton() {},
    plainWorkDashboard: () => "",
    documentsSection: () => "",
    empty: text => text,
    escapeHtml: text => text,
    escapeAttr: text => text,
    CLASS_SORT_MODES: { manual: "Ручной порядок", numeric: "По цифрам", alpha: "По алфавиту" }
  });
  renderClasses();
  return { state, html: view.innerHTML };
}

test("a removed active project falls back to an existing project, never an empty select", () => {
  const result = render([{ id: "existing", name: "Гимназия №12" }], "removed");
  assert.equal(result.state.projectId, "existing");
  assert.match(result.html, /value="existing" selected/);
  assert.match(result.html, /data-class-sort-mode="numeric"/);
});

test("no projects shows a create action instead of invalid group controls", () => {
  const result = render([], "removed");
  assert.equal(result.state.projectId, "");
  assert.match(result.html, /Создать проект/);
  assert.doesNotMatch(result.html, /data-project-select|data-add-class|data-class-sort/);
});

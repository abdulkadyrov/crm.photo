import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../../js/core/legacy-app.js", import.meta.url), "utf8");

function loadFunction(name, nextName, dependencies) {
  const start = source.indexOf(`async function ${name}(`);
  const end = source.indexOf(`\nasync function ${nextName}(`, start);
  assert(start >= 0 && end > start);
  return vm.runInNewContext(`(${source.slice(start, end)})`, dependencies);
}

function submitFixture(overrides = {}) {
  const calls = [];
  const state = { classId: "class-4b", studentFormClassId: "class-4b" };
  const buttons = [{ disabled: false }, { disabled: false }];
  const form = {
    dataset: { studentForm: "class-4b" },
    querySelectorAll: () => buttons,
    setAttribute() {},
    removeAttribute() {}
  };
  const dependencies = {
    state,
    FormData: class {
      get(key) { return { fio: "Иванов Иван", paymentStatus: "unpaid", orderStatus: "auto" }[key]; }
      getAll() { return []; }
    },
    addStudent: async () => { calls.push("persist"); return { id: "new-student" }; },
    refreshData: async () => { calls.push("refresh"); },
    notify: () => {},
    navigate: (route, params) => { calls.push("navigate"); state.returnClass = state.classId; state.opened = { route, ...params }; },
    renderClasses: () => calls.push("render"),
    requestAnimationFrame: () => {},
    console: { error() {} },
    ...overrides
  };
  return {
    calls, state, form, buttons,
    handler: loadFunction("handleStudentFormSubmit", "addStudent", dependencies),
    event: (mode = "open") => ({ preventDefault() {}, currentTarget: form, submitter: { value: mode } })
  };
}

test("save and open refreshes records before navigation and preserves the originating class", async () => {
  const f = submitFixture();
  await f.handler(f.event());
  assert.deepEqual(f.calls, ["persist", "refresh", "navigate"]);
  assert.equal(f.state.opened.studentId, "new-student");
  assert.equal(f.state.returnClass, "class-4b");
  assert.equal(f.state.studentFormClassId, null);
});

test("save and next refreshes the class and keeps the next-student form open", async () => {
  const f = submitFixture();
  await f.handler(f.event("next"));
  assert.deepEqual(f.calls, ["persist", "refresh", "render"]);
  assert.equal(f.state.studentFormClassId, "class-4b");
});

test("repeated submit while saving creates only one student", async () => {
  let release;
  let writes = 0;
  const f = submitFixture({ addStudent: async () => {
    writes += 1;
    await new Promise(resolve => { release = resolve; });
    return { id: "new-student" };
  } });
  const pending = f.handler(f.event());
  assert(f.buttons.every(button => button.disabled));
  await f.handler(f.event());
  assert.equal(writes, 1);
  release();
  await pending;
  assert(f.buttons.every(button => !button.disabled));
});

test("failed save keeps the draft and re-enables submission without navigating", async () => {
  const f = submitFixture({ addStudent: async () => { throw new Error("Storage unavailable"); } });
  await f.handler(f.event());
  assert.deepEqual(f.calls, []);
  assert.equal(f.state.studentFormClassId, "class-4b");
  assert(f.buttons.every(button => !button.disabled));
  assert.equal(f.form.dataset.saving, undefined);
});

test("a new student has no automatically selected service or template tasks", async () => {
  const records = [];
  const addStudent = loadFunction("addStudent", "editStudent", {
    state: { data: { catalog: [{ id: "iron-man" }] } },
    notify() {},
    splitFullName: () => ({ firstName: "Иван", lastName: "Иванов" }),
    normalizeCatalogIds: ids => ids.filter(Boolean),
    buildSelectedServices: ids => ids.map(serviceId => ({ serviceId })),
    uid: () => "student-id",
    stampCreated: value => value,
    STUDENT_MANUAL_STATUS_KEYS: [],
    orderItemsFromCatalogs: () => { throw new Error("No service should be used"); },
    put: async (store, record) => { records.push({ store, record }); }
  });
  const student = await addStudent({ classId: "class-4b", fio: "Иванов Иван" });
  assert.equal(student.catalogId, "");
  assert.equal(student.catalogIds.length, 0);
  assert.equal(student.selectedServices.length, 0);
  assert.equal(records[1].record.items.length, 0);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  assertSafeRelativePath,
  buildStoragePath,
  sanitizePathSegment,
  supportsDirectoryPicker
} from "../../js/services/file-system-service.js";

test("sanitizePathSegment removes characters forbidden on Windows and macOS", () => {
  assert.equal(sanitizePathSegment('  Иванов:Иван/4А?*  '), "Иванов Иван 4А");
  assert.equal(sanitizePathSegment("CON"), "CON_");
  assert.equal(sanitizePathSegment("..."), "Без названия");
});

test("assertSafeRelativePath rejects traversal and absolute paths", () => {
  assert.equal(assertSafeRelativePath("media/student/photo.jpg"), "media/student/photo.jpg");
  assert.throws(() => assertSafeRelativePath("../media/photo.jpg"), /Unsafe archive path/);
  assert.throws(() => assertSafeRelativePath("C:\\Users\\file.jpg"), /Unsafe archive path/);
  assert.throws(() => assertSafeRelativePath("/absolute/file.jpg"), /Unsafe archive path/);
});

test("buildStoragePath renders allowed variables into a safe relative path", () => {
  const path = buildStoragePath("{school}/{project}/{class}/{student_number}_{student_name}", {
    school: "Гимназия №12",
    project: "Выпуск 2026",
    class: "4А",
    student_number: "001",
    student_name: "Иванов/Иван"
  });
  assert.equal(path, "Гимназия №12/Выпуск 2026/4А/001_Иванов Иван");
});

test("supportsDirectoryPicker follows browser capability", () => {
  assert.equal(supportsDirectoryPicker({ showDirectoryPicker() {} }), true);
  assert.equal(supportsDirectoryPicker({}), false);
});


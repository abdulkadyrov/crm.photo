import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

test("service worker APP_SHELL only references existing local files", () => {
  const sw = readFileSync(resolve(root, "sw.js"), "utf8");
  const match = sw.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  assert.ok(match, "APP_SHELL array was not found");

  const paths = [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  const missing = paths
    .filter((path) => path !== "./")
    .filter((path) => !existsSync(resolve(root, path.replace(/^\.\//, ""))));

  assert.deepEqual(missing, []);
});


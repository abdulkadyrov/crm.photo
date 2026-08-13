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

test("application module cache-buster matches the service worker cache version", () => {
  const sw = readFileSync(resolve(root, "sw.js"), "utf8");
  const app = readFileSync(resolve(root, "js/core/app.js"), "utf8");
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const cacheVersion = sw.match(/const CACHE_VERSION = "(v\d+)"/)?.[1];
  const moduleVersion = app.match(/legacy-app\.js\?v=(\d+)/)?.[1];

  assert.ok(cacheVersion, "service worker cache version was not found");
  assert.ok(moduleVersion, "legacy module cache-buster was not found");
  assert.equal(`v${moduleVersion}`, cacheVersion);
  assert.match(html, new RegExp(`styles\\.css\\?v=${moduleVersion}`));
  assert.match(html, new RegExp(`js/core/app\\.js\\?v=${moduleVersion}`));
});

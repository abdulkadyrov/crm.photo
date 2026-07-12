import test from "node:test";
import assert from "node:assert/strict";

import { paginate, sortByField, visibleRange } from "../../js/services/list-performance-service.js";

test("paginate returns stable slices and bounds page number", () => {
  const items = Array.from({ length: 105 }, (_, index) => index + 1);
  assert.deepEqual(paginate(items, { page: 2, pageSize: 50 }).items, items.slice(50, 100));
  assert.equal(paginate(items, { page: 99, pageSize: 50 }).page, 3);
});

test("visibleRange calculates overscanned render window", () => {
  assert.deepEqual(visibleRange({ scrollTop: 1000, viewportHeight: 300, rowHeight: 50, total: 100, overscan: 2 }), {
    start: 18,
    end: 28,
    beforeHeight: 900,
    afterHeight: 3600
  });
});

test("sortByField uses numeric locale-aware order", () => {
  const sorted = sortByField([{ name: "4А" }, { name: "10А" }, { name: "2А" }], "name");
  assert.deepEqual(sorted.map((item) => item.name), ["2А", "4А", "10А"]);
});


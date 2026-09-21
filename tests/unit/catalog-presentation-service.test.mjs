import test from "node:test";
import assert from "node:assert/strict";
import { buildCatalogPresentation, normalizeParentPreviewMode } from "../../js/services/catalog-presentation-service.js";

test("parent presentation defaults to a printed A4 photo with a phone overlay for video", () => {
  assert.deepEqual(buildCatalogPresentation({ hasPhoto: true, hasVideo: true }), {
    template: "a4-print-phone-overlay",
    parentPreviewMode: "auto",
    printFormat: "A4",
    printPhoto: true,
    phoneOverlay: true,
    phoneVideo: true
  });
});

test("parent presentation respects print-only and digital-only selections", () => {
  assert.deepEqual(buildCatalogPresentation({ parentPreviewMode: "print", hasPhoto: true, hasVideo: true }), {
    template: "a4-print",
    parentPreviewMode: "print",
    printFormat: "A4",
    printPhoto: true,
    phoneOverlay: false,
    phoneVideo: false
  });
  assert.deepEqual(buildCatalogPresentation({ parentPreviewMode: "digital", hasPhoto: true, hasVideo: true }), {
    template: "phone-video",
    parentPreviewMode: "digital",
    printFormat: null,
    printPhoto: false,
    phoneOverlay: false,
    phoneVideo: true
  });
});

test("unknown parent presentation mode stays backward-compatible", () => {
  assert.equal(normalizeParentPreviewMode("not-a-mode"), "auto");
  assert.equal(buildCatalogPresentation().template, "none");
});

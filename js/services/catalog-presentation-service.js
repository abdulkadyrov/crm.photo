export const PARENT_PREVIEW_MODES = Object.freeze(["auto", "print", "digital"]);

export function normalizeParentPreviewMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  return PARENT_PREVIEW_MODES.includes(mode) ? mode : "auto";
}

export function buildCatalogPresentation({ parentPreviewMode = "auto", hasPhoto = false, hasVideo = false } = {}) {
  const mode = normalizeParentPreviewMode(parentPreviewMode);
  const printPhoto = mode !== "digital" && Boolean(hasPhoto);
  const phoneVideo = mode !== "print" && Boolean(hasVideo);
  const phoneOverlay = printPhoto && phoneVideo;

  return {
    template: phoneOverlay ? "a4-print-phone-overlay" : printPhoto ? "a4-print" : phoneVideo ? "phone-video" : "none",
    parentPreviewMode: mode,
    printFormat: printPhoto ? "A4" : null,
    printPhoto,
    phoneOverlay,
    phoneVideo
  };
}

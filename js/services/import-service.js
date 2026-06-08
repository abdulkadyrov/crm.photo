export function normalizeImportScope(scope = "auto") {
  return String(scope || "auto").toLowerCase();
}

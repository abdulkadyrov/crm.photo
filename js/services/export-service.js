export function exportManifest(base = {}) {
  return {
    ...base,
    exportedAt: new Date().toISOString()
  };
}

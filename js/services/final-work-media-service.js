export async function runWithMediaFallback(candidates = [], action) {
  let lastError = null;
  const seen = new Set();
  for (const candidate of candidates) {
    const blob = candidate?.blob;
    if (!(blob instanceof Blob) || seen.has(blob)) continue;
    seen.add(blob);
    try {
      return await action(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
}

export function clampImageZoom(value, min = 1, max = 5) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

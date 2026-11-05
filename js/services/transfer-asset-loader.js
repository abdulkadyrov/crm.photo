// Bundled application assets can be restored by the installed CRM itself.
export function isBundledTransferAsset(source, baseURI) {
  try {
    const root = new URL('./assets/', baseURI);
    const url = new URL(source, baseURI);
    return url.origin === root.origin && url.pathname.startsWith(root.pathname);
  } catch { return false; }
}
export function createTransferAssetLoader({baseURI, includeBundled = true, fetchImpl = fetch, cacheStorage = globalThis.caches} = {}) {
  const pending = new Map();
  return async source => {
    if (!includeBundled && isBundledTransferAsset(source, baseURI)) return null;
    const url = new URL(source, baseURI).href;
    if (!pending.has(url)) pending.set(url, (async () => {
      const response = await cacheStorage?.match(url) || await fetchImpl(url, {signal: AbortSignal.timeout(30000)});
      if (!response.ok) throw new Error(`Не удалось прочитать файл для экспорта (${response.status}): ${new URL(url).pathname}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) throw new Error(`Пустой файл для экспорта: ${new URL(url).pathname}`);
      return {bytes, contentType: response.headers.get('content-type')};
    })());
    return pending.get(url);
  };
}

// Read a verified server blob without requiring local persistent storage.
export async function loadTransientSyncBlob(hash,{readCached,fetchBlob,sha256}) {
  let cached;
  try { cached=await readCached(hash); } catch { /* A broken local cache must not block online printing. */ }
  if(cached)return cached;
  const blob=await fetchBlob(hash);
  if(await sha256(blob)!==hash)throw new Error('Контрольная сумма файла не совпала');
  return blob;
}

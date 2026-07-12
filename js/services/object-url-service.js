export function createObjectUrlRegistry(urlApi = globalThis.URL) {
  const urls = new Set();
  return {
    create(blob) {
      const url = urlApi.createObjectURL(blob);
      urls.add(url);
      return url;
    },
    revoke(url) {
      if (!url || !urls.has(url)) return false;
      urlApi.revokeObjectURL(url);
      urls.delete(url);
      return true;
    },
    revokeAll() {
      urls.forEach((url) => urlApi.revokeObjectURL(url));
      const count = urls.size;
      urls.clear();
      return count;
    },
    has(url) {
      return urls.has(url);
    },
    size() {
      return urls.size;
    }
  };
}

export const objectUrls = createObjectUrlRegistry();


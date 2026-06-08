export function createObjectUrl(blob) {
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

export function mediaRecordFromFile(file, extra = {}) {
  return {
    ...extra,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    blob: file
  };
}

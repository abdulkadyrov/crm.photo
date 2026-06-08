export function isZipFile(file) {
  return file?.type === "application/zip" || file?.name?.toLowerCase().endsWith(".zip");
}

export function parseQrPayload(value) {
  if (!value) return { type: "empty", raw: value };
  try {
    const parsed = JSON.parse(value);
    return { type: parsed.type || "json", payload: parsed, raw: value };
  } catch {
    return { type: "text", raw: value };
  }
}

export function detectQrType(value) {
  return parseQrPayload(value).type;
}

export function createStudentQrPayload(student) {
  return student?.qrId || student?.id || "";
}

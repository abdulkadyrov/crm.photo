import { uid } from "../utils/ids.js";
import { nowIso } from "../utils/date.js";

const FINAL_WORK_PRINT_QR_PREFIX = "VSF1:";

export function createFinalWork(input) {
  const timestamp = nowIso();
  const id = input.id || uid("final");
  return {
    id,
    projectId: input.projectId,
    groupId: input.groupId,
    studentId: input.studentId,
    serviceId: input.serviceId,
    sourceMediaId: input.sourceMediaId,
    referenceMediaId: input.referenceMediaId,
    resultMediaId: input.resultMediaId,
    printQrPayload: input.printQrPayload || createFinalWorkPrintPayload({ id }),
    status: input.status || "ready",
    createdAt: input.createdAt || timestamp,
    updatedAt: input.updatedAt || timestamp,
    createdBy: input.createdBy
  };
}

export function createFinalWorkPrintPayload(finalWork) {
  return `${FINAL_WORK_PRINT_QR_PREFIX}${base64UrlEncode(finalWork.id || "")}`;
}

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

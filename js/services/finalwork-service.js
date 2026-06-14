import { uid } from "../utils/ids.js";
import { nowIso } from "../utils/date.js";

const FINAL_WORK_PRINT_QR_PREFIX = "VSF1:";
const FINAL_WORK_PRINT_QR_V2_PREFIX = "VSF2:";

export function createFinalWork(input) {
  const timestamp = nowIso();
  const id = input.id || uid("final");
  const work = {
    id,
    projectId: input.projectId,
    groupId: input.groupId,
    studentId: input.studentId,
    serviceId: input.serviceId,
    sourceMediaId: input.sourceMediaId,
    referenceMediaId: input.referenceMediaId,
    resultMediaId: input.resultMediaId,
    originalFinalImage: input.originalFinalImage || null,
    mergedPrintImage: input.mergedPrintImage || null,
    status: input.status || "ready",
    createdAt: input.createdAt || timestamp,
    updatedAt: input.updatedAt || timestamp,
    createdBy: input.createdBy
  };
  work.qrData = input.qrData || createFinalWorkQrData(work);
  work.printQrPayload = input.printQrPayload || work.qrData.payload || createFinalWorkPrintPayload({ id });
  return work;
}

export function createFinalWorkPrintPayload(finalWork) {
  return createFinalWorkQrData(finalWork).payload || `${FINAL_WORK_PRINT_QR_PREFIX}${base64UrlEncode(finalWork.id || "")}`;
}

export function createFinalWorkQrData(finalWork) {
  const finalWorkId = finalWork?.id || finalWork?.finalWorkId || "";
  const short = {
    project: shortQrToken(finalWork?.projectId),
    group: shortQrToken(finalWork?.groupId),
    student: shortQrToken(finalWork?.studentId),
    result: shortQrToken(finalWorkId)
  };
  return {
    type: "final_work_print",
    version: 2,
    projectId: finalWork?.projectId || "",
    groupId: finalWork?.groupId || "",
    studentId: finalWork?.studentId || "",
    finalWorkId,
    resultId: finalWorkId,
    serviceId: finalWork?.serviceId || "",
    resultMediaId: finalWork?.resultMediaId || "",
    short,
    payload: `${FINAL_WORK_PRINT_QR_V2_PREFIX}${short.project}.${short.group}.${short.student}.${short.result}`
  };
}

function shortQrToken(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0").slice(-7);
}

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

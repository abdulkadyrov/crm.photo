import { uid } from "../utils/ids.js";
import { nowIso } from "../utils/date.js";

export function createFinalWork(input) {
  const timestamp = nowIso();
  return {
    id: input.id || uid("final"),
    projectId: input.projectId,
    groupId: input.groupId,
    studentId: input.studentId,
    serviceId: input.serviceId,
    sourceMediaId: input.sourceMediaId,
    referenceMediaId: input.referenceMediaId,
    resultMediaId: input.resultMediaId,
    printQrPayload: input.printQrPayload,
    status: input.status || "ready",
    createdAt: input.createdAt || timestamp,
    updatedAt: input.updatedAt || timestamp,
    createdBy: input.createdBy
  };
}

export function createFinalWorkPrintPayload(finalWork) {
  return JSON.stringify({
    type: "final_work_print",
    finalWorkId: finalWork.id,
    studentId: finalWork.studentId,
    groupId: finalWork.groupId,
    projectId: finalWork.projectId,
    serviceId: finalWork.serviceId
  });
}

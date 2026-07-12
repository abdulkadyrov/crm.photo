export function buildExportSelection(data = {}, options = {}) {
  const projectIds = selectProjectIds(data, options);
  const classIds = selectClassIds(data, options, projectIds);
  const students = selectStudents(data, options, classIds);
  const studentIds = new Set(students.map((student) => student.id));
  const serviceIds = serviceIdsForStudents(students);

  return {
    projects: (data.projects || []).filter((project) => projectIds.has(project.id)),
    classes: (data.classes || []).filter((klass) => classIds.has(klass.id)),
    students,
    operators: options.includeOperators === false ? [] : [...(data.operators || [])],
    operatorEvents: options.includeOperatorLogs ? [...(data.operatorEvents || [])] : [],
    catalog: options.includeCatalog === false ? [] : (data.catalog || []).filter((service) => !serviceIds.size || serviceIds.has(service.id)),
    orders: (data.orders || []).filter((order) => studentIds.has(order.studentId)),
    media: filterMedia(data.media || [], studentIds, options),
    finalWorks: options.includeFinalWorks === false ? [] : (data.finalWorks || []).filter((work) => studentIds.has(work.studentId)),
    documents: options.includeDocuments === false ? [] : filterDocuments(data.documents || [], projectIds, classIds, studentIds),
    settings: options.includeSettings === false ? [] : [...(data.settings || [])],
    templates: options.includeCatalog === false ? [] : [...(data.templates || [])]
  };
}

function selectProjectIds(data, options) {
  if (options.projectId) return new Set([options.projectId]);
  if (options.classId) {
    const klass = (data.classes || []).find((item) => item.id === options.classId);
    return new Set([klass?.projectId].filter(Boolean));
  }
  if (options.studentIds?.length) {
    const classIds = new Set((data.students || []).filter((student) => options.studentIds.includes(student.id)).map((student) => student.classId));
    return new Set((data.classes || []).filter((klass) => classIds.has(klass.id)).map((klass) => klass.projectId));
  }
  return new Set((data.projects || []).map((project) => project.id));
}

function selectClassIds(data, options, projectIds) {
  if (options.classId) return new Set([options.classId]);
  if (options.studentIds?.length) {
    return new Set((data.students || []).filter((student) => options.studentIds.includes(student.id)).map((student) => student.classId));
  }
  return new Set((data.classes || []).filter((klass) => projectIds.has(klass.projectId)).map((klass) => klass.id));
}

function selectStudents(data, options, classIds) {
  if (options.studentIds?.length) {
    const wanted = new Set(options.studentIds);
    return (data.students || []).filter((student) => wanted.has(student.id));
  }
  return (data.students || []).filter((student) => classIds.has(student.classId));
}

function serviceIdsForStudents(students) {
  const ids = new Set();
  students.forEach((student) => {
    if (student.catalogId) ids.add(student.catalogId);
    (student.catalogIds || []).forEach((id) => ids.add(id));
    (student.selectedServices || []).forEach((item) => {
      if (item.serviceId) ids.add(item.serviceId);
    });
  });
  return ids;
}

function filterMedia(media, studentIds, options) {
  return media.filter((item) => {
    if (!studentIds.has(item.studentId)) return false;
    if (options.onlyNew && item.exportedAt) return false;
    if (options.includeVideo === false && item.type === "video") return false;
    if (options.onlyOriginals && item.kind && item.kind !== "original") return false;
    return true;
  });
}

function filterDocuments(documents, projectIds, classIds, studentIds) {
  return documents.filter((doc) => {
    if (doc.studentId && studentIds.has(doc.studentId)) return true;
    if (doc.groupId && classIds.has(doc.groupId)) return true;
    if (doc.classId && classIds.has(doc.classId)) return true;
    if (doc.projectId && projectIds.has(doc.projectId)) return true;
    if (doc.ownerType === "student" && studentIds.has(doc.ownerId)) return true;
    if (["group", "class"].includes(doc.ownerType) && classIds.has(doc.ownerId)) return true;
    return doc.ownerType === "project" && projectIds.has(doc.ownerId);
  });
}


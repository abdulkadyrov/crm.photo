export function calculatePhotographerWorkOverview(data = {}, operatorId = "", matchesOperator = defaultMatchesOperator) {
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const classes = Array.isArray(data.classes) ? data.classes : [];
  const students = Array.isArray(data.students) ? data.students : [];
  const media = Array.isArray(data.media) ? data.media : [];
  const orders = Array.isArray(data.orders) ? data.orders : [];
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const projectMap = new Map();
  const classRows = [];
  let totalStudents = 0;
  let totalPhotographedStudents = 0;
  let totalRemainingStudents = 0;
  let totalMedia = 0;
  let totalDoneTasks = 0;
  let totalTasks = 0;
  let completedClasses = 0;

  classes.forEach((klass) => {
    const project = projectsById.get(klass.projectId);
    const classStudents = students.filter((student) => student.classId === klass.id);
    const studentIds = new Set(classStudents.map((student) => student.id));
    const operatorMedia = media.filter((item) => (
      studentIds.has(item.studentId)
      && matchesOperator(item, operatorId, ["createdBy", "importedBy", "capturedBy"])
    ));
    const photographedIds = new Set(operatorMedia.map((item) => item.studentId).filter(Boolean));
    const ownStudents = classStudents.filter((student) => matchesOperator(student, operatorId, ["createdBy", "updatedBy"]));
    const classTasks = orders
      .filter((order) => studentIds.has(order.studentId))
      .flatMap((order) => (order.items || []).map((item) => ({ ...item, order })));
    const doneTasks = classTasks.filter((item) => (
      item.status === "done" && matchesOperator(item, operatorId, ["completedBy", "updatedBy"])
    )).length;
    const hasClassRecord = matchesOperator(klass, operatorId, ["createdBy", "updatedBy", "exportedBy"]);
    const hasProjectRecord = project && matchesOperator(project, operatorId, ["createdBy", "updatedBy", "exportedBy"]);
    if (!operatorMedia.length && !ownStudents.length && !doneTasks && !hasClassRecord && !hasProjectRecord) return;

    const photographedStudents = photographedIds.size;
    const remainingStudents = Math.max(0, classStudents.length - photographedStudents);
    const row = {
      projectId: klass.projectId,
      projectName: project?.name || "Проект",
      className: klass.name,
      students: classStudents.length,
      photographedStudents,
      remainingStudents,
      media: operatorMedia.length,
      doneTasks,
      totalTasks: classTasks.length
    };
    classRows.push(row);
    totalStudents += row.students;
    totalPhotographedStudents += row.photographedStudents;
    totalRemainingStudents += row.remainingStudents;
    totalMedia += row.media;
    totalDoneTasks += row.doneTasks;
    totalTasks += row.totalTasks;
    if (row.students > 0 && row.remainingStudents === 0) completedClasses += 1;

    const projectRow = projectMap.get(row.projectId) || {
      projectId: row.projectId,
      projectName: row.projectName,
      classes: 0,
      students: 0,
      photographedStudents: 0,
      remainingStudents: 0,
      media: 0,
      doneTasks: 0,
      totalTasks: 0
    };
    projectRow.classes += 1;
    projectRow.students += row.students;
    projectRow.photographedStudents += row.photographedStudents;
    projectRow.remainingStudents += row.remainingStudents;
    projectRow.media += row.media;
    projectRow.doneTasks += row.doneTasks;
    projectRow.totalTasks += row.totalTasks;
    projectMap.set(row.projectId, projectRow);
  });

  const projectRows = Array.from(projectMap.values()).sort((a, b) => b.media - a.media || b.photographedStudents - a.photographedStudents);
  classRows.sort((a, b) => b.media - a.media || b.photographedStudents - a.photographedStudents);
  return {
    projects: projectRows.length,
    classes: classRows.length,
    completedClasses,
    students: totalStudents,
    photographedStudents: totalPhotographedStudents,
    remainingStudents: totalRemainingStudents,
    media: totalMedia,
    doneTasks: totalDoneTasks,
    totalTasks,
    projectRows,
    classRows
  };
}

function defaultMatchesOperator(record, operatorId, fields = []) {
  return fields.some((field) => record?.[field] === operatorId);
}

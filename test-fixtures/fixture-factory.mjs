export const FIXTURE_PROFILES = {
  small: {
    projects: 1,
    classes: 1,
    students: 5,
    services: 3,
    media: 6,
    documents: 1,
    finalWorks: 1,
    operators: 2,
    albumProjects: 1
  },
  medium: {
    projects: 5,
    classes: 20,
    students: 500,
    services: 12,
    media: 5000,
    documents: 50,
    finalWorks: 250,
    operators: 8,
    albumProjects: 2
  },
  large: {
    projects: 20,
    classes: 100,
    students: 5000,
    services: 20,
    media: 20000,
    documents: 300,
    finalWorks: 2500,
    operators: 20,
    albumProjects: 5
  }
};

export function createFixture(profileName = "small") {
  const profile = FIXTURE_PROFILES[profileName];
  if (!profile) throw new Error(`Unknown fixture profile: ${profileName}`);

  const projects = range(profile.projects, (index) => ({
    id: `${profileName}-project-${index}`,
    name: `Проект ${index}`,
    schoolName: `Школа ${index}`,
    createdAt: timestamp(index)
  }));

  const classes = range(profile.classes, (index) => {
    const project = projects[(index - 1) % projects.length];
    return {
      id: `${profileName}-class-${index}`,
      projectId: project.id,
      name: `${(index % 11) + 1}${russianClassLetter(index)}`,
      createdAt: timestamp(index)
    };
  });

  const students = range(profile.students, (index) => {
    const klass = classes[(index - 1) % classes.length];
    const serviceId = `${profileName}-service-${((index - 1) % profile.services) + 1}`;
    return {
      id: `${profileName}-student-${index}`,
      classId: klass.id,
      firstName: `Имя${index}`,
      lastName: `Фамилия${index}`,
      qrId: `${profileName}-student-${index}`,
      catalogId: serviceId,
      catalogIds: [serviceId],
      selectedServices: [{ serviceId, quantity: 1 }],
      paymentStatus: index % 3 === 0 ? "paid" : "unpaid",
      orderStatus: index % 4 === 0 ? "shot" : "not_started"
    };
  });

  return {
    profile: profileName,
    generatedAt: "2026-07-12T00:00:00Z",
    projects,
    classes,
    students,
    catalog: range(profile.services, (index) => ({
      id: `${profileName}-service-${index}`,
      name: `Услуга ${index}`,
      price: 900 + index * 100,
      gender: index % 2 ? "boys" : "girls"
    })),
    operators: range(profile.operators, (index) => ({
      id: `${profileName}-operator-${index}`,
      name: index === 1 ? "Владелец" : `Оператор ${index}`,
      role: index === 1 ? "owner" : "photographer",
      isActive: true
    })),
    orders: students.map((student) => ({
      id: `${profileName}-order-${student.id}`,
      studentId: student.id,
      items: [{ id: `${student.id}-task-1`, type: "portrait", status: "not_started" }]
    })),
    media: range(profile.media, (index) => {
      const student = students[(index - 1) % students.length];
      return {
        id: `${profileName}-media-${index}`,
        studentId: student.id,
        fileName: `${student.id}-${index}.jpg`,
        type: index % 12 === 0 ? "video" : "photo",
        kind: "original",
        size: index % 12 === 0 ? 24000000 : 320000,
        createdAt: timestamp(index)
      };
    }),
    documents: range(profile.documents, (index) => {
      const klass = classes[(index - 1) % classes.length];
      return {
        id: `${profileName}-document-${index}`,
        projectId: klass.projectId,
        groupId: klass.id,
        fileName: `document-${index}.pdf`,
        size: 64000
      };
    }),
    finalWorks: range(profile.finalWorks, (index) => {
      const student = students[(index - 1) % students.length];
      return {
        id: `${profileName}-final-${index}`,
        studentId: student.id,
        groupId: student.classId,
        serviceId: student.catalogId,
        status: index % 2 ? "ready" : "printed",
        size: 480000
      };
    }),
    albumProjects: range(profile.albumProjects, (index) => ({
      id: `${profileName}-album-project-${index}`,
      schoolName: `Альбом школа ${index}`,
      year: 2026
    }))
  };
}

export function fixtureCounts(fixture) {
  return {
    projects: fixture.projects.length,
    classes: fixture.classes.length,
    students: fixture.students.length,
    services: fixture.catalog.length,
    media: fixture.media.length,
    documents: fixture.documents.length,
    finalWorks: fixture.finalWorks.length,
    operators: fixture.operators.length,
    albumProjects: fixture.albumProjects.length
  };
}

function range(count, factory) {
  return Array.from({ length: count }, (_, index) => factory(index + 1));
}

function timestamp(index) {
  return new Date(Date.UTC(2026, 6, 12, 0, index % 60, 0)).toISOString();
}

function russianClassLetter(index) {
  return ["А", "Б", "В", "Г"][(index - 1) % 4];
}


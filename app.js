const DB_NAME = "school-photo-flow";
const DB_VERSION = 3;
const STORE_NAMES = [
  "projects",
  "classes",
  "students",
  "orders",
  "media",
  "templates",
  "settings",
  "catalog",
  "albumProjects",
  "albumClasses",
  "albumStudents",
  "albumGroupMedia",
  "albumTeachers",
  "albumMedia"
];
const ORDER_TYPES = {
  portrait: "Портрет",
  full: "Полный рост",
  side: "Профиль",
  video: "Видео",
  interview: "Интервью"
};
const ORDER_STATUSES = {
  not_started: "Не начат",
  shooting: "На съемке",
  processing: "В обработке",
  ready: "Готов",
  delivered: "Выдан"
};
const ALBUM_TYPES = {
  budget: "Бюджет",
  standard: "Стандарт",
  premium: "Премиум",
  custom: "Индивидуальный"
};
const ALBUM_CLASS_STATUSES = {
  not_started: "Не начат",
  shooting: "Съемка",
  editing: "Верстка",
  ready: "Готов",
  printing: "Печать",
  delivered: "Выдан"
};
const ALBUM_STUDENT_STATUSES = {
  not_shot: "Не снят",
  shot: "Снято",
  editing: "В обработке",
  ready: "Готов"
};
const ALBUM_GROUP_TYPES = {
  class_photo: "Общее фото класса",
  boys: "Фото мальчиков",
  girls: "Фото девочек",
  custom: "Другое"
};
const STATUS_EXPORT_DEFAULT = {
  id: "status-export-template",
  title: "Статус заказов",
  columns: ["number", "student", "class", "payment", "catalog", "orderStatus", "progress", "pending"]
};

const state = {
  route: "home",
  projectId: null,
  classId: null,
  studentId: null,
  filter: "all",
  query: "",
  db: null,
  data: emptyData(),
  currentCapture: null,
  currentReference: null,
  currentAlbumMedia: null,
  albumProjectId: null,
  albumClassId: null,
  albumTab: "students",
  returnTarget: null,
  qrStream: null,
  qrScanFrame: 0,
  qrScanActive: false
};

const QR_SCAN_INTERVAL = 120;
const REFERENCE_AI_SET = [
  {
    id: "portrait_waist",
    name: "Портрет до пояса",
    details: "Фронтально, кадр до пояса, естественная поза и ровный свет.",
    composition: "waist"
  },
  {
    id: "face_front",
    name: "Лицо анфас",
    details: "Крупно лицо и голова спереди, взгляд в камеру.",
    composition: "face"
  },
  {
    id: "head_right",
    name: "Голова справа",
    details: "Профиль головы с правой стороны, чистый контур лица.",
    composition: "side"
  },
  {
    id: "full_front",
    name: "Полный рост",
    details: "Фронтально во весь рост, фигура полностью в кадре.",
    composition: "full"
  }
];

const view = document.querySelector("#view");
const title = document.querySelector("#screen-title");
const toast = document.querySelector("#toast");
const mediaInput = document.querySelector("#media-input");
const referenceInput = document.querySelector("#reference-input");
const shootImportInput = document.querySelector("#shoot-import-input");
const zipInput = document.querySelector("#zip-input");
const albumMediaInput = document.querySelector("#album-media-input");
const albumZipInput = document.querySelector("#album-zip-input");

init();

async function init() {
  injectIcons();
  document.documentElement.dataset.theme = localStorage.getItem("spf-theme") || "light";
  state.db = await openDb();
  await seedIfNeeded();
  await seedCatalogIfNeeded();
  await refreshData();
  bindShell();
  navigateFromUrl() || navigate("home");
  registerServiceWorker();
}

function navigateFromUrl() {
  const params = new URLSearchParams(location.search);
  const studentId = params.get("studentId") || params.get("qrId") || location.hash.replace(/^#/, "");
  const student = studentFromQrValue(parseQrPayload(studentId));
  if (!student) return false;
  navigate("student", { studentId: student.id });
  return true;
}

function emptyData() {
  return {
    projects: [],
    classes: [],
    students: [],
    orders: [],
    media: [],
    templates: [],
    settings: [],
    catalog: []
  };
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORE_NAMES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(storeName, mode = "readonly") {
  return state.db.transaction(storeName, mode).objectStore(storeName);
}

function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function put(storeName, value) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, "readwrite").put(value);
    request.onsuccess = () => resolve(value);
    request.onerror = () => reject(request.error);
  });
}

function del(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, "readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, "readwrite").clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function refreshData() {
  const entries = await Promise.all(STORE_NAMES.map((name) => getAll(name)));
  STORE_NAMES.forEach((name, index) => {
    state.data[name] = entries[index];
  });
}

async function seedIfNeeded() {
  const projects = await getAll("projects");
  if (projects.length) return;
  const projectId = uid("project");
  const classA = uid("class");
  const classB = uid("class");
  const templateId = uid("template");
  await put("templates", {
    id: templateId,
    name: "Базовый чеклист",
    items: ["portrait", "full", "side", "video", "interview"],
    scope: "default"
  });
  await put("projects", { id: projectId, name: "Гимназия 12", createdAt: now(), templateId });
  await put("classes", { id: classA, projectId, name: "4A" });
  await put("classes", { id: classB, projectId, name: "4B" });
  const students = [
    ["Алиса", "Смирнова", classA, "paid"],
    ["Максим", "Иванов", classA, "unpaid"],
    ["София", "Петрова", classB, "paid"]
  ];
  for (const [firstName, lastName, classId, paymentStatus] of students) {
    const id = uid("student");
    await put("students", { id, classId, firstName, lastName, qrId: id, paymentStatus, status: "not_started" });
    await put("orders", { id: `order_${id}`, studentId: id, items: defaultOrderItems() });
  }
}

async function seedCatalogIfNeeded() {
  const catalog = await getAll("catalog");
  if (catalog.length) return;
  await put("catalog", {
    id: uid("catalog"),
    title: "Стандартный школьный пакет",
    mediaKind: "both",
    price: "0",
    orderInfo: "Портреты, полный рост, профиль, короткое видео и интервью.",
    requirements: "Ровный свет, чистый фон, готовый список учеников и место для съемки.",
    angles: [
      { id: "portrait", name: "Портрет", details: "Лицо и плечи, взгляд в камеру.", refDataUrl: "", refName: "" },
      { id: "full", name: "Полный рост", details: "Ученик полностью в кадре.", refDataUrl: "", refName: "" },
      { id: "side", name: "Профиль", details: "Ракурс сбоку.", refDataUrl: "", refName: "" },
      { id: "video", name: "Видео", details: "Короткий проход или приветствие.", refDataUrl: "", refName: "" },
      { id: "interview", name: "Интервью", details: "Ответ на вопрос в камеру.", refDataUrl: "", refName: "" }
    ]
  });
}

function bindShell() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.route));
  });
  document.querySelector("#theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("spf-theme", next);
  });
  document.querySelector("#add-project").addEventListener("click", addProject);
  mediaInput.addEventListener("change", handleMediaInput);
  referenceInput.addEventListener("change", handleReferenceInput);
  shootImportInput.addEventListener("change", handleShootImport);
  zipInput.addEventListener("change", handleZipInput);
  albumMediaInput.addEventListener("change", handleAlbumMediaInput);
  albumZipInput.addEventListener("change", handleAlbumZipInput);
}

function navigate(route, params = {}) {
  stopQrStream();
  if (route === "student" && state.route !== "student") {
    state.returnTarget = routeSnapshot();
  }
  Object.assign(state, params, { route });
  document.querySelectorAll(".nav-item").forEach((item) => {
    const itemRoute = item.dataset.route;
    item.classList.toggle("active", itemRoute === route || (itemRoute === "albums" && route.startsWith("album")));
  });
  render();
}

function routeSnapshot() {
  return {
    route: state.route,
    projectId: state.projectId,
    classId: state.classId,
    query: state.query,
    filter: state.filter
  };
}

function render() {
  const renderers = {
    home: renderHome,
    search: renderSearch,
    scan: renderScan,
    classes: renderClasses,
    catalog: renderCatalog,
    albums: renderAlbums,
    albumProject: renderAlbumProject,
    albumClass: renderAlbumClass,
    settings: renderSettings,
    student: renderStudent
  };
  (renderers[state.route] || renderHome)();
  view.focus({ preventScroll: true });
}

function renderHome() {
  title.textContent = "Проекты";
  const projects = state.data.projects;
  view.innerHTML = `
    <section class="toolbar">
      <div class="chip-row">
        ${filterChip("all", "Все")}
        ${filterChip("todo", "Не снято")}
        ${filterChip("done", "Снято")}
        ${filterChip("paid", "Оплачено")}
      </div>
      <button class="secondary-button" data-action="export-all" type="button">Экспорт ZIP</button>
    </section>
    <section class="grid project-grid">
      ${projects.map(projectCard).join("") || empty("Создайте первый проект для школы")}
    </section>
  `;
  bindViewActions();
}

function projectCard(project) {
  const classes = classesByProject(project.id);
  const students = classes.flatMap((klass) => studentsByClass(klass.id));
  const done = students.filter((student) => completion(student.id).done).length;
  const paid = students.filter((student) => student.paymentStatus === "paid").length;
  const pct = students.length ? Math.round((done / students.length) * 100) : 0;
  return `
    <article class="card card-button" data-open-project="${project.id}">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHtml(project.name)}</h2>
          <p class="muted">${classes.length} классов · ${students.length} учеников</p>
        </div>
        <div class="row">
          <button class="icon-button" data-add-class="${project.id}" type="button" title="Добавить класс"><span data-icon="plus"></span></button>
          <button class="icon-button danger-icon" data-delete-project="${project.id}" type="button" title="Удалить проект"><span data-icon="trash"></span></button>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><strong>${done}</strong><span class="muted">готово</span></div>
        <div class="stat"><strong>${students.length - done}</strong><span class="muted">в очереди</span></div>
        <div class="stat"><strong>${paid}</strong><span class="muted">оплачено</span></div>
      </div>
      <div class="progress"><span style="width:${pct}%"></span></div>
    </article>
  `;
}

function renderClasses() {
  title.textContent = "Классы";
  const projects = state.data.projects;
  const activeProject = state.projectId || projects[0]?.id || "";
  state.projectId = activeProject;
  const classes = activeProject ? classesByProject(activeProject) : [];
  if (state.classId && !classes.some((klass) => klass.id === state.classId)) state.classId = null;
  view.innerHTML = `
    <section class="toolbar">
      <select class="select" data-project-select>
        ${projects.map((project) => `<option value="${project.id}" ${project.id === activeProject ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}
      </select>
      <div class="row">
        <button class="secondary-button" data-export-status-project="${activeProject}" type="button">PDF статусов</button>
        <button class="primary-button" data-add-class="${activeProject}" type="button">Класс</button>
      </div>
    </section>
    ${state.classId ? studentQuickForm(state.classId) : ""}
    <section class="grid project-grid">
      ${classes.map(classCard).join("") || empty("В проекте пока нет классов")}
    </section>
  `;
  bindViewActions();
}

function classCard(klass) {
  const students = studentsByClass(klass.id);
  const done = students.filter((student) => completion(student.id).done).length;
  const pct = students.length ? Math.round((done / students.length) * 100) : 0;
  return `
    <article class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHtml(klass.name)}</h2>
          <p class="muted">${students.length} учеников</p>
        </div>
        <div class="row">
          <button class="icon-button" data-add-student="${klass.id}" type="button" title="Добавить ученика"><span data-icon="plus"></span></button>
          <button class="icon-button" data-export-status-class="${klass.id}" type="button" title="PDF статусов"><span data-icon="download"></span></button>
          <button class="icon-button danger-icon" data-delete-class="${klass.id}" type="button" title="Удалить класс"><span data-icon="trash"></span></button>
        </div>
      </div>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <div class="grid" style="margin-top:14px">
        ${students.map(studentCard).join("") || '<p class="muted">Добавьте учеников в класс.</p>'}
      </div>
    </article>
  `;
}

function renderSearch() {
  title.textContent = "Поиск";
  const results = filteredStudents();
  view.innerHTML = `
    <section class="grid">
      <input class="input" data-query placeholder="Ученик, класс, проект или QR" value="${escapeAttr(state.query)}" />
      <div class="chip-row">
        ${filterChip("all", "Все")}
        ${filterChip("todo", "Не снято")}
        ${filterChip("done", "Снято")}
        ${filterChip("processing", "В обработке")}
        ${filterChip("ready", "Готово")}
        ${filterChip("paid", "Оплачено")}
      </div>
      <div class="grid">
        ${results.map(studentCard).join("") || empty("Ничего не найдено")}
      </div>
    </section>
  `;
  bindViewActions();
  const input = view.querySelector("[data-query]");
  input?.focus();
  input?.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderSearch();
  });
}

function renderScan() {
  title.textContent = "Сканер QR";
  view.innerHTML = `
    <section class="split">
      <div class="panel">
        <div class="qr-box" id="qr-box">
          <div>
            <p class="card-title">QR → ученик → чеклист</p>
            <p class="muted">Наведите камеру на QR или введите ID ученика вручную.</p>
          </div>
        </div>
        <div class="toolbar" style="margin-top:12px">
          <button class="primary-button" data-start-scan type="button">Сканировать</button>
          <button class="secondary-button" data-import-shoot type="button">Импорт съемки</button>
          <button class="secondary-button" data-stop-scan type="button">Стоп</button>
        </div>
        <p class="muted scan-note">Импорт съемки распределяет фото по QR-разделителям: QR ученика, затем его снимки, потом QR следующего ученика.</p>
      </div>
      <form class="panel grid" data-manual-qr>
        <h2 class="card-title">Ручной ввод</h2>
        <input class="input" name="qr" placeholder="ID ученика или QR ID" required />
        <button class="primary-button" type="submit">Открыть ученика</button>
      </form>
    </section>
  `;
  bindViewActions();
}

function renderAlbums() {
  title.textContent = "Альбомы";
  const projects = state.data.albumProjects;
  view.innerHTML = `
    <section class="toolbar">
      <div>
        <h2 class="card-title">Выпускные альбомы</h2>
        <p class="muted">Школа → класс → ученики, общие фото, учителя и экспорт дизайнеру.</p>
      </div>
      <button class="primary-button" data-add-album-project type="button">Школа</button>
    </section>
    <section class="grid project-grid">
      ${projects.map(albumProjectCard).join("") || empty("Создайте первую школу для альбомов")}
    </section>
  `;
  bindViewActions();
}

function albumProjectCard(project) {
  const classes = albumClassesByProject(project.id);
  const students = classes.flatMap((klass) => albumStudentsByClass(klass.id));
  const ready = classes.filter((klass) => ["ready", "printing", "delivered"].includes(klass.status)).length;
  const pct = classes.length ? Math.round((ready / classes.length) * 100) : 0;
  return `
    <article class="card card-button" data-open-album-project="${project.id}" tabindex="0">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHtml(project.schoolName)}</h2>
          <p class="muted">${classes.length} классов · ${students.length} учеников</p>
        </div>
        <div class="row">
          <button class="icon-button" data-add-album-class="${project.id}" type="button" title="Добавить класс"><span data-icon="plus"></span></button>
          <button class="icon-button danger-icon" data-delete-album-project="${project.id}" type="button" title="Удалить школу"><span data-icon="trash"></span></button>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><strong>${classes.length}</strong><span class="muted">классов</span></div>
        <div class="stat"><strong>${ready}</strong><span class="muted">готово</span></div>
        <div class="stat"><strong>${students.length}</strong><span class="muted">учеников</span></div>
      </div>
      <div class="progress"><span style="width:${pct}%"></span></div>
    </article>
  `;
}

function renderAlbumProject() {
  const project = albumProjectById(state.albumProjectId);
  if (!project) {
    navigate("albums");
    return;
  }
  title.textContent = project.schoolName;
  const classes = albumClassesByProject(project.id);
  view.innerHTML = `
    <section class="toolbar">
      <div>
        <h2 class="card-title">${escapeHtml(project.schoolName)}</h2>
        <p class="muted">Классы выпускных альбомов</p>
      </div>
      <div class="row">
        <button class="secondary-button" data-back-to-albums type="button">Назад</button>
        <button class="primary-button" data-add-album-class="${project.id}" type="button">Класс</button>
      </div>
    </section>
    <section class="grid project-grid">
      ${classes.map(albumClassCard).join("") || empty("Добавьте первый класс")}
    </section>
  `;
  bindViewActions();
}

function albumClassCard(klass) {
  const stats = albumClassStats(klass.id);
  return `
    <article class="card card-button" data-open-album-class="${klass.id}" tabindex="0">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHtml(klass.name)}</h2>
          <p class="muted">${albumTypeLabel(klass.albumType)} · ${klass.pagesCount || 0} страниц</p>
        </div>
        <div class="row">
          <span class="status-pill ${albumStatusClass(klass.status)}">${albumClassStatusLabel(klass.status)}</span>
          <button class="icon-button danger-icon" data-delete-album-class="${klass.id}" type="button" title="Удалить класс"><span data-icon="trash"></span></button>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><strong>${stats.students}</strong><span class="muted">учеников</span></div>
        <div class="stat"><strong>${stats.portraits}/${stats.students}</strong><span class="muted">портреты</span></div>
        <div class="stat"><strong>${stats.readyPercent}%</strong><span class="muted">готовность</span></div>
      </div>
      <div class="progress"><span style="width:${stats.readyPercent}%"></span></div>
    </article>
  `;
}

function renderAlbumClass() {
  const klass = albumClassById(state.albumClassId);
  if (!klass) {
    navigate("albums");
    return;
  }
  const project = albumProjectById(klass.albumProjectId);
  const tab = state.albumTab || "students";
  const stats = albumClassStats(klass.id);
  title.textContent = klass.name;
  view.innerHTML = `
    <section class="album-class-head">
      <div class="toolbar">
        <div>
          <h2 class="card-title">${escapeHtml(klass.name)}</h2>
          <p class="muted">${albumTypeLabel(klass.albumType)} · ${klass.pagesCount || 0} страниц · ${escapeHtml(project?.schoolName || "")}</p>
        </div>
        <div class="row">
          <button class="secondary-button" data-back-to-album-project="${klass.albumProjectId}" type="button">Назад</button>
          <button class="secondary-button" data-edit-album-class="${klass.id}" type="button">Изменить</button>
        </div>
      </div>
      <div class="stats album-stats">
        <div class="stat"><strong>${stats.students}</strong><span class="muted">Ученики</span></div>
        <div class="stat"><strong>${stats.portraits}/${stats.students}</strong><span class="muted">Портреты</span></div>
        <div class="stat"><strong>${stats.videos}</strong><span class="muted">Видео</span></div>
        <div class="stat"><strong>${stats.teachers}</strong><span class="muted">Учителя</span></div>
        <div class="stat"><strong>${stats.groups}</strong><span class="muted">Общие фото</span></div>
        <div class="stat"><strong>${stats.readyPercent}%</strong><span class="muted">Готовность</span></div>
      </div>
      <div class="progress"><span style="width:${stats.readyPercent}%"></span></div>
      <div class="chip-row album-tabs">
        ${albumTabButton("students", "Ученики", tab)}
        ${albumTabButton("groups", "Общие фото", tab)}
        ${albumTabButton("teachers", "Учителя", tab)}
        ${albumTabButton("export", "Экспорт", tab)}
      </div>
    </section>
    ${albumTabContent(klass, tab)}
  `;
  bindViewActions();
}

function albumTabButton(key, label, active) {
  return `<button class="chip ${key === active ? "active" : ""}" data-album-tab="${key}" type="button">${label}</button>`;
}

function albumTabContent(klass, tab) {
  if (tab === "groups") return albumGroupsTab(klass);
  if (tab === "teachers") return albumTeachersTab(klass);
  if (tab === "export") return albumExportTab(klass);
  return albumStudentsTab(klass);
}

function albumStudentsTab(klass) {
  const students = albumStudentsByClass(klass.id);
  return `
    <section class="toolbar">
      <h2 class="card-title">Ученики</h2>
      <button class="primary-button" data-add-album-student="${klass.id}" type="button">Ученик</button>
    </section>
    <section class="grid project-grid">
      ${students.map(albumStudentCard).join("") || empty("Добавьте учеников для альбома")}
    </section>
  `;
}

function albumStudentCard(student) {
  const portrait = albumMediaById(student.portraitMediaId);
  const video = albumMediaById(student.videoMediaId);
  return `
    <article class="student-card">
      <div class="student-line">
        <div>
          <h3>${escapeHtml(student.lastName)} ${escapeHtml(student.firstName)}</h3>
          <p class="muted">Портрет: ${portrait ? "OK" : "-"} · Видео: ${video ? "OK" : "-"} · Статус: ${albumStudentStatusLabel(student.status)}</p>
        </div>
        <span class="status-pill ${albumStatusClass(student.status)}">${albumStudentStatusLabel(student.status)}</span>
      </div>
      ${student.comment ? `<p class="muted">${escapeHtml(student.comment)}</p>` : ""}
      <div class="toolbar">
        <button class="secondary-button compact" data-album-media="student:${student.id}:portrait" type="button">Добавить портрет</button>
        <button class="secondary-button compact" data-album-media="student:${student.id}:video" type="button">Добавить видео</button>
        <button class="secondary-button compact" data-edit-album-student="${student.id}" type="button">Изменить данные</button>
        <button class="danger-button compact" data-delete-album-student="${student.id}" type="button">Удалить</button>
      </div>
    </article>
  `;
}

function albumGroupsTab(klass) {
  const items = albumGroupsByClass(klass.id);
  return `
    <section class="toolbar">
      <h2 class="card-title">Общие фото</h2>
      <button class="primary-button" data-add-album-group="${klass.id}" type="button">Общее фото</button>
    </section>
    <section class="grid project-grid">
      ${items.map(albumGroupCard).join("") || empty("Добавьте фото, которые относятся ко всему классу")}
    </section>
  `;
}

function albumGroupCard(item) {
  const media = albumMediaById(item.mediaId);
  const video = albumMediaById(item.videoMediaId);
  return `
    <article class="student-card">
      <div class="student-line">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p class="muted">${albumGroupTypeLabel(item.type)} · Фото: ${media ? "OK" : "-"} · Видео: ${video ? "OK" : "-"}</p>
        </div>
        <span class="status-pill in-progress">${albumGroupTypeLabel(item.type)}</span>
      </div>
      ${item.comment ? `<p class="muted">${escapeHtml(item.comment)}</p>` : ""}
      <div class="toolbar">
        <button class="secondary-button compact" data-album-media="group:${item.id}:image" type="button">Добавить фото</button>
        <button class="secondary-button compact" data-album-media="group:${item.id}:video" type="button">Добавить видео</button>
        <button class="secondary-button compact" data-edit-album-group="${item.id}" type="button">Изменить</button>
        <button class="danger-button compact" data-delete-album-group="${item.id}" type="button">Удалить</button>
      </div>
    </article>
  `;
}

function albumTeachersTab(klass) {
  const teachers = albumTeachersByClass(klass.id);
  return `
    <section class="toolbar">
      <h2 class="card-title">Учителя</h2>
      <button class="primary-button" data-add-album-teacher="${klass.id}" type="button">Учитель</button>
    </section>
    <section class="grid project-grid">
      ${teachers.map(albumTeacherCard).join("") || empty("Добавьте классного руководителя, директора или сотрудников")}
    </section>
  `;
}

function albumTeacherCard(teacher) {
  const portrait = albumMediaById(teacher.portraitMediaId);
  const video = albumMediaById(teacher.videoMediaId);
  return `
    <article class="student-card">
      <div class="student-line">
        <div>
          <h3>${escapeHtml(teacher.fullName)}</h3>
          <p class="muted">${escapeHtml(teacher.role || "Учитель")} · Фото: ${portrait ? "OK" : "-"} · Видео: ${video ? "OK" : "-"}</p>
        </div>
      </div>
      ${teacher.comment ? `<p class="muted">${escapeHtml(teacher.comment)}</p>` : ""}
      <div class="toolbar">
        <button class="secondary-button compact" data-album-media="teacher:${teacher.id}:portrait" type="button">Добавить фото</button>
        <button class="secondary-button compact" data-album-media="teacher:${teacher.id}:video" type="button">Добавить видео</button>
        <button class="secondary-button compact" data-edit-album-teacher="${teacher.id}" type="button">Изменить</button>
        <button class="danger-button compact" data-delete-album-teacher="${teacher.id}" type="button">Удалить</button>
      </div>
    </article>
  `;
}

function albumExportTab(klass) {
  return `
    <section class="grid">
      <article class="panel grid">
        <div>
          <h2 class="card-title">Экспорт дизайнеру</h2>
          <p class="muted">ZIP содержит учеников, общие фото, учителей, видео и JSON-метаданные.</p>
        </div>
        <div class="toolbar">
          <button class="primary-button" data-export-album-class="${klass.id}" type="button">Экспорт ZIP</button>
          <button class="secondary-button" data-import-album-zip type="button">Импорт ZIP</button>
        </div>
      </article>
    </section>
  `;
}

function studentQuickForm(classId) {
  const klass = classById(classId);
  if (!klass) return "";
  const selectedCatalogId = state.data.catalog[0]?.id || "";
  return `
    <form class="panel grid quick-student-form" data-student-form="${classId}">
      <div class="card-header">
        <div>
          <h2 class="card-title">Добавить ученика: ${escapeHtml(klass.name)}</h2>
          <p class="muted">Сохраните и сразу продолжайте ввод следующего ученика.</p>
        </div>
        <button class="icon-button" data-cancel-student-form type="button" title="Закрыть"><span data-icon="close"></span></button>
      </div>
      <div class="form-grid">
        <label class="field-label">
          <span>ФИО</span>
          <input class="input" name="fio" placeholder="Иванов Иван" required autocomplete="off" />
        </label>
        <label class="field-label">
          <span>Заказ / услуга</span>
          <select class="select" name="catalogId">
            ${state.data.catalog.map((item) => `<option value="${item.id}" ${item.id === selectedCatalogId ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}
          </select>
        </label>
        <label class="field-label">
          <span>Оплата</span>
          <select class="select" name="paymentStatus">
            <option value="unpaid">Не оплачено</option>
            <option value="paid">Оплачено</option>
          </select>
        </label>
        <label class="field-label">
          <span>Статус заказа</span>
          <select class="select" name="orderStatus">
            ${Object.entries(ORDER_STATUSES).map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="toolbar">
        <button class="secondary-button" name="saveMode" value="open" type="submit">Сохранить и открыть</button>
        <button class="primary-button" name="saveMode" value="next" type="submit">Сохранить и следующий</button>
      </div>
    </form>
  `;
}

function renderStudent() {
  const student = studentById(state.studentId);
  if (!student) {
    navigate("search");
    return;
  }
  const klass = classById(student.classId);
  const project = projectById(klass?.projectId);
  const order = orderByStudent(student.id);
  const media = mediaByStudent(student.id);
  const activeTask = order.items.find((item) => item.status !== "done") || order.items[0];
  const selectedCatalogId = student.catalogId || state.data.catalog[0]?.id || "";
  const selectedCatalogTitle = catalogItemById(selectedCatalogId)?.title || "Заказ не выбран";
  title.textContent = `${student.firstName} ${student.lastName}`;
  view.innerHTML = `
    <section class="split">
      <div class="grid">
        <article class="panel">
          <div class="card-header">
            <div>
              <h2 class="card-title">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</h2>
              <p class="muted student-order-summary">Заказ: ${escapeHtml(selectedCatalogTitle)}</p>
            </div>
            <div class="row">
              <button class="secondary-button compact" data-back-from-student type="button">Назад</button>
              <span class="status-pill ${orderStatusClass(student)}">${orderStatusLabel(student)}</span>
              <span class="status-pill ${student.paymentStatus}">${paymentLabel(student.paymentStatus)}</span>
            </div>
          </div>
          <div class="action-grid">
            <button class="action-button" data-capture="photo" data-order-type="${activeTask?.type || "portrait"}" type="button"><span data-icon="camera"></span>Фото</button>
            <button class="action-button" data-capture="video" data-order-type="${activeTask?.type || "video"}" type="button"><span data-icon="video"></span>Видео</button>
            <button class="action-button secondary" data-done-task="${activeTask?.type || ""}" type="button"><span data-icon="check"></span>Готово</button>
          </div>
        </article>
        <article class="panel">
          <div class="card-header">
            <h2 class="card-title">Чеклист</h2>
            <button class="secondary-button compact" data-reset-order="${student.id}" type="button">Сброс</button>
          </div>
          <div class="task-list">
            ${order.items.map((item) => taskRow(item, student.id)).join("")}
          </div>
        </article>
        <article class="panel">
          <div class="card-header">
            <h2 class="card-title">Медиа</h2>
            <button class="secondary-button" data-export-student="${student.id}" type="button">Экспорт</button>
          </div>
          <div class="media-grid">
            ${media.map(mediaTile).join("") || '<p class="muted">Фото и видео появятся здесь.</p>'}
          </div>
        </article>
      </div>
      <aside class="panel grid">
        <h2 class="card-title">Заказ</h2>
        <p class="muted">${escapeHtml(project?.name || "")}${project && klass ? " · " : ""}${escapeHtml(klass?.name || "")}</p>
        <label class="field-label">
          <span>Заказ / услуга</span>
          <select class="select" data-student-catalog="${student.id}">
            ${state.data.catalog.map((item) => `<option value="${item.id}" ${item.id === selectedCatalogId ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("")}
          </select>
        </label>
        <label class="field-label">
          <span>Статус заказа</span>
          <select class="select" data-order-status="${student.id}">
            ${Object.entries(ORDER_STATUSES).map(([value, label]) => `<option value="${value}" ${value === currentOrderStatus(student) ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
          </select>
        </label>
        <button class="${student.paymentStatus === "paid" ? "secondary-button" : "primary-button"}" data-toggle-payment="${student.id}" type="button">
          ${student.paymentStatus === "paid" ? "Отметить как не оплачено" : "Оплачено"}
        </button>
        <button class="secondary-button" data-edit-student="${student.id}" type="button">Редактировать ученика</button>
        <button class="secondary-button" data-generate-qr="${student.id}" type="button">Показать QR-код</button>
        <button class="danger-button" data-delete-student="${student.id}" type="button">Удалить ученика</button>
      </aside>
    </section>
  `;
  bindViewActions();
}

function taskRow(item, studentId) {
  const angle = catalogAngleForStudent(studentId, item.type);
  const reference = angle?.refDataUrl
    ? `<img class="reference-thumb" src="${angle.refDataUrl}" alt="${escapeAttr(angle.name)}" />`
    : '<div class="reference-empty">Референс</div>';
  return `
    <div class="task-row ${item.status === "done" ? "done" : ""}">
      <div class="task-main">
          ${reference}
        <div>
          <strong>${escapeHtml(orderItemLabel(item))}</strong>
          <p class="muted">${item.fileIds.length} файлов${angle?.details ? ` · ${escapeHtml(angle.details)}` : ""}</p>
        </div>
      </div>
      <button class="${item.status === "done" ? "secondary-button" : "primary-button"} compact" data-toggle-task="${studentId}:${item.type}" type="button">
        ${item.status === "done" ? "Готово" : "Ожидает"}
      </button>
    </div>
  `;
}

function queueList(order) {
  const pending = order.items.filter((item) => item.status !== "done");
  if (!pending.length) return '<p class="status-pill paid">Чеклист закрыт</p>';
  return pending.map((item, index) => `
    <div class="task-row">
      <strong>${index + 1}. ${escapeHtml(orderItemLabel(item))}</strong>
      <span class="muted">ожидает</span>
    </div>
  `).join("");
}

function mediaTile(item) {
  const url = URL.createObjectURL(item.blob);
  const node = item.type === "video"
    ? `<video src="${url}" controls muted></video>`
    : `<img src="${url}" alt="${escapeAttr(item.fileName)}" loading="lazy" />`;
  return `<figure class="media-tile">${node}<p>${escapeHtml(item.fileName)}</p></figure>`;
}

function renderCatalog() {
  title.textContent = "Каталог";
  const catalog = state.data.catalog;
  view.innerHTML = `
    <section class="toolbar">
      <div>
        <h2 class="card-title">Услуги и ракурсы</h2>
        <p class="muted">Настройте заказы, цену, требования и референсы для съемки.</p>
      </div>
      <button class="primary-button" data-add-catalog type="button">Добавить услугу</button>
    </section>
    <section class="grid">
      ${catalog.map(catalogCard).join("") || empty("Добавьте первую услугу для съемки")}
    </section>
  `;
  bindViewActions();
}

function catalogCard(item) {
  return `
    <article class="panel grid">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHtml(item.title)}</h2>
          <p class="muted">${mediaKindLabel(item.mediaKind)} · ${escapeHtml(formatPrice(item.price))}</p>
        </div>
        <div class="row">
          <button class="secondary-button compact" data-edit-catalog="${item.id}" type="button">Изменить</button>
          <button class="secondary-button compact" data-duplicate-catalog="${item.id}" type="button">Дублировать</button>
          <button class="danger-button compact" data-delete-catalog="${item.id}" type="button">Удалить</button>
        </div>
      </div>
      <div class="catalog-details">
        <p><strong>Заказ:</strong> ${escapeHtml(item.orderInfo || "Не заполнено")}</p>
        <p><strong>Что нужно:</strong> ${escapeHtml(item.requirements || "Не заполнено")}</p>
      </div>
      <div class="task-list">
        ${(item.angles || []).map((angle) => catalogAngleRow(item, angle)).join("") || '<p class="muted">Ракурсы пока не добавлены.</p>'}
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-add-angle="${item.id}" type="button">Добавить ракурс</button>
        <button class="secondary-button" data-generate-references="${item.id}" type="button">AI-референсы</button>
        <button class="primary-button" data-apply-template="${item.id}" type="button">Использовать в чеклисте</button>
      </div>
    </article>
  `;
}

function catalogAngleRow(item, angle) {
  const reference = angle.refDataUrl
    ? `<img class="reference-thumb large" src="${angle.refDataUrl}" alt="${escapeAttr(angle.name)}" />`
    : '<div class="reference-empty large">Нет фото</div>';
  return `
    <div class="task-row">
      <div class="task-main">
        ${reference}
        <div>
          <strong>${escapeHtml(angle.name)}</strong>
          <p class="muted">${escapeHtml(angle.details || "Описание ракурса не заполнено")}</p>
        </div>
      </div>
      <div class="row">
        <button class="secondary-button compact" data-upload-reference="${item.id}:${angle.id}" type="button">Референс</button>
        <button class="secondary-button compact" data-edit-angle="${item.id}:${angle.id}" type="button">Изменить</button>
        <button class="danger-button compact" data-delete-angle="${item.id}:${angle.id}" type="button">Удалить</button>
      </div>
    </div>
  `;
}

function renderSettings() {
  title.textContent = "Настройки";
  const template = state.data.templates[0] || { id: uid("template"), name: "Чеклист", items: Object.keys(ORDER_TYPES) };
  const items = templateItemsForSettings(template);
  const exportTemplate = getStatusExportTemplate();
  view.innerHTML = `
    <section class="grid">
      <article class="panel grid">
        <div class="card-header">
          <div>
            <h2 class="card-title">Шаблон чеклиста</h2>
            <p class="muted">Эти пункты будут у каждого заказа ученика.</p>
          </div>
          <button class="secondary-button compact" data-add-template-item type="button">Добавить</button>
        </div>
        <input class="input" data-template-name value="${escapeAttr(template.name)}" placeholder="Название шаблона" />
        <div class="checklist-editor" data-template-items>
          ${items.map((item) => templateEditorRow(item)).join("")}
        </div>
        <button class="primary-button" data-save-template="${template.id}" type="button">Сохранить и применить ко всем заказам</button>
      </article>
      <article class="panel grid">
        <div>
          <h2 class="card-title">Шаблон PDF статусов</h2>
          <p class="muted">Выберите, какие колонки попадут в таблицу по классам.</p>
        </div>
        <label class="field-label">
          <span>Заголовок отчета</span>
          <input class="input" data-status-export-title value="${escapeAttr(exportTemplate.title)}" />
        </label>
        <div class="export-column-grid">
          ${statusExportColumns().map((column) => `
            <label class="checkbox-row">
              <input type="checkbox" data-status-export-column="${column.key}" ${exportTemplate.columns.includes(column.key) ? "checked" : ""} />
              <span>${escapeHtml(column.label)}</span>
            </label>
          `).join("")}
        </div>
        <button class="primary-button" data-save-status-export-template type="button">Сохранить шаблон PDF</button>
      </article>
      <article class="panel grid">
        <h2 class="card-title">Импорт / экспорт</h2>
        <div class="toolbar">
          <button class="secondary-button" data-import-zip type="button">Импорт ZIP</button>
          <button class="primary-button" data-action="export-all" type="button">Экспорт ZIP</button>
        </div>
      </article>
      <article class="panel grid">
        <h2 class="card-title">Демо-данные</h2>
        <button class="danger-button" data-reset-demo type="button">Очистить и создать демо</button>
      </article>
    </section>
  `;
  bindViewActions();
}

function studentCard(student) {
  const klass = classById(student.classId);
  const project = projectById(klass?.projectId);
  const c = completion(student.id);
  return `
    <article class="student-card card-button" data-open-student="${student.id}" tabindex="0">
      <div class="student-line">
        <div>
          <h3>${escapeHtml(student.lastName)} ${escapeHtml(student.firstName)}</h3>
          <p class="muted">${escapeHtml(project?.name || "")} · ${escapeHtml(klass?.name || "")}</p>
        </div>
      <div class="row">
          <span class="status-pill ${orderStatusClass(student)}">${orderStatusLabel(student)}</span>
          <span class="status-pill ${student.paymentStatus}">${paymentLabel(student.paymentStatus)}</span>
          <button class="icon-button danger-icon" data-delete-student="${student.id}" type="button" title="Удалить ученика"><span data-icon="trash"></span></button>
        </div>
      </div>
      <div class="progress"><span style="width:${c.percent}%"></span></div>
      <p class="muted">${c.doneCount}/${c.total} задач · ${statusLabel(student)}</p>
    </article>
  `;
}

function templateEditorRow(item) {
  return `
    <div class="template-item-row">
      <input class="input" data-template-item value="${escapeAttr(item.label)}" placeholder="Например: Photoshop" />
      <button class="icon-button danger-icon" data-remove-template-item type="button" title="Удалить пункт"><span data-icon="trash"></span></button>
    </div>
  `;
}

function bindViewActions() {
  injectIcons();
  view.querySelectorAll("[data-open-project]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      navigate("classes", { projectId: node.dataset.openProject });
    });
  });
  view.querySelectorAll("[data-add-class]").forEach((node) => node.addEventListener("click", () => addClass(node.dataset.addClass)));
  view.querySelectorAll("[data-add-student]").forEach((node) => node.addEventListener("click", () => showStudentForm(node.dataset.addStudent)));
  view.querySelectorAll("[data-delete-project]").forEach((node) => node.addEventListener("click", () => deleteProject(node.dataset.deleteProject)));
  view.querySelectorAll("[data-delete-class]").forEach((node) => node.addEventListener("click", () => deleteClass(node.dataset.deleteClass)));
  view.querySelectorAll("[data-delete-student]").forEach((node) => node.addEventListener("click", () => deleteStudent(node.dataset.deleteStudent)));
  view.querySelector("[data-student-form]")?.addEventListener("submit", handleStudentFormSubmit);
  view.querySelector("[data-cancel-student-form]")?.addEventListener("click", () => {
    state.classId = null;
    renderClasses();
  });
  view.querySelectorAll("[data-open-student]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      navigate("student", { studentId: node.dataset.openStudent });
    });
    node.addEventListener("keydown", (event) => {
      if (event.target.closest("button")) return;
      if (event.key === "Enter" || event.key === " ") navigate("student", { studentId: node.dataset.openStudent });
    });
  });
  view.querySelectorAll("[data-filter]").forEach((node) => node.addEventListener("click", () => {
    state.filter = node.dataset.filter;
    render();
  }));
  view.querySelector("[data-project-select]")?.addEventListener("change", (event) => navigate("classes", { projectId: event.target.value }));
  view.querySelectorAll("[data-capture]").forEach((node) => node.addEventListener("click", () => captureMedia(node.dataset.capture, node.dataset.orderType)));
  view.querySelectorAll("[data-done-task]").forEach((node) => node.addEventListener("click", () => markTaskDone(state.studentId, node.dataset.doneTask)));
  view.querySelectorAll("[data-toggle-task]").forEach((node) => node.addEventListener("click", () => {
    const [studentId, type] = node.dataset.toggleTask.split(":");
    toggleTask(studentId, type);
  }));
  view.querySelector("[data-toggle-payment]")?.addEventListener("click", (event) => togglePayment(event.currentTarget.dataset.togglePayment));
  view.querySelector("[data-back-from-student]")?.addEventListener("click", navigateBackFromStudent);
  view.querySelector("[data-edit-student]")?.addEventListener("click", (event) => editStudent(event.currentTarget.dataset.editStudent));
  view.querySelector("[data-student-catalog]")?.addEventListener("change", (event) => updateStudentCatalog(event.target.dataset.studentCatalog, event.target.value));
  view.querySelector("[data-order-status]")?.addEventListener("change", (event) => updateOrderStatus(event.target.dataset.orderStatus, event.target.value));
  view.querySelector("[data-payment]")?.addEventListener("change", (event) => updatePayment(event.target.dataset.payment, event.target.value));
  view.querySelector("[data-manual-qr]")?.addEventListener("submit", handleManualQr);
  view.querySelector("[data-start-scan]")?.addEventListener("click", startQrScanner);
  view.querySelector("[data-import-shoot]")?.addEventListener("click", () => shootImportInput.click());
  view.querySelector("[data-stop-scan]")?.addEventListener("click", stopQrStream);
  view.querySelector("[data-import-zip]")?.addEventListener("click", () => zipInput.click());
  view.querySelectorAll("[data-action='export-all']").forEach((node) => node.addEventListener("click", () => exportZip()));
  view.querySelectorAll("[data-export-student]").forEach((node) => node.addEventListener("click", () => exportZip(node.dataset.exportStudent)));
  view.querySelectorAll("[data-export-status-class]").forEach((node) => node.addEventListener("click", () => exportStatusPdf({ classId: node.dataset.exportStatusClass })));
  view.querySelectorAll("[data-export-status-project]").forEach((node) => node.addEventListener("click", () => exportStatusPdf({ projectId: node.dataset.exportStatusProject })));
  view.querySelector("[data-save-template]")?.addEventListener("click", saveTemplate);
  view.querySelector("[data-save-status-export-template]")?.addEventListener("click", saveStatusExportTemplate);
  view.querySelector("[data-add-template-item]")?.addEventListener("click", addTemplateEditorItem);
  view.querySelectorAll("[data-remove-template-item]").forEach((node) => node.addEventListener("click", () => {
    node.closest(".template-item-row")?.remove();
  }));
  view.querySelector("[data-reset-demo]")?.addEventListener("click", resetDemo);
  view.querySelector("[data-reset-order]")?.addEventListener("click", () => resetOrder(state.studentId));
  view.querySelector("[data-generate-qr]")?.addEventListener("click", () => showQrPayload(state.studentId));
  view.querySelector("[data-add-catalog]")?.addEventListener("click", addCatalogItem);
  view.querySelectorAll("[data-edit-catalog]").forEach((node) => node.addEventListener("click", () => editCatalogItem(node.dataset.editCatalog)));
  view.querySelectorAll("[data-duplicate-catalog]").forEach((node) => node.addEventListener("click", () => duplicateCatalogItem(node.dataset.duplicateCatalog)));
  view.querySelectorAll("[data-delete-catalog]").forEach((node) => node.addEventListener("click", () => deleteCatalogItem(node.dataset.deleteCatalog)));
  view.querySelectorAll("[data-add-angle]").forEach((node) => node.addEventListener("click", () => addCatalogAngle(node.dataset.addAngle)));
  view.querySelectorAll("[data-edit-angle]").forEach((node) => node.addEventListener("click", () => {
    const [itemId, angleId] = node.dataset.editAngle.split(":");
    editCatalogAngle(itemId, angleId);
  }));
  view.querySelectorAll("[data-delete-angle]").forEach((node) => node.addEventListener("click", () => {
    const [itemId, angleId] = node.dataset.deleteAngle.split(":");
    deleteCatalogAngle(itemId, angleId);
  }));
  view.querySelectorAll("[data-upload-reference]").forEach((node) => node.addEventListener("click", () => {
    const [itemId, angleId] = node.dataset.uploadReference.split(":");
    uploadReference(itemId, angleId);
  }));
  view.querySelectorAll("[data-generate-references]").forEach((node) => node.addEventListener("click", () => generateReferenceSet(node.dataset.generateReferences)));
  view.querySelectorAll("[data-apply-template]").forEach((node) => node.addEventListener("click", () => applyCatalogAsTemplate(node.dataset.applyTemplate)));
  view.querySelector("[data-add-album-project]")?.addEventListener("click", addAlbumProject);
  view.querySelectorAll("[data-open-album-project]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      navigate("albumProject", { albumProjectId: node.dataset.openAlbumProject });
    });
  });
  view.querySelectorAll("[data-add-album-class]").forEach((node) => node.addEventListener("click", () => addAlbumClass(node.dataset.addAlbumClass)));
  view.querySelectorAll("[data-delete-album-project]").forEach((node) => node.addEventListener("click", () => deleteAlbumProject(node.dataset.deleteAlbumProject)));
  view.querySelectorAll("[data-open-album-class]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      navigate("albumClass", { albumClassId: node.dataset.openAlbumClass, albumTab: "students" });
    });
  });
  view.querySelectorAll("[data-delete-album-class]").forEach((node) => node.addEventListener("click", () => deleteAlbumClass(node.dataset.deleteAlbumClass)));
  view.querySelector("[data-back-to-albums]")?.addEventListener("click", () => navigate("albums"));
  view.querySelectorAll("[data-back-to-album-project]").forEach((node) => node.addEventListener("click", () => navigate("albumProject", { albumProjectId: node.dataset.backToAlbumProject })));
  view.querySelectorAll("[data-edit-album-class]").forEach((node) => node.addEventListener("click", () => editAlbumClass(node.dataset.editAlbumClass)));
  view.querySelectorAll("[data-album-tab]").forEach((node) => node.addEventListener("click", () => {
    state.albumTab = node.dataset.albumTab;
    renderAlbumClass();
  }));
  view.querySelectorAll("[data-add-album-student]").forEach((node) => node.addEventListener("click", () => addAlbumStudent(node.dataset.addAlbumStudent)));
  view.querySelectorAll("[data-edit-album-student]").forEach((node) => node.addEventListener("click", () => editAlbumStudent(node.dataset.editAlbumStudent)));
  view.querySelectorAll("[data-delete-album-student]").forEach((node) => node.addEventListener("click", () => deleteAlbumStudent(node.dataset.deleteAlbumStudent)));
  view.querySelectorAll("[data-add-album-group]").forEach((node) => node.addEventListener("click", () => addAlbumGroup(node.dataset.addAlbumGroup)));
  view.querySelectorAll("[data-edit-album-group]").forEach((node) => node.addEventListener("click", () => editAlbumGroup(node.dataset.editAlbumGroup)));
  view.querySelectorAll("[data-delete-album-group]").forEach((node) => node.addEventListener("click", () => deleteAlbumGroup(node.dataset.deleteAlbumGroup)));
  view.querySelectorAll("[data-add-album-teacher]").forEach((node) => node.addEventListener("click", () => addAlbumTeacher(node.dataset.addAlbumTeacher)));
  view.querySelectorAll("[data-edit-album-teacher]").forEach((node) => node.addEventListener("click", () => editAlbumTeacher(node.dataset.editAlbumTeacher)));
  view.querySelectorAll("[data-delete-album-teacher]").forEach((node) => node.addEventListener("click", () => deleteAlbumTeacher(node.dataset.deleteAlbumTeacher)));
  view.querySelectorAll("[data-album-media]").forEach((node) => node.addEventListener("click", () => selectAlbumMedia(node.dataset.albumMedia)));
  view.querySelectorAll("[data-export-album-class]").forEach((node) => node.addEventListener("click", () => exportAlbumClassZip(node.dataset.exportAlbumClass)));
  view.querySelector("[data-import-album-zip]")?.addEventListener("click", () => albumZipInput.click());
}

async function addProject() {
  const name = prompt("Название школы / проекта");
  if (!name) return;
  await put("projects", { id: uid("project"), name: name.trim(), createdAt: now(), templateId: state.data.templates[0]?.id });
  await refreshData();
  navigate("home");
}

async function addClass(projectId) {
  if (!projectId) return notify("Сначала создайте проект.");
  const name = prompt("Название класса");
  if (!name) return;
  await put("classes", { id: uid("class"), projectId, name: name.trim() });
  await refreshData();
  navigate("classes", { projectId });
}

function showStudentForm(classId) {
  state.classId = classId;
  renderClasses();
  requestAnimationFrame(() => view.querySelector("[data-student-form] input[name='fio']")?.focus());
}

async function handleStudentFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitter = event.submitter;
  const student = await addStudent({
    classId: form.dataset.studentForm,
    fio: new FormData(form).get("fio"),
    catalogId: new FormData(form).get("catalogId"),
    paymentStatus: new FormData(form).get("paymentStatus"),
    orderStatus: new FormData(form).get("orderStatus")
  });
  if (!student) return;
  if (submitter?.value === "open") {
    state.classId = null;
    navigate("student", { studentId: student.id });
    return;
  }
  await refreshData();
  notify("Ученик сохранен.");
  renderClasses();
  requestAnimationFrame(() => view.querySelector("[data-student-form] input[name='fio']")?.focus());
}

async function addStudent({ classId, fio, catalogId = "", paymentStatus = "unpaid", orderStatus = "not_started" }) {
  if (!classId) return null;
  if (!String(fio || "").trim()) {
    notify("Введите ФИО ученика.");
    return null;
  }
  const { firstName, lastName } = splitFullName(fio);
  const selectedCatalogId = catalogId || state.data.catalog[0]?.id || "";
  const id = uid("student");
  const student = { id, classId, firstName, lastName, qrId: id, catalogId: selectedCatalogId, paymentStatus, orderStatus, status: "not_started" };
  await put("students", student);
  await put("orders", { id: `order_${id}`, studentId: id, catalogId: selectedCatalogId, status: orderStatus, items: orderItemsFromCatalog(selectedCatalogId) });
  return student;
}

async function editStudent(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  const fio = prompt("ФИО ученика", `${student.lastName} ${student.firstName}`.trim());
  if (!fio) return;
  const { firstName, lastName } = splitFullName(fio);
  await put("students", { ...student, firstName, lastName });
  await refreshData();
  renderStudent();
}

async function deleteProject(projectId) {
  const project = projectById(projectId);
  if (!project) return;
  const classes = classesByProject(projectId);
  const students = classes.flatMap((klass) => state.data.students.filter((student) => student.classId === klass.id));
  if (!confirm(`Удалить проект "${project.name}" вместе с ${classes.length} классами и ${students.length} учениками?`)) return;
  for (const student of students) await deleteStudentRecords(student.id);
  for (const klass of classes) await del("classes", klass.id);
  await del("projects", projectId);
  await refreshData();
  notify("Проект удален.");
  navigate("home");
}

async function deleteClass(classId) {
  const klass = classById(classId);
  if (!klass) return;
  const students = state.data.students.filter((student) => student.classId === classId);
  if (!confirm(`Удалить класс "${klass.name}" вместе с ${students.length} учениками?`)) return;
  for (const student of students) await deleteStudentRecords(student.id);
  await del("classes", classId);
  await refreshData();
  notify("Класс удален.");
  navigate("classes", { projectId: klass.projectId });
}

async function deleteStudent(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  const fullName = `${student.lastName} ${student.firstName}`.trim();
  if (!confirm(`Удалить ученика "${fullName}" вместе с заказом и медиа?`)) return;
  await deleteStudentRecords(studentId);
  await refreshData();
  notify("Ученик удален.");
  if (state.route === "student") {
    navigate("classes", { projectId: classById(student.classId)?.projectId });
  } else {
    render();
  }
}

async function deleteStudentRecords(studentId) {
  for (const item of state.data.media.filter((media) => media.studentId === studentId)) await del("media", item.id);
  for (const order of state.data.orders.filter((entry) => entry.studentId === studentId)) await del("orders", order.id);
  await del("students", studentId);
}

async function updateStudentCatalog(studentId, catalogId) {
  const student = studentById(studentId);
  const catalog = catalogItemById(catalogId);
  if (!student || !catalog) return;
  const order = orderByStudent(studentId);
  const nextTypes = catalogAngleTypes(catalog);
  const labels = Object.fromEntries((catalog.angles || []).map((angle) => [angle.id, angle.name]));
  await put("students", { ...student, catalogId });
  await put("orders", { ...order, catalogId, items: mergeOrderItems(order.items || [], nextTypes, labels) });
  await refreshData();
  notify("Заказ и ракурсы ученика обновлены.");
  renderStudent();
}

async function addCatalogItem() {
  const title = prompt("Название услуги / пакета");
  if (!title) return;
  const mediaKind = normalizeMediaKind(prompt("Тип: фото, видео или оба", "оба"));
  const price = prompt("Цена", "0") || "";
  const orderInfo = prompt("Информация про заказ", "") || "";
  const requirements = prompt("Что нужно для реализации", "") || "";
  await put("catalog", { id: uid("catalog"), title: title.trim(), mediaKind, price: price.trim(), orderInfo: orderInfo.trim(), requirements: requirements.trim(), angles: [] });
  await refreshData();
  renderCatalog();
}

async function addAlbumProject() {
  const schoolName = prompt("Название школы");
  if (!schoolName?.trim()) return;
  const project = { id: uid("album_project"), schoolName: schoolName.trim(), createdAt: now() };
  await put("albumProjects", project);
  await refreshData();
  navigate("albumProject", { albumProjectId: project.id });
}

async function deleteAlbumProject(projectId) {
  const project = albumProjectById(projectId);
  if (!project || !confirm(`Удалить школу "${project.schoolName}" вместе со всеми альбомными классами?`)) return;
  for (const klass of albumClassesByProject(projectId)) await deleteAlbumClassRecords(klass.id);
  await del("albumProjects", projectId);
  await refreshData();
  navigate("albums");
}

async function addAlbumClass(albumProjectId) {
  const project = albumProjectById(albumProjectId);
  if (!project) return;
  const name = prompt("Название класса", "11А");
  if (!name?.trim()) return;
  const albumType = normalizeAlbumType(prompt("Тип альбома: budget, standard, premium или custom", "standard"));
  const pagesCount = Math.max(0, Number.parseInt(prompt("Количество страниц", "20") || "20", 10) || 0);
  const klass = {
    id: uid("album_class"),
    albumProjectId,
    name: name.trim(),
    albumType,
    pagesCount,
    status: "not_started",
    createdAt: now()
  };
  await put("albumClasses", klass);
  await refreshData();
  navigate("albumClass", { albumClassId: klass.id, albumTab: "students" });
}

async function editAlbumClass(classId) {
  const klass = albumClassById(classId);
  if (!klass) return;
  const name = prompt("Название класса", klass.name);
  if (!name?.trim()) return;
  const albumType = normalizeAlbumType(prompt("Тип альбома", klass.albumType), klass.albumType);
  const pagesCount = Math.max(0, Number.parseInt(prompt("Количество страниц", String(klass.pagesCount || 20)) || String(klass.pagesCount || 20), 10) || 0);
  const status = normalizeAlbumClassStatus(prompt("Статус", klass.status), klass.status);
  await put("albumClasses", { ...klass, name: name.trim(), albumType, pagesCount, status });
  await refreshData();
  renderAlbumClass();
}

async function deleteAlbumClass(classId) {
  const klass = albumClassById(classId);
  if (!klass || !confirm(`Удалить альбомный класс "${klass.name}"?`)) return;
  const projectId = klass.albumProjectId;
  await deleteAlbumClassRecords(classId);
  await refreshData();
  navigate("albumProject", { albumProjectId: projectId });
}

async function deleteAlbumClassRecords(classId) {
  const ownerIds = [
    ...albumStudentsByClass(classId).map((item) => item.id),
    ...albumGroupsByClass(classId).map((item) => item.id),
    ...albumTeachersByClass(classId).map((item) => item.id)
  ];
  for (const media of state.data.albumMedia.filter((item) => ownerIds.includes(item.ownerId))) await del("albumMedia", media.id);
  for (const item of albumStudentsByClass(classId)) await del("albumStudents", item.id);
  for (const item of albumGroupsByClass(classId)) await del("albumGroupMedia", item.id);
  for (const item of albumTeachersByClass(classId)) await del("albumTeachers", item.id);
  await del("albumClasses", classId);
}

async function addAlbumStudent(classId) {
  const fio = prompt("ФИО ученика");
  if (!fio?.trim()) return;
  const { firstName, lastName } = splitFullName(fio);
  await put("albumStudents", {
    id: uid("album_student"),
    albumClassId: classId,
    firstName,
    lastName,
    portraitMediaId: "",
    videoMediaId: "",
    comment: "",
    status: "not_shot",
    createdAt: now()
  });
  await refreshData();
  renderAlbumClass();
}

async function editAlbumStudent(studentId) {
  const student = albumStudentById(studentId);
  if (!student) return;
  const fio = prompt("ФИО ученика", `${student.lastName} ${student.firstName}`.trim());
  if (!fio?.trim()) return;
  const { firstName, lastName } = splitFullName(fio);
  const status = normalizeAlbumStudentStatus(prompt("Статус: not_shot, shot, editing или ready", student.status), student.status);
  const comment = prompt("Комментарий", student.comment || "") || "";
  await put("albumStudents", { ...student, firstName, lastName, status, comment: comment.trim() });
  await refreshData();
  renderAlbumClass();
}

async function deleteAlbumStudent(studentId) {
  const student = albumStudentById(studentId);
  if (!student || !confirm(`Удалить ученика "${student.lastName} ${student.firstName}"?`)) return;
  for (const media of state.data.albumMedia.filter((item) => item.ownerId === studentId)) await del("albumMedia", media.id);
  await del("albumStudents", studentId);
  await refreshData();
  renderAlbumClass();
}

async function addAlbumGroup(classId) {
  const title = prompt("Название общего фото", "Общее фото класса");
  if (!title?.trim()) return;
  const type = normalizeAlbumGroupType(prompt("Тип: class_photo, boys, girls или custom", "class_photo"));
  const comment = prompt("Комментарий", "") || "";
  await put("albumGroupMedia", {
    id: uid("album_group"),
    albumClassId: classId,
    title: title.trim(),
    type,
    mediaId: "",
    videoMediaId: "",
    comment: comment.trim(),
    createdAt: now()
  });
  await refreshData();
  renderAlbumClass();
}

async function editAlbumGroup(groupId) {
  const item = albumGroupById(groupId);
  if (!item) return;
  const title = prompt("Название общего фото", item.title);
  if (!title?.trim()) return;
  const type = normalizeAlbumGroupType(prompt("Тип", item.type), item.type);
  const comment = prompt("Комментарий", item.comment || "") || "";
  await put("albumGroupMedia", { ...item, title: title.trim(), type, comment: comment.trim() });
  await refreshData();
  renderAlbumClass();
}

async function deleteAlbumGroup(groupId) {
  const item = albumGroupById(groupId);
  if (!item || !confirm(`Удалить "${item.title}"?`)) return;
  for (const media of state.data.albumMedia.filter((entry) => entry.ownerId === groupId)) await del("albumMedia", media.id);
  await del("albumGroupMedia", groupId);
  await refreshData();
  renderAlbumClass();
}

async function addAlbumTeacher(classId) {
  const fullName = prompt("ФИО учителя");
  if (!fullName?.trim()) return;
  const role = prompt("Роль", "Классный руководитель") || "";
  const comment = prompt("Комментарий", "") || "";
  await put("albumTeachers", {
    id: uid("album_teacher"),
    albumClassId: classId,
    fullName: fullName.trim(),
    role: role.trim(),
    portraitMediaId: "",
    videoMediaId: "",
    comment: comment.trim(),
    createdAt: now()
  });
  await refreshData();
  renderAlbumClass();
}

async function editAlbumTeacher(teacherId) {
  const teacher = albumTeacherById(teacherId);
  if (!teacher) return;
  const fullName = prompt("ФИО учителя", teacher.fullName);
  if (!fullName?.trim()) return;
  const role = prompt("Роль", teacher.role || "") || "";
  const comment = prompt("Комментарий", teacher.comment || "") || "";
  await put("albumTeachers", { ...teacher, fullName: fullName.trim(), role: role.trim(), comment: comment.trim() });
  await refreshData();
  renderAlbumClass();
}

async function deleteAlbumTeacher(teacherId) {
  const teacher = albumTeacherById(teacherId);
  if (!teacher || !confirm(`Удалить "${teacher.fullName}"?`)) return;
  for (const media of state.data.albumMedia.filter((entry) => entry.ownerId === teacherId)) await del("albumMedia", media.id);
  await del("albumTeachers", teacherId);
  await refreshData();
  renderAlbumClass();
}

function selectAlbumMedia(payload) {
  const [ownerType, ownerId, slot] = payload.split(":");
  state.currentAlbumMedia = { ownerType, ownerId, slot };
  albumMediaInput.accept = slot === "video" ? "video/*" : "image/*";
  albumMediaInput.value = "";
  albumMediaInput.click();
}

async function editCatalogItem(itemId) {
  const item = catalogItemById(itemId);
  if (!item) return;
  const title = prompt("Название услуги / пакета", item.title);
  if (!title) return;
  const mediaKind = normalizeMediaKind(prompt("Тип: фото, видео или оба", mediaKindLabel(item.mediaKind)), item.mediaKind);
  const price = prompt("Цена", item.price || "") || "";
  const orderInfo = prompt("Информация про заказ", item.orderInfo || "") || "";
  const requirements = prompt("Что нужно для реализации", item.requirements || "") || "";
  await put("catalog", { ...item, title: title.trim(), mediaKind, price: price.trim(), orderInfo: orderInfo.trim(), requirements: requirements.trim() });
  await refreshData();
  renderCatalog();
}

async function duplicateCatalogItem(itemId) {
  const item = catalogItemById(itemId);
  if (!item) return;
  const copyId = uid("catalog");
  const copy = {
    ...item,
    id: copyId,
    title: `${item.title} копия`,
    angles: (item.angles || []).map((angle) => ({ ...angle }))
  };
  await put("catalog", copy);
  await refreshData();
  notify("Услуга продублирована.");
  renderCatalog();
}

async function deleteCatalogItem(itemId) {
  if (!confirm("Удалить услугу из каталога?")) return;
  await del("catalog", itemId);
  await refreshData();
  renderCatalog();
}

async function addCatalogAngle(itemId) {
  const item = catalogItemById(itemId);
  if (!item) return;
  const name = prompt("Название ракурса");
  if (!name) return;
  const details = prompt("Описание ракурса", "") || "";
  const id = normalizeOrderType(name);
  const angles = [...(item.angles || []), { id: uniqueAngleId(item, id), name: name.trim(), details: details.trim(), refDataUrl: "", refName: "" }];
  await put("catalog", { ...item, angles });
  await refreshData();
  renderCatalog();
}

async function editCatalogAngle(itemId, angleId) {
  const item = catalogItemById(itemId);
  const angle = item?.angles?.find((entry) => entry.id === angleId);
  if (!item || !angle) return;
  const name = prompt("Название ракурса", angle.name);
  if (!name) return;
  const details = prompt("Описание ракурса", angle.details || "") || "";
  const angles = item.angles.map((entry) => entry.id === angleId ? { ...entry, name: name.trim(), details: details.trim() } : entry);
  await put("catalog", { ...item, angles });
  await refreshData();
  renderCatalog();
}

async function deleteCatalogAngle(itemId, angleId) {
  const item = catalogItemById(itemId);
  if (!item || !confirm("Удалить ракурс?")) return;
  await put("catalog", { ...item, angles: (item.angles || []).filter((entry) => entry.id !== angleId) });
  await refreshData();
  renderCatalog();
}

function uploadReference(itemId, angleId) {
  state.currentReference = { itemId, angleId };
  referenceInput.value = "";
  referenceInput.click();
}

async function generateReferenceSet(itemId) {
  const item = catalogItemById(itemId);
  if (!item) return;
  const subject = prompt("Кого сделать в референсах?", "человек, современный нейтральный образ, студийный свет");
  if (!subject?.trim()) return;
  const cleanSubject = subject.trim();
  const promptText = buildReferenceAiPrompt(cleanSubject);
  const nextAngles = mergeReferenceAngles(item.angles || [], cleanSubject);
  await put("catalog", {
    ...item,
    angles: nextAngles,
    orderInfo: item.orderInfo || "Набор референсов для портретной съемки.",
    requirements: item.requirements || "Одинаковый свет, чистый фон, спокойная поза, без лишних предметов в кадре."
  });
  const copied = await copyText(promptText);
  if (!copied) prompt("Скопируйте промпт для ChatGPT / генератора изображений", promptText);
  await refreshData();
  notify(copied ? "AI-референсы добавлены. Промпт для генерации скопирован." : "AI-референсы добавлены. Промпт показан для копирования.");
  renderCatalog();
}

function mergeReferenceAngles(currentAngles, subject) {
  const byId = new Map(currentAngles.map((angle) => [angle.id, angle]));
  REFERENCE_AI_SET.forEach((preset) => {
    const previous = byId.get(preset.id) || {};
    byId.set(preset.id, {
      ...previous,
      id: preset.id,
      name: preset.name,
      details: preset.details,
      refDataUrl: createReferenceSvgDataUrl(preset, subject),
      refName: `ai-reference-${preset.id}.svg`
    });
  });
  return Array.from(byId.values());
}

function buildReferenceAiPrompt(subject) {
  const shots = REFERENCE_AI_SET.map((preset, index) => `${index + 1}. ${preset.name}: ${preset.details}`).join("\n");
  return [
    `Создай 4 отдельные фотореалистичные референс-фотографии для одного и того же персонажа: ${subject}.`,
    "Стиль: современная студийная портретная съемка, мягкий ровный свет, чистый нейтральный фон, натуральная кожа, реалистичная оптика 50-85mm, без текста и логотипов.",
    "Важно: один и тот же человек, одинаковая одежда, одинаковый свет и фон во всех кадрах.",
    shots,
    "Формат: четыре отдельных изображения, вертикальные, пригодные как референсы для фотографа."
  ].join("\n");
}

async function copyText(text) {
  try {
    await navigator.clipboard?.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function createReferenceSvgDataUrl(preset, subject) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#f8fafc"/>
          <stop offset="0.52" stop-color="#dbeafe"/>
          <stop offset="1" stop-color="#ecfeff"/>
        </linearGradient>
        <linearGradient id="ink" x1="0" x2="1">
          <stop offset="0" stop-color="#111827"/>
          <stop offset="1" stop-color="#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="900" height="1200" fill="url(#bg)"/>
      <rect x="70" y="70" width="760" height="1060" rx="34" fill="rgba(255,255,255,.66)" stroke="#bfdbfe" stroke-width="3"/>
      ${referenceFigureSvg(preset.composition)}
      <text x="450" y="965" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="52" font-weight="800">${escapeSvg(preset.name)}</text>
      <text x="450" y="1028" text-anchor="middle" fill="#475569" font-family="Arial, sans-serif" font-size="27">${escapeSvg(subject.slice(0, 42))}</text>
      <text x="450" y="1085" text-anchor="middle" fill="#2563eb" font-family="Arial, sans-serif" font-size="24" font-weight="700">AI prompt ready</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function referenceFigureSvg(composition) {
  if (composition === "face") {
    return `
      <circle cx="450" cy="410" r="185" fill="#f3c7a2" stroke="#111827" stroke-width="10"/>
      <path d="M292 360c40-142 274-142 316 0-62-38-254-38-316 0Z" fill="url(#ink)"/>
      <path d="M378 430h1M522 430h1" stroke="#111827" stroke-width="22" stroke-linecap="round"/>
      <path d="M420 510c22 18 55 18 78 0" fill="none" stroke="#111827" stroke-width="10" stroke-linecap="round"/>
      <path d="M310 690h280" stroke="#2563eb" stroke-width="20" stroke-linecap="round"/>
    `;
  }
  if (composition === "side") {
    return `
      <path d="M360 575c-88-44-110-202-38-300 74-101 236-83 282 36 26 66-5 146-63 178-20 11-34 31-36 54l-6 75H378Z" fill="#f3c7a2" stroke="#111827" stroke-width="10"/>
      <path d="M320 341c38-132 232-153 310-34-71 8-148 50-190 124-39-22-79-49-120-90Z" fill="url(#ink)"/>
      <path d="M548 398h1" stroke="#111827" stroke-width="20" stroke-linecap="round"/>
      <path d="M606 462c33 14 27 55-8 62" fill="none" stroke="#111827" stroke-width="9" stroke-linecap="round"/>
      <path d="M310 710h330" stroke="#2563eb" stroke-width="20" stroke-linecap="round"/>
    `;
  }
  if (composition === "full") {
    return `
      <circle cx="450" cy="210" r="82" fill="#f3c7a2" stroke="#111827" stroke-width="8"/>
      <path d="M360 320h180l50 310H310Z" fill="#2563eb" stroke="#111827" stroke-width="9"/>
      <path d="M330 380 225 570M570 380l105 190" stroke="#111827" stroke-width="24" stroke-linecap="round"/>
      <path d="M385 630 350 870M515 630l35 240" stroke="#111827" stroke-width="28" stroke-linecap="round"/>
      <path d="M302 884h104M494 884h104" stroke="#111827" stroke-width="20" stroke-linecap="round"/>
    `;
  }
  return `
    <circle cx="450" cy="265" r="108" fill="#f3c7a2" stroke="#111827" stroke-width="9"/>
    <path d="M345 244c38-111 177-118 214-3-55-24-153-23-214 3Z" fill="url(#ink)"/>
    <path d="M380 410h140c76 0 138 62 138 138v176H242V548c0-76 62-138 138-138Z" fill="#2563eb" stroke="#111827" stroke-width="10"/>
    <path d="M345 720h210" stroke="#111827" stroke-width="18" stroke-linecap="round"/>
  `;
}

function escapeSvg(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));
}

function captureMedia(type, orderType) {
  state.currentCapture = { studentId: state.studentId, type, orderType };
  mediaInput.accept = type === "video" ? "video/*" : "image/*";
  mediaInput.capture = "environment";
  mediaInput.value = "";
  mediaInput.click();
}

async function handleMediaInput(event) {
  const file = event.target.files?.[0];
  if (!file || !state.currentCapture) return;
  const student = studentById(state.currentCapture.studentId);
  const klass = classById(student.classId);
  const ext = extensionFor(file, state.currentCapture.type);
  const fileName = safeFileName(`${klass.name}_${student.lastName}_${student.firstName}_${state.currentCapture.orderType}.${ext}`);
  const id = uid("media");
  await put("media", {
    id,
    studentId: student.id,
    type: state.currentCapture.type,
    fileName,
    orderType: state.currentCapture.orderType,
    createdAt: now(),
    blob: file
  });
  await attachFileToOrder(student.id, state.currentCapture.orderType, id);
  await refreshData();
  notify(`${fileName} привязан к ученику.`);
  navigate("student", { studentId: student.id });
}

async function handleAlbumMediaInput(event) {
  const file = event.target.files?.[0];
  const target = state.currentAlbumMedia;
  if (!file || !target) return;
  const fileType = file.type.startsWith("video/") ? "video" : "image";
  const fileName = safeFileName(file.name || `album_media.${extensionFor(file, fileType === "video" ? "video" : "photo")}`);
  const media = {
    id: uid("album_media"),
    ownerType: target.ownerType,
    ownerId: target.ownerId,
    fileName,
    fileType,
    blobId: uid("blob"),
    blob: file,
    createdAt: now()
  };
  await put("albumMedia", media);
  if (target.ownerType === "student") {
    const student = albumStudentById(target.ownerId);
    if (student) {
      const patch = target.slot === "video"
        ? { videoMediaId: media.id }
        : { portraitMediaId: media.id, status: student.status === "not_shot" ? "shot" : student.status };
      await put("albumStudents", { ...student, ...patch });
    }
  }
  if (target.ownerType === "group") {
    const group = albumGroupById(target.ownerId);
    if (group) await put("albumGroupMedia", { ...group, [target.slot === "video" ? "videoMediaId" : "mediaId"]: media.id });
  }
  if (target.ownerType === "teacher") {
    const teacher = albumTeacherById(target.ownerId);
    if (teacher) await put("albumTeachers", { ...teacher, [target.slot === "video" ? "videoMediaId" : "portraitMediaId"]: media.id });
  }
  state.currentAlbumMedia = null;
  event.target.value = "";
  await refreshData();
  notify("Медиа альбома сохранено.");
  renderAlbumClass();
}

async function handleReferenceInput(event) {
  const file = event.target.files?.[0];
  if (!file || !state.currentReference) return;
  if (!isReferenceImage(file)) {
    notify("Выберите изображение: JPG, PNG, WebP, HEIC/HEIF или GIF.");
    event.target.value = "";
    return;
  }
  const { itemId, angleId } = state.currentReference;
  const item = catalogItemById(itemId);
  if (!item) return;
  const refDataUrl = await fileToDataUrl(file);
  const angles = (item.angles || []).map((angle) => angle.id === angleId ? { ...angle, refDataUrl, refName: file.name } : angle);
  await put("catalog", { ...item, angles });
  state.currentReference = null;
  event.target.value = "";
  await refreshData();
  notify("Референс сохранен.");
  renderCatalog();
}

function isReferenceImage(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif"].includes(ext);
}

async function attachFileToOrder(studentId, type, fileId) {
  const order = orderByStudent(studentId);
  const item = order.items.find((entry) => entry.type === type) || order.items[0];
  item.fileIds = Array.from(new Set([...item.fileIds, fileId]));
  item.status = "done";
  await put("orders", { ...order, status: order.status === "delivered" ? order.status : "processing" });
  const student = studentById(studentId);
  if (student && currentOrderStatus(student) !== "delivered") await put("students", { ...student, orderStatus: "processing" });
}

async function markTaskDone(studentId, type) {
  if (!type) return;
  const order = orderByStudent(studentId);
  const item = order.items.find((entry) => entry.type === type);
  if (item) item.status = "done";
  await saveOrderWithAutoStatus(studentId, order);
  await refreshData();
  renderStudent();
}

async function toggleTask(studentId, type) {
  const order = orderByStudent(studentId);
  const item = order.items.find((entry) => entry.type === type);
  if (item) item.status = item.status === "done" ? "pending" : "done";
  await saveOrderWithAutoStatus(studentId, order);
  await refreshData();
  renderStudent();
}

async function updatePayment(studentId, paymentStatus) {
  const student = studentById(studentId);
  await put("students", { ...student, paymentStatus });
  await refreshData();
  renderStudent();
}

async function togglePayment(studentId) {
  const student = studentById(studentId);
  const paymentStatus = student.paymentStatus === "paid" ? "unpaid" : "paid";
  await updatePayment(studentId, paymentStatus);
}

async function resetOrder(studentId) {
  const order = orderByStudent(studentId);
  order.items = order.items.map((item) => ({ ...item, status: "pending", fileIds: [] }));
  order.status = "not_started";
  const student = studentById(studentId);
  if (student) await put("students", { ...student, orderStatus: "not_started" });
  await put("orders", order);
  await refreshData();
  renderStudent();
}

async function saveOrderWithAutoStatus(studentId, order) {
  const done = order.items.length > 0 && order.items.every((item) => item.status === "done");
  const nextStatus = done ? "ready" : (order.status === "delivered" ? "delivered" : "processing");
  await put("orders", { ...order, status: nextStatus });
  const student = studentById(studentId);
  if (student && currentOrderStatus(student) !== "delivered") await put("students", { ...student, orderStatus: nextStatus });
}

async function updateOrderStatus(studentId, orderStatus) {
  const student = studentById(studentId);
  if (!student || !ORDER_STATUSES[orderStatus]) return;
  const order = orderByStudent(studentId);
  await put("students", { ...student, orderStatus });
  await put("orders", { ...order, status: orderStatus });
  await refreshData();
  renderStudent();
}

async function saveTemplate() {
  const name = view.querySelector("[data-template-name]").value.trim() || "Чеклист";
  const rows = Array.from(view.querySelectorAll("[data-template-item]"))
    .map((input) => input.value.trim())
    .filter(Boolean)
    .map((label) => ({ type: normalizeOrderType(label), label }));
  const uniqueRows = [];
  const used = new Set();
  rows.forEach((row) => {
    if (used.has(row.type)) return;
    used.add(row.type);
    uniqueRows.push(row);
  });
  if (!uniqueRows.length) return notify("Добавьте хотя бы один пункт чеклиста.");
  const id = view.querySelector("[data-save-template]").dataset.saveTemplate;
  const labels = Object.fromEntries(uniqueRows.map((row) => [row.type, row.label]));
  await put("templates", { id, name, items: uniqueRows.map((row) => row.type), labels, scope: "default" });
  for (const order of state.data.orders) {
    await put("orders", { ...order, items: mergeOrderItems(order.items || [], uniqueRows.map((row) => row.type), labels) });
  }
  await refreshData();
  notify("Шаблон сохранен и применен.");
  renderSettings();
}

function addTemplateEditorItem() {
  const name = prompt("Название пункта чеклиста", "");
  if (!name?.trim()) return;
  const list = view.querySelector("[data-template-items]");
  list?.insertAdjacentHTML("beforeend", templateEditorRow({ label: name.trim() }));
  const row = list?.lastElementChild;
  injectIcons();
  row?.querySelector("[data-remove-template-item]")?.addEventListener("click", () => row.remove());
}

async function applyCatalogAsTemplate(itemId) {
  const item = catalogItemById(itemId);
  const items = catalogAngleTypes(item);
  if (!items.length) return notify("В услуге нет ракурсов.");
  const current = state.data.templates[0] || { id: uid("template"), name: "Чеклист", scope: "default" };
  const labels = Object.fromEntries((item.angles || []).map((angle) => [angle.id, angle.name]));
  await put("templates", { ...current, name: item.title, items, labels });
  for (const order of state.data.orders) {
    await put("orders", { ...order, catalogId: itemId, items: mergeOrderItems(order.items || [], items, labels) });
  }
  for (const student of state.data.students) {
    await put("students", { ...student, catalogId: itemId });
  }
  await refreshData();
  notify("Чеклист обновлен для всех учеников.");
  renderCatalog();
}

async function resetDemo() {
  if (!confirm("Очистить локальные данные и создать демо?")) return;
  for (const store of STORE_NAMES) await clearStore(store);
  await seedIfNeeded();
  await seedCatalogIfNeeded();
  await refreshData();
  navigate("home");
}

function handleManualQr(event) {
  event.preventDefault();
  openQrValue(new FormData(event.currentTarget).get("qr"));
}

function openQrValue(value) {
  const parsed = parseQrPayload(value);
  const student = studentFromQrValue(value);
  if (!student) {
    notify(`Ученик по QR не найден: ${parsed || "пустой код"}. Проверьте, что он есть в этом браузере.`);
    return;
  }
  navigate("student", { studentId: student.id });
}

async function startQrScanner() {
  const box = view.querySelector("#qr-box");
  if (state.qrScanActive) return;
  const detector = await createQrDetector();
  if (!detector && !hasJsQr()) {
    box.innerHTML = `
      <div>
        <p class="card-title">Сканер недоступен</p>
        <p class="muted">Этот браузер не поддерживает распознавание QR. Введите QR ID вручную.</p>
      </div>
    `;
    notify("Сканер QR недоступен в этом браузере. Используйте ручной ввод.");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    state.qrStream = stream;
    state.qrScanActive = true;
    const video = document.createElement("video");
    video.className = "video-preview";
    video.srcObject = stream;
    video.playsInline = true;
    video.muted = true;
    box.innerHTML = `
      <div class="scanner-frame">
        <div class="scanner-video-slot"></div>
        <div class="scanner-target" aria-hidden="true"></div>
      </div>
      <p class="scanner-status">Ищу QR-код...</p>
    `;
    box.querySelector(".scanner-video-slot").append(video);
    await video.play();
    const canvas = document.createElement("canvas");
    const status = box.querySelector(".scanner-status");
    let lastScanAt = 0;
    const scan = async (time = 0) => {
      if (!state.qrScanActive || !state.qrStream) return;
      if (time - lastScanAt < QR_SCAN_INTERVAL) {
        state.qrScanFrame = requestAnimationFrame(scan);
        return;
      }
      lastScanAt = time;
      const rawValue = await detectQrFromVideo(video, detector, canvas).catch(() => "");
      if (rawValue) {
        status.textContent = "QR найден. Открываю ученика...";
        stopQrStream();
        openQrValue(rawValue);
        return;
      }
      state.qrScanFrame = requestAnimationFrame(scan);
    };
    state.qrScanFrame = requestAnimationFrame(scan);
  } catch (error) {
    stopQrStream();
    notify("Камера недоступна. Проверьте разрешения браузера.");
  }
}

async function handleShootImport(event) {
  const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  let currentStudent = null;
  let qrCount = 0;
  let assignedCount = 0;
  let skippedCount = 0;
  for (const file of files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
    const rawQr = await detectQrFromImageFile(file);
    const qrStudent = rawQr ? studentFromQrValue(parseQrPayload(rawQr)) : null;
    if (qrStudent) {
      currentStudent = qrStudent;
      qrCount += 1;
      continue;
    }
    if (!currentStudent) {
      skippedCount += 1;
      continue;
    }
    await importShotForStudent(currentStudent, file);
    assignedCount += 1;
  }
  event.target.value = "";
  await refreshData();
  notify(`Импорт: QR ${qrCount}, фото ${assignedCount}${skippedCount ? `, пропущено ${skippedCount}` : ""}.`);
  if (currentStudent) navigate("student", { studentId: currentStudent.id });
}

async function importShotForStudent(student, file) {
  const klass = classById(student.classId);
  const orderType = nextImportOrderType(student.id);
  const ext = extensionFor(file, "photo");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const fileName = safeFileName(`${klass?.name || "class"}_${student.lastName}_${student.firstName}_${orderType}_${baseName}.${ext}`);
  const id = uid("media");
  await put("media", {
    id,
    studentId: student.id,
    type: "photo",
    fileName,
    orderType,
    createdAt: now(),
    blob: file
  });
  await attachFileToOrder(student.id, orderType, id);
}

function nextImportOrderType(studentId) {
  const order = orderByStudent(studentId);
  return (order.items.find((item) => item.status !== "done") || order.items[0])?.type || "portrait";
}

function studentFromQrValue(value) {
  const candidates = qrPayloadCandidates(value);
  return state.data.students.find((entry) => {
    const ids = [entry.id, entry.qrId].filter(Boolean).map(normalizeQrToken);
    return ids.some((id) => candidates.has(id));
  });
}

function stopQrStream() {
  if (state.qrScanFrame) cancelAnimationFrame(state.qrScanFrame);
  state.qrScanFrame = 0;
  state.qrScanActive = false;
  if (!state.qrStream) return;
  state.qrStream.getTracks().forEach((track) => track.stop());
  state.qrStream = null;
}

function navigateBackFromStudent() {
  const target = state.returnTarget;
  if (target?.route && target.route !== "student") {
    navigate(target.route, {
      projectId: target.projectId,
      classId: target.classId,
      query: target.query,
      filter: target.filter
    });
    return;
  }
  const student = studentById(state.studentId);
  const klass = classById(student?.classId);
  navigate("classes", { projectId: klass?.projectId || state.projectId, classId: null });
}

async function detectQrFromVideo(video, detector, canvas) {
  if (!video.videoWidth || !video.videoHeight) return "";
  if (hasJsQr()) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const fromCenter = detectQrFromCanvas(canvas, centerScanArea(canvas.width, canvas.height));
    if (fromCenter) return fromCenter;
    const fromFullFrame = detectQrFromCanvas(canvas);
    if (fromFullFrame) return fromFullFrame;
  }
  if (detector) {
    const codes = await detector.detect(video).catch(() => []);
    if (codes[0]?.rawValue) return codes[0].rawValue;
  }
  return "";
}

async function detectQrFromImageFile(file) {
  if ("BarcodeDetector" in window && "createImageBitmap" in window) {
    try {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap).catch(() => []);
      bitmap.close?.();
      if (codes[0]?.rawValue) return codes[0].rawValue;
    } catch {}
  }
  if (!hasJsQr()) return "";
  const image = await loadImageFromFile(file).catch(() => null);
  if (!image) return "";
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(image.src);
  return detectQrFromCanvas(canvas) || detectQrFromCanvas(canvas, centerScanArea(canvas.width, canvas.height));
}

function detectQrFromCanvas(canvas, area = null) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const source = area || { x: 0, y: 0, width: canvas.width, height: canvas.height };
  const imageData = context.getImageData(source.x, source.y, source.width, source.height);
  return decodeQrImageData(imageData);
}

function decodeQrImageData(imageData) {
  const result = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
  if (result?.data) return result.data;
  boostImageContrast(imageData.data);
  return window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" })?.data || "";
}

function boostImageContrast(data) {
  for (let index = 0; index < data.length; index += 4) {
    const gray = (data[index] * 0.299) + (data[index + 1] * 0.587) + (data[index + 2] * 0.114);
    const value = gray > 138 ? 255 : 0;
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }
}

function centerScanArea(width, height) {
  const size = Math.floor(Math.min(width, height) * 0.78);
  return {
    x: Math.max(0, Math.floor((width - size) / 2)),
    y: Math.max(0, Math.floor((height - size) / 2)),
    width: size,
    height: size
  };
}

async function createQrDetector() {
  if (!("BarcodeDetector" in window)) return null;
  try {
    const supported = await BarcodeDetector.getSupportedFormats?.();
    if (supported && !supported.includes("qr_code")) return null;
    return new BarcodeDetector({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

function hasJsQr() {
  return typeof window.jsQR === "function";
}

function parseQrPayload(value) {
  const candidates = Array.from(qrPayloadCandidates(value));
  return candidates.find((item) => item.startsWith("student_")) || candidates[0] || "";
}

function qrPayloadCandidates(value) {
  const raw = String(value || "").trim();
  const candidates = new Set();
  const add = (entry) => {
    const text = normalizeQrToken(entry);
    if (!text) return;
    candidates.add(text);
    try {
      const decoded = normalizeQrToken(decodeURIComponent(text));
      if (decoded) candidates.add(decoded);
    } catch {}
  };
  add(raw);
  const keyValueMatch = raw.match(/(?:studentId|qrId|id)=([^&#\s]+)/i);
  add(keyValueMatch?.[1]);
  try {
    const json = JSON.parse(raw);
    add(json.studentId);
    add(json.qrId);
    add(json.id);
  } catch {}
  try {
    const url = new URL(raw);
    add(url.searchParams.get("studentId"));
    add(url.searchParams.get("qrId"));
    add(url.searchParams.get("id"));
    add(url.hash.replace(/^#/, ""));
    add(url.pathname.split("/").filter(Boolean).pop());
  } catch {}
  add(raw.replace(/^studentId=/i, "").replace(/^qrId=/i, "").replace(/^id=/i, ""));
  return candidates;
}

function normalizeQrToken(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/g, "")
    .toLowerCase();
}

async function exportZip(studentId = null) {
  const files = await buildExportFiles(studentId);
  const blob = createZip(files);
  downloadBlob(blob, `SPF_export_${new Date().toISOString().slice(0, 10)}.zip`);
  notify("ZIP экспортирован.");
}

function exportStatusPdf({ classId = "", projectId = "" } = {}) {
  const exportTemplate = getStatusExportTemplate();
  const columns = statusExportColumns().filter((column) => exportTemplate.columns.includes(column.key));
  if (!columns.length) return notify("В шаблоне PDF нет выбранных колонок.");
  const students = studentsForStatusExport({ classId, projectId });
  if (!students.length) return notify("Нет учеников для PDF отчета.");
  const klass = classById(classId);
  const project = projectById(projectId || klass?.projectId);
  const subtitle = [
    project?.name,
    klass?.name || (projectId ? "Все классы проекта" : "Все проекты"),
    new Date().toLocaleDateString("ru-RU")
  ].filter(Boolean).join(" · ");
  const rows = students.map((student, index) => {
    const cells = columns.map((column) => `<td>${escapeHtml(column.value(student, index))}</td>`).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) {
    notify("Браузер заблокировал окно PDF.");
    return;
  }
  win.document.write(`
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(exportTemplate.title)}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111827; font-family: Arial, sans-serif; }
          header { margin-bottom: 14px; }
          h1 { margin: 0 0 6px; font-size: 22px; }
          p { margin: 0; color: #4b5563; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { padding: 7px 8px; border: 1px solid #d1d5db; text-align: left; vertical-align: top; }
          th { background: #eef2ff; font-weight: 700; }
          tr:nth-child(even) td { background: #f9fafb; }
          .actions { margin-top: 14px; }
          button { min-height: 38px; padding: 0 14px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
          @media print { .actions { display: none; } }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(exportTemplate.title)}</h1>
          <p>${escapeHtml(subtitle)}</p>
        </header>
        <table>
          <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="actions"><button onclick="window.print()">Сохранить в PDF</button></div>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  notify("PDF отчет открыт.");
}

async function buildExportFiles(studentId) {
  const files = [];
  const selectedStudents = studentId ? state.data.students.filter((student) => student.id === studentId) : state.data.students;
  const meta = {
    exportedAt: now(),
    projects: state.data.projects,
    classes: state.data.classes,
    students: selectedStudents,
    orders: state.data.orders.filter((order) => selectedStudents.some((student) => student.id === order.studentId)),
    templates: state.data.templates,
    settings: state.data.settings,
    catalog: state.data.catalog,
    media: state.data.media
      .filter((item) => selectedStudents.some((student) => student.id === item.studentId))
      .map(({ blob, ...item }) => item)
  };
  files.push({ path: "spf-data.json", data: jsonBytes(meta) });
  for (const student of selectedStudents) {
    const klass = classById(student.classId);
    const project = projectById(klass?.projectId);
    const base = `${safePath(project?.name || "Project")}/${safePath(klass?.name || "Class")}/${safePath(`${student.lastName}_${student.firstName}`)}`;
    const order = orderByStudent(student.id);
    files.push({ path: `${base}/meta.json`, data: jsonBytes({ student, order }) });
    for (const item of mediaByStudent(student.id)) {
      const folder = item.type === "video" ? "videos" : "photos";
      files.push({ path: `${base}/${folder}/${item.fileName}`, data: new Uint8Array(await item.blob.arrayBuffer()) });
    }
  }
  return files;
}

async function handleZipInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const entries = parseZip(new Uint8Array(await file.arrayBuffer()));
    const dataEntry = entries.find((entry) => entry.path.endsWith("spf-data.json"));
    if (!dataEntry) throw new Error("spf-data.json not found");
    const meta = JSON.parse(new TextDecoder().decode(dataEntry.data));
    for (const store of ["projects", "classes", "students", "orders", "templates", "settings", "catalog"]) {
      for (const record of meta[store] || []) await put(store, record);
    }
    const mediaRecords = meta.media || [];
    for (const record of mediaRecords) {
      const entry = entries.find((item) => item.path.endsWith(`/${record.fileName}`));
      const blob = entry ? new Blob([entry.data], { type: record.type === "video" ? "video/mp4" : "image/jpeg" }) : new Blob([]);
      await put("media", { ...record, blob });
    }
    await refreshData();
    notify("ZIP импортирован.");
    navigate("home");
  } catch (error) {
    notify("Не удалось импортировать ZIP.");
  } finally {
    event.target.value = "";
  }
}

async function exportAlbumClassZip(classId) {
  const klass = albumClassById(classId);
  if (!klass) return;
  const files = await buildAlbumExportFiles(klass);
  const blob = createZip(files);
  downloadBlob(blob, `${safeFileName(`${klass.name}_album_export`)}.zip`);
  notify("ZIP альбома экспортирован.");
}

async function buildAlbumExportFiles(klass) {
  const project = albumProjectById(klass.albumProjectId);
  const base = `${safePath(`${klass.name}_album_export`)}`;
  const students = albumStudentsByClass(klass.id);
  const groups = albumGroupsByClass(klass.id);
  const teachers = albumTeachersByClass(klass.id);
  const files = [];
  const exportNames = new Map();
  const classInfo = {
    schoolName: project?.schoolName || "",
    className: klass.name,
    albumType: klass.albumType,
    pagesCount: klass.pagesCount,
    studentsCount: students.length,
    exportedAt: now()
  };
  files.push({ path: `${base}/class_info.json`, data: jsonBytes(classInfo) });
  for (const student of students) {
    const folder = `${base}/students/${safePath(`${student.lastName}_${student.firstName}`)}`;
    const portrait = albumMediaById(student.portraitMediaId);
    const video = albumMediaById(student.videoMediaId);
    files.push({ path: `${folder}/meta.json`, data: jsonBytes({ ...student, portraitFileName: portrait?.fileName || "", videoFileName: video?.fileName || "" }) });
    if (portrait?.blob) {
      const exportName = albumExportMediaName("portrait", portrait);
      exportNames.set(portrait.id, exportName);
      files.push({ path: `${folder}/${exportName}`, data: new Uint8Array(await portrait.blob.arrayBuffer()) });
    }
    if (video?.blob) {
      const exportName = albumExportMediaName("video", video);
      exportNames.set(video.id, exportName);
      files.push({ path: `${folder}/${exportName}`, data: new Uint8Array(await video.blob.arrayBuffer()) });
    }
  }
  const groupMeta = [];
  for (const group of groups) {
    const media = albumMediaById(group.mediaId);
    const video = albumMediaById(group.videoMediaId);
    groupMeta.push({ ...group, mediaFileName: media?.fileName || "", videoFileName: video?.fileName || "" });
    if (media?.blob) {
      const exportName = albumGroupExportName(group, media);
      exportNames.set(media.id, exportName);
      files.push({ path: `${base}/group_photos/${exportName}`, data: new Uint8Array(await media.blob.arrayBuffer()) });
    }
    if (video?.blob) {
      const exportName = albumGroupExportName(group, video, "video");
      exportNames.set(video.id, exportName);
      files.push({ path: `${base}/group_photos/${exportName}`, data: new Uint8Array(await video.blob.arrayBuffer()) });
    }
  }
  files.push({ path: `${base}/group_photos/meta.json`, data: jsonBytes(groupMeta) });
  for (const teacher of teachers) {
    const folder = `${base}/teachers/${safePath(teacher.fullName)}`;
    const portrait = albumMediaById(teacher.portraitMediaId);
    const video = albumMediaById(teacher.videoMediaId);
    files.push({ path: `${folder}/meta.json`, data: jsonBytes({ ...teacher, portraitFileName: portrait?.fileName || "", videoFileName: video?.fileName || "" }) });
    if (portrait?.blob) {
      const exportName = albumExportMediaName("portrait", portrait);
      exportNames.set(portrait.id, exportName);
      files.push({ path: `${folder}/${exportName}`, data: new Uint8Array(await portrait.blob.arrayBuffer()) });
    }
    if (video?.blob) {
      const exportName = albumExportMediaName("video", video);
      exportNames.set(video.id, exportName);
      files.push({ path: `${folder}/${exportName}`, data: new Uint8Array(await video.blob.arrayBuffer()) });
    }
  }
  const restore = {
    kind: "spf_album_export",
    version: 1,
    project,
    klass,
    students: students.map(stripAlbumBlobRefs),
    groups: groupMeta,
    teachers: teachers.map(stripAlbumBlobRefs),
    media: state.data.albumMedia
      .filter((media) => [klass.id, ...students.map((item) => item.id), ...groups.map((item) => item.id), ...teachers.map((item) => item.id)].includes(media.ownerId))
      .map(({ blob, ...media }) => ({ ...media, exportFileName: exportNames.get(media.id) || media.fileName }))
  };
  files.push({ path: `${base}/spf-album-data.json`, data: jsonBytes(restore) });
  return files;
}

async function handleAlbumZipInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const entries = parseZip(new Uint8Array(await file.arrayBuffer()));
    const dataEntry = entries.find((entry) => entry.path.endsWith("spf-album-data.json"));
    if (!dataEntry) throw new Error("spf-album-data.json not found");
    const meta = JSON.parse(new TextDecoder().decode(dataEntry.data));
    const project = meta.project || { id: uid("album_project"), schoolName: meta.classInfo?.schoolName || "Импортированный альбом", createdAt: now() };
    const klass = meta.klass || { id: uid("album_class"), albumProjectId: project.id, name: meta.classInfo?.className || "Класс", albumType: "standard", pagesCount: 0, status: "not_started", createdAt: now() };
    await put("albumProjects", project);
    await put("albumClasses", { ...klass, albumProjectId: project.id });
    for (const student of meta.students || []) await put("albumStudents", student);
    for (const group of meta.groups || []) await put("albumGroupMedia", group);
    for (const teacher of meta.teachers || []) await put("albumTeachers", teacher);
    for (const media of meta.media || []) {
      const entry = findAlbumMediaEntry(entries, media);
      const blob = new Blob(entry ? [entry.data] : [], { type: albumMimeType(media) });
      await put("albumMedia", { ...media, blob });
    }
    await refreshData();
    notify("ZIP альбома импортирован.");
    navigate("albumClass", { albumClassId: klass.id, albumProjectId: project.id, albumTab: "students" });
  } catch (error) {
    notify("Не удалось импортировать ZIP альбома.");
  } finally {
    event.target.value = "";
  }
}

function albumExportMediaName(prefix, media) {
  return safeFileName(`${prefix}.${extensionFor({ name: media.fileName, type: albumMimeType(media) }, media.fileType === "video" ? "video" : "photo")}`);
}

function albumGroupExportName(group, media, prefix = "") {
  const base = prefix || group.type || "custom";
  return safeFileName(`${base}.${extensionFor({ name: media.fileName, type: albumMimeType(media) }, media.fileType === "video" ? "video" : "photo")}`);
}

function stripAlbumBlobRefs(item) {
  return { ...item };
}

function findAlbumMediaEntry(entries, media) {
  const expected = [media.exportFileName, media.fileName, albumExportMediaName(media.fileType === "video" ? "video" : "portrait", media)].filter(Boolean);
  return entries.find((entry) => expected.some((name) => entry.path.endsWith(`/${name}`)));
}

function albumMimeType(media) {
  if (media.fileType === "video") return "video/mp4";
  const ext = String(media.fileName || "").split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.path);
    const data = file.data;
    const crc = crc32(data);
    const local = concatBytes([
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data
    ]);
    const central = concatBytes([
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name
    ]);
    localParts.push(local);
    centralParts.push(central);
    offset += local.length;
  }
  const central = concatBytes(centralParts);
  const end = concatBytes([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(central.length), u32(offset), u16(0)]);
  return new Blob([...localParts, central, end], { type: "application/zip" });
}

function parseZip(bytes) {
  const entries = [];
  let offset = 0;
  while (offset < bytes.length - 4) {
    if (readU32(bytes, offset) !== 0x04034b50) break;
    const method = readU16(bytes, offset + 8);
    const compressedSize = readU32(bytes, offset + 18);
    const nameLength = readU16(bytes, offset + 26);
    const extraLength = readU16(bytes, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const path = new TextDecoder().decode(bytes.slice(nameStart, nameStart + nameLength));
    if (method !== 0) throw new Error("Only stored ZIP entries are supported");
    entries.push({ path, data: bytes.slice(dataStart, dataStart + compressedSize) });
    offset = dataStart + compressedSize;
  }
  return entries;
}

function crc32(bytes) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function u16(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255]);
}

function u32(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);
}

function readU16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readU32(bytes, offset) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function concatBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function albumProjectById(id) {
  return state.data.albumProjects.find((project) => project.id === id);
}

function albumClassById(id) {
  return state.data.albumClasses.find((klass) => klass.id === id);
}

function albumStudentById(id) {
  return state.data.albumStudents.find((student) => student.id === id);
}

function albumGroupById(id) {
  return state.data.albumGroupMedia.find((item) => item.id === id);
}

function albumTeacherById(id) {
  return state.data.albumTeachers.find((teacher) => teacher.id === id);
}

function albumMediaById(id) {
  return state.data.albumMedia.find((media) => media.id === id);
}

function albumClassesByProject(projectId) {
  return state.data.albumClasses.filter((klass) => klass.albumProjectId === projectId);
}

function albumStudentsByClass(classId) {
  return state.data.albumStudents.filter((student) => student.albumClassId === classId);
}

function albumGroupsByClass(classId) {
  return state.data.albumGroupMedia.filter((item) => item.albumClassId === classId);
}

function albumTeachersByClass(classId) {
  return state.data.albumTeachers.filter((teacher) => teacher.albumClassId === classId);
}

function albumClassStats(classId) {
  const students = albumStudentsByClass(classId);
  const groups = albumGroupsByClass(classId);
  const teachers = albumTeachersByClass(classId);
  const portraits = students.filter((student) => student.portraitMediaId).length;
  const videos = students.filter((student) => student.videoMediaId).length;
  const ready = students.filter((student) => student.status === "ready").length;
  const readyPercent = students.length ? Math.round(((portraits + ready) / (students.length * 2)) * 100) : 0;
  return {
    students: students.length,
    portraits,
    videos,
    teachers: teachers.length,
    groups: groups.length,
    readyPercent
  };
}

function albumTypeLabel(type) {
  return ALBUM_TYPES[type] || ALBUM_TYPES.standard;
}

function albumClassStatusLabel(status) {
  return ALBUM_CLASS_STATUSES[status] || ALBUM_CLASS_STATUSES.not_started;
}

function albumStudentStatusLabel(status) {
  return ALBUM_STUDENT_STATUSES[status] || ALBUM_STUDENT_STATUSES.not_shot;
}

function albumGroupTypeLabel(type) {
  return ALBUM_GROUP_TYPES[type] || ALBUM_GROUP_TYPES.custom;
}

function albumStatusClass(status) {
  if (["ready", "printing", "delivered"].includes(status)) return "paid";
  if (["shot", "shooting", "editing"].includes(status)) return "in-progress";
  return "unpaid";
}

function normalizeAlbumType(value, fallback = "standard") {
  const text = String(value || "").trim().toLowerCase();
  const byLabel = Object.entries(ALBUM_TYPES).find(([key, label]) => key === text || label.toLowerCase() === text);
  return byLabel?.[0] || fallback;
}

function normalizeAlbumClassStatus(value, fallback = "not_started") {
  const text = String(value || "").trim().toLowerCase();
  return ALBUM_CLASS_STATUSES[text] ? text : fallback;
}

function normalizeAlbumStudentStatus(value, fallback = "not_shot") {
  const text = String(value || "").trim().toLowerCase();
  return ALBUM_STUDENT_STATUSES[text] ? text : fallback;
}

function normalizeAlbumGroupType(value, fallback = "custom") {
  const text = String(value || "").trim().toLowerCase();
  const byLabel = Object.entries(ALBUM_GROUP_TYPES).find(([key, label]) => key === text || label.toLowerCase() === text);
  return byLabel?.[0] || fallback;
}

function classesByProject(projectId) {
  return state.data.classes.filter((klass) => klass.projectId === projectId);
}

function studentsByClass(classId) {
  return state.data.students.filter((student) => student.classId === classId).filter(matchesFilter);
}

function filteredStudents() {
  const query = state.query.trim().toLowerCase();
  return state.data.students.filter((student) => {
    if (!matchesFilter(student)) return false;
    const klass = classById(student.classId);
    const project = projectById(klass?.projectId);
    return [student.firstName, student.lastName, student.qrId, klass?.name, project?.name].join(" ").toLowerCase().includes(query);
  });
}

function studentsForStatusExport({ classId = "", projectId = "" } = {}) {
  if (classId) return state.data.students.filter((student) => student.classId === classId);
  if (projectId) {
    const classIds = new Set(classesByProject(projectId).map((klass) => klass.id));
    return state.data.students.filter((student) => classIds.has(student.classId));
  }
  return state.data.students;
}

function statusExportColumns() {
  return [
    { key: "number", label: "#", value: (_student, index) => index + 1 },
    { key: "student", label: "Ученик", value: (student) => `${student.lastName} ${student.firstName}`.trim() },
    { key: "class", label: "Класс", value: (student) => classById(student.classId)?.name || "" },
    { key: "payment", label: "Оплата", value: (student) => paymentLabel(student.paymentStatus) },
    { key: "catalog", label: "Заказ", value: (student) => catalogItemById(student.catalogId || orderByStudent(student.id).catalogId)?.title || "Не выбран" },
    { key: "orderStatus", label: "Статус заказа", value: (student) => orderStatusLabel(student) },
    { key: "progress", label: "Готовность", value: (student) => {
      const c = completion(student.id);
      return `${c.doneCount}/${c.total}`;
    } },
    { key: "pending", label: "Что осталось", value: (student) => pendingOrderLabels(student).join(", ") || "Готово" },
    { key: "qr", label: "QR ID", value: (student) => student.qrId || student.id }
  ];
}

function pendingOrderLabels(student) {
  return orderByStudent(student.id).items
    .filter((item) => item.status !== "done")
    .map(orderItemLabel);
}

function getStatusExportTemplate() {
  const saved = state.data.settings.find((item) => item.id === STATUS_EXPORT_DEFAULT.id);
  const validColumns = new Set(statusExportColumns().map((column) => column.key));
  const columns = (saved?.columns || STATUS_EXPORT_DEFAULT.columns).filter((key) => validColumns.has(key));
  return {
    ...STATUS_EXPORT_DEFAULT,
    ...saved,
    columns: columns.length ? columns : STATUS_EXPORT_DEFAULT.columns
  };
}

async function saveStatusExportTemplate() {
  const titleValue = view.querySelector("[data-status-export-title]")?.value.trim();
  const columns = Array.from(view.querySelectorAll("[data-status-export-column]:checked")).map((input) => input.dataset.statusExportColumn);
  if (!columns.length) return notify("Выберите хотя бы одну колонку для PDF.");
  await put("settings", {
    id: STATUS_EXPORT_DEFAULT.id,
    title: titleValue || STATUS_EXPORT_DEFAULT.title,
    columns
  });
  await refreshData();
  notify("Шаблон PDF сохранен.");
  renderSettings();
}

function matchesFilter(student) {
  if (state.filter === "all") return true;
  if (state.filter === "paid") return student.paymentStatus === "paid";
  if (state.filter === "todo") return !completion(student.id).done;
  if (state.filter === "done") return completion(student.id).done;
  if (state.filter === "processing") return mediaByStudent(student.id).length > 0 && !completion(student.id).done;
  if (state.filter === "ready") return completion(student.id).done;
  return true;
}

function completion(studentId) {
  const order = orderByStudent(studentId);
  const total = order.items.length || 1;
  const doneCount = order.items.filter((item) => item.status === "done").length;
  return { total, doneCount, done: doneCount === total, percent: Math.round((doneCount / total) * 100) };
}

function statusLabel(student) {
  return orderStatusLabel(student).toLowerCase();
}

function orderByStudent(studentId) {
  return state.data.orders.find((order) => order.studentId === studentId) || { id: `order_${studentId}`, studentId, items: defaultOrderItems() };
}

function mediaByStudent(studentId) {
  return state.data.media.filter((item) => item.studentId === studentId);
}

function projectById(id) {
  return state.data.projects.find((project) => project.id === id);
}

function classById(id) {
  return state.data.classes.find((klass) => klass.id === id);
}

function studentById(id) {
  return state.data.students.find((student) => student.id === id);
}

function catalogItemById(id) {
  return state.data.catalog.find((item) => item.id === id);
}

function catalogAngleByType(type) {
  for (const item of state.data.catalog) {
    const angle = (item.angles || []).find((entry) => entry.id === type);
    if (angle) return angle;
  }
  return null;
}

function catalogAngleForStudent(studentId, type) {
  const student = studentById(studentId);
  const order = orderByStudent(studentId);
  const catalog = catalogItemById(student?.catalogId || order.catalogId);
  const angle = (catalog?.angles || []).find((entry) => entry.id === type);
  return angle || catalogAngleByType(type);
}

function catalogAngleTypes(catalog) {
  return (catalog?.angles || []).map((angle) => angle.id).filter(Boolean);
}

function defaultOrderItems() {
  return Object.keys(ORDER_TYPES).map((type) => ({ type, status: "pending", fileIds: [] }));
}

function orderItemsFromTemplate() {
  const items = state.data.templates[0]?.items || Object.keys(ORDER_TYPES);
  const labels = state.data.templates[0]?.labels || {};
  return items.map((type) => ({ type, label: labels[type] || orderTypeLabel(type), status: "pending", fileIds: [] }));
}

function orderItemsFromCatalog(catalogId) {
  const catalog = catalogItemById(catalogId) || state.data.catalog[0];
  const items = catalogAngleTypes(catalog);
  const labels = items.length
    ? Object.fromEntries((catalog?.angles || []).map((angle) => [angle.id, angle.name]))
    : state.data.templates[0]?.labels || {};
  return (items.length ? items : state.data.templates[0]?.items || Object.keys(ORDER_TYPES)).map((type) => ({ type, label: labels[type] || orderTypeLabel(type), status: "pending", fileIds: [] }));
}

function mergeOrderItems(existingItems, nextTypes, labels = {}) {
  return nextTypes.map((type) => {
    const existing = existingItems.find((item) => item.type === type);
    return existing ? { ...existing, label: labels[type] || existing.label || orderTypeLabel(type) } : { type, label: labels[type] || orderTypeLabel(type), status: "pending", fileIds: [] };
  });
}

function normalizeOrderType(value) {
  const text = value.trim().toLowerCase();
  const found = Object.entries(ORDER_TYPES).find(([key, label]) => key === text || label.toLowerCase() === text);
  return found?.[0] || text.replace(/\s+/g, "_");
}

function orderTypeLabel(type) {
  return catalogAngleByType(type)?.name || ORDER_TYPES[type] || type;
}

function orderItemLabel(item) {
  return item?.label || orderTypeLabel(item?.type || "");
}

function templateItemsForSettings(template) {
  const labels = template.labels || {};
  return (template.items || Object.keys(ORDER_TYPES)).map((type) => ({ type, label: labels[type] || orderTypeLabel(type) }));
}

function paymentLabel(status) {
  return status === "paid" ? "Оплачено" : "Не оплачено";
}

function currentOrderStatus(student) {
  const order = orderByStudent(student.id);
  if (order.status && ORDER_STATUSES[order.status]) return order.status;
  if (student.orderStatus && ORDER_STATUSES[student.orderStatus]) return student.orderStatus;
  const c = completion(student.id);
  if (c.done) return "ready";
  if (mediaByStudent(student.id).length) return "processing";
  return "not_started";
}

function orderStatusLabel(studentOrStatus) {
  const status = typeof studentOrStatus === "string" ? studentOrStatus : currentOrderStatus(studentOrStatus);
  return ORDER_STATUSES[status] || ORDER_STATUSES.not_started;
}

function orderStatusClass(studentOrStatus) {
  const status = typeof studentOrStatus === "string" ? studentOrStatus : currentOrderStatus(studentOrStatus);
  if (status === "ready" || status === "delivered") return "paid";
  if (status === "processing" || status === "shooting") return "in-progress";
  return "unpaid";
}

function mediaKindLabel(kind) {
  if (kind === "photo") return "Фото";
  if (kind === "video") return "Видео";
  return "Фото и видео";
}

function normalizeMediaKind(value, fallback = "both") {
  const text = String(value || "").trim().toLowerCase();
  if (["фото", "photo"].includes(text)) return "photo";
  if (["видео", "video"].includes(text)) return "video";
  if (["оба", "обе", "фото и видео", "both"].includes(text)) return "both";
  return fallback || "both";
}

function formatPrice(value) {
  const text = String(value || "").trim();
  if (!text || text === "0") return "Цена не указана";
  return text;
}

function uniqueAngleId(item, baseId) {
  const used = new Set((item.angles || []).map((angle) => angle.id));
  if (!used.has(baseId)) return baseId;
  let index = 2;
  while (used.has(`${baseId}_${index}`)) index += 1;
  return `${baseId}_${index}`;
}

function chooseCatalogId(currentId = "") {
  if (!state.data.catalog.length) return "";
  const labels = state.data.catalog.map((item, index) => `${index + 1}. ${item.title}`).join("\n");
  const currentIndex = Math.max(0, state.data.catalog.findIndex((item) => item.id === currentId));
  const answer = prompt(`Выберите услугу номером:\n${labels}`, String(currentIndex + 1));
  const index = Number(answer) - 1;
  return state.data.catalog[index]?.id || state.data.catalog[0].id;
}

function splitFullName(value) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const lastName = parts[0];
  const firstName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

function filterChip(filter, label) {
  return `<button class="chip ${state.filter === filter ? "active" : ""}" data-filter="${filter}" type="button">${label}</button>`;
}

function empty(text) {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}

function showQrPayload(studentId) {
  const student = studentById(studentId);
  const value = studentQrPayload(student);
  const svg = createQrSvg(value, 7);
  const win = window.open("", "_blank", "width=420,height=560");
  if (!win) {
    prompt("QR ID ученика", value);
    return;
  }
  win.document.write(`
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>QR ${escapeHtml(value)}</title>
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #f7f7f7; color: #111827; }
          main { width: min(360px, calc(100vw - 32px)); display: grid; gap: 14px; text-align: center; }
          svg { width: 100%; height: auto; background: #fff; border: 1px solid #e5e7eb; }
          code { overflow-wrap: anywhere; padding: 10px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
          button { min-height: 42px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; font-weight: 800; cursor: pointer; }
        </style>
      </head>
      <body>
        <main>
          <h1>QR ученика</h1>
          ${svg}
          <code>${escapeHtml(student.qrId || student.id)}</code>
          <button onclick="window.print()">Печать</button>
        </main>
      </body>
    </html>
  `);
  win.document.close();
}

function studentQrPayload(student) {
  const id = student.qrId || student.id;
  const base = location.origin === "null"
    ? location.href.split("#")[0].split("?")[0]
    : `${location.origin}${location.pathname}`;
  try {
    const url = new URL(base);
    url.searchParams.set("studentId", id);
    const payload = url.toString();
    return new TextEncoder().encode(payload).length <= 100 ? payload : `studentId=${id}`;
  } catch {
    return `studentId=${id}`;
  }
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function uid(prefix) {
  return `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
}

function now() {
  return new Date().toISOString();
}

function jsonBytes(value) {
  return new TextEncoder().encode(JSON.stringify(value, null, 2));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createQrSvg(text, scale = 6) {
  const modules = createQrModules(text);
  const size = modules.length;
  const quiet = 4;
  const full = size + quiet * 2;
  const rects = [];
  modules.forEach((row, y) => row.forEach((dark, x) => {
    if (dark) rects.push(`<rect x="${x + quiet}" y="${y + quiet}" width="1" height="1"/>`);
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full} ${full}" width="${full * scale}" height="${full * scale}" role="img" aria-label="QR"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${rects.join("")}</g></svg>`;
}

function createQrModules(text) {
  const version = 5;
  const size = 37;
  const dataCodewords = 108;
  const eccCodewords = 26;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));
  const set = (x, y, dark, reserve = true) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y][x] = Boolean(dark);
    if (reserve) reserved[y][x] = true;
  };
  const finder = (x, y) => {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const xx = x + dx;
        const yy = y + dy;
        const dark = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        set(xx, yy, dark);
      }
    }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  for (let i = 8; i < size - 8; i += 1) {
    set(i, 6, i % 2 === 0);
    set(6, i, i % 2 === 0);
  }
  alignmentPattern(30, 30, set);
  set(8, size - 8, true);
  reserveFormatAreas(reserved);
  const bytes = qrDataCodewords(text, dataCodewords);
  const codewords = bytes.concat(reedSolomon(bytes, eccCodewords));
  placeQrCodewords(modules, reserved, codewords);
  applyQrMask(modules, reserved, 0);
  drawFormatBits(modules, reserved, 1, 0);
  return modules;
}

function alignmentPattern(cx, cy, set) {
  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      set(cx + x, cy + y, Math.max(Math.abs(x), Math.abs(y)) !== 1);
    }
  }
}

function reserveFormatAreas(reserved) {
  const size = reserved.length;
  for (let i = 0; i < 9; i += 1) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i += 1) reserved[8][size - 1 - i] = true;
  for (let i = 0; i < 7; i += 1) reserved[size - 1 - i][8] = true;
}

function qrDataCodewords(text, count) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const bits = [0, 1, 0, 0];
  pushBits(bits, bytes.length, 8);
  bytes.forEach((byte) => pushBits(bits, byte, 8));
  const capacity = count * 8;
  for (let i = 0; i < 4 && bits.length < capacity; i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const output = [];
  for (let i = 0; i < bits.length; i += 8) output.push(bits.slice(i, i + 8).reduce((sum, bit) => (sum << 1) | bit, 0));
  for (let pad = 0; output.length < count; pad += 1) output.push(pad % 2 ? 0x11 : 0xec);
  return output.slice(0, count);
}

function pushBits(bits, value, length) {
  for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
}

function reedSolomon(data, degree) {
  const generator = rsGenerator(degree);
  const result = Array(degree).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);
    generator.forEach((coef, index) => {
      result[index] ^= gfMul(coef, factor);
    });
  });
  return result;
}

function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = Array(poly.length + 1).fill(0);
    poly.forEach((coef, index) => {
      next[index] ^= gfMul(coef, 1);
      next[index + 1] ^= gfMul(coef, gfPow(2, i));
    });
    poly = next;
  }
  return poly.slice(1);
}

function gfMul(a, b) {
  let result = 0;
  for (; b; b >>>= 1) {
    if (b & 1) result ^= a;
    a <<= 1;
    if (a & 0x100) a ^= 0x11d;
  }
  return result;
}

function gfPow(value, power) {
  let result = 1;
  for (let i = 0; i < power; i += 1) result = gfMul(result, value);
  return result;
}

function placeQrCodewords(modules, reserved, codewords) {
  const size = modules.length;
  const bits = codewords.flatMap((byte) => Array.from({ length: 8 }, (_, index) => (byte >>> (7 - index)) & 1));
  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;
      for (let dx = 0; dx < 2; dx += 1) {
        const x = right - dx;
        if (reserved[y][x]) continue;
        modules[y][x] = Boolean(bits[bitIndex] || 0);
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
}

function applyQrMask(modules, reserved, mask) {
  modules.forEach((row, y) => row.forEach((_, x) => {
    if (!reserved[y][x] && qrMask(mask, x, y)) modules[y][x] = !modules[y][x];
  }));
}

function qrMask(mask, x, y) {
  if (mask === 0) return (x + y) % 2 === 0;
  return false;
}

function drawFormatBits(modules, reserved, eccLevel, mask) {
  const size = modules.length;
  const bits = formatBits((eccLevel << 3) | mask);
  const coordsA = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
  const coordsB = [[size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8], [size - 5, 8], [size - 6, 8], [size - 7, 8], [size - 8, 8], [8, size - 7], [8, size - 6], [8, size - 5], [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]];
  coordsA.forEach(([x, y], index) => {
    modules[y][x] = Boolean((bits >>> index) & 1);
    reserved[y][x] = true;
  });
  coordsB.forEach(([x, y], index) => {
    modules[y][x] = Boolean((bits >>> index) & 1);
    reserved[y][x] = true;
  });
}

function formatBits(value) {
  let data = value << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if ((data >>> i) & 1) data ^= 0x537 << (i - 10);
  }
  return ((value << 10) | data) ^ 0x5412;
}

function safeFileName(value) {
  return value.replace(/[^\p{L}\p{N}._-]+/gu, "_");
}

function safePath(value) {
  return safeFileName(String(value || "untitled")).replace(/^_+|_+$/g, "") || "untitled";
}

function extensionFor(file, type) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && ext.length <= 5) return ext;
  return type === "video" ? "mp4" : "jpg";
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function injectIcons() {
  const icons = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>',
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM14 14h2v2h-2z"/></svg>',
    classes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5h16v14"/><path d="M8 9h8M8 13h5"/><path d="M2 19h20"/></svg>',
    catalog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/><path d="M16 17h.01"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L6.6 16.6l.1-.1A1.7 1.7 0 0 0 7 14.6a1.7 1.7 0 0 0-1.5-1H5v-3h.5A1.7 1.7 0 0 0 7 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1A1.7 1.7 0 0 0 17 9a1.7 1.7 0 0 0 1.5 1h.5v3h-.5a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 1 0 9 6 8 8 0 1 1-9-6Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="3"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h11v12H4z"/><path d="m15 10 5-3v10l-5-3z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m20 6-11 11-5-5"/></svg>'
  };
  document.querySelectorAll("[data-icon]").forEach((node) => {
    node.innerHTML = icons[node.dataset.icon] || "";
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

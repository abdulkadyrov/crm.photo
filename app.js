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
  class_photo: "Общее фото группы",
  boys: "Фото мальчиков",
  girls: "Фото девочек",
  custom: "Другое"
};
const STATUS_EXPORT_DEFAULT = {
  id: "status-export-template",
  title: "Статус заказов",
  columns: ["number", "student", "class", "payment", "catalog", "orderStatus", "progress", "pending"]
};
const SETTING_IDS = {
  initialized: "spf-initialized"
};

const state = {
  route: "home",
  projectId: null,
  classId: null,
  studentId: null,
  catalogId: null,
  filter: "all",
  query: "",
  db: null,
  data: emptyData(),
  currentCapture: null,
  currentReference: null,
  currentPreview: null,
  currentAlbumMedia: null,
  zipImportMode: "auto",
  albumProjectId: null,
  albumClassId: null,
  albumTab: "students",
  classStatsId: null,
  returnTarget: null,
  qrStream: null,
  qrScanFrame: 0,
  qrScanActive: false,
  lastRenderedRoute: null
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
const screenContext = document.querySelector("#screen-context");
const screenSummary = document.querySelector("#screen-summary");
const toast = document.querySelector("#toast");
const mediaInput = document.querySelector("#media-input");
const referenceInput = document.querySelector("#reference-input");
const previewInput = document.querySelector("#preview-input");
const shootImportInput = document.querySelector("#shoot-import-input");
const zipInput = document.querySelector("#zip-input");
const albumMediaInput = document.querySelector("#album-media-input");
const albumZipInput = document.querySelector("#album-zip-input");

init();

async function init() {
  injectIcons();
  lockGestures();
  document.documentElement.dataset.theme = localStorage.getItem("spf-theme") || "light";
  state.db = await openDb();
  await seedIfNeeded();
  await seedCatalogIfNeeded();
  await refreshData();
  bindShell();
  navigateFromUrl() || navigate("home");
  registerServiceWorker();
}

function lockGestures() {
  document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("gesturechange", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("gestureend", (event) => event.preventDefault(), { passive: false });
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
  const settings = await getAll("settings");
  const initialized = settings.some((item) => item?.id === SETTING_IDS.initialized && item?.value === true);
  const projects = await getAll("projects");
  if (projects.length) {
    if (!initialized) await put("settings", { id: SETTING_IDS.initialized, value: true });
    return;
  }
  const templates = await getAll("templates");
  const templateId = templates[0]?.id || uid("template");
  if (!templates.length) {
    await put("templates", {
      id: templateId,
      name: "Базовый чеклист",
      items: ["portrait", "full", "side", "video", "interview"],
      scope: "default"
    });
  }
  if (initialized) return;
  const projectId = uid("project");
  const classA = uid("class");
  const classB = uid("class");
  await put("projects", { id: projectId, name: "Гимназия №12", createdAt: now(), templateId });
  await put("classes", { id: classA, projectId, name: "4A" });
  await put("classes", { id: classB, projectId, name: "4B" });
  const students = [
    ["Алиса", "Смирнова", classA, "paid"],
    ["Максим", "Иванов", classA, "unpaid"],
    ["София", "Петрова", classB, "paid"]
  ];
  const catalogId = (await getAll("catalog"))[0]?.id || "";
  for (const [firstName, lastName, classId, paymentStatus] of students) {
    const id = uid("student");
    await put("students", { id, classId, firstName, lastName, qrId: id, paymentStatus, orderStatus: "not_started", catalogId, status: "not_started" });
    await put("orders", { id: `order_${id}`, studentId: id, status: "not_started", catalogId, items: catalogId ? orderItemsFromCatalog(catalogId) : defaultOrderItems() });
  }
  await put("settings", { id: SETTING_IDS.initialized, value: true });
}

async function seedCatalogIfNeeded() {
  const catalog = await getAll("catalog");
  if (catalog.length) return;
  await put("catalog", {
    id: uid("catalog"),
    title: "Стандартный проектный пакет",
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
  mediaInput.addEventListener("change", handleMediaInput);
  referenceInput.addEventListener("change", handleReferenceInput);
  previewInput.addEventListener("change", handlePreviewInput);
  shootImportInput.addEventListener("change", handleShootImport);
  zipInput.addEventListener("change", handleZipInput);
  albumMediaInput.addEventListener("change", handleAlbumMediaInput);
  albumZipInput.addEventListener("change", handleAlbumZipInput);
}

function navigate(route, params = {}) {
  stopQrStream();
  const prevRoute = state.route;
  const prevScrollY = window.scrollY;
  if (route === "student" && state.route !== "student") {
    state.returnTarget = routeSnapshot();
  }
  Object.assign(state, params, { route });
  document.querySelectorAll(".nav-item").forEach((item) => {
    const itemRoute = item.dataset.route;
    item.classList.toggle("active", itemRoute === route || (itemRoute === "albums" && route.startsWith("album")));
  });
  render();
  if (prevRoute !== route) window.scrollTo(0, 0);
  else window.scrollTo(0, prevScrollY);
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
  const prevScrollY = window.scrollY;
  const prevRoute = state.lastRenderedRoute;
  const renderers = {
    home: renderHome,
    search: renderSearch,
    scan: renderScan,
    classes: renderClasses,
    catalog: renderCatalog,
    serviceDetail: renderServiceDetail,
    albums: renderAlbums,
    albumProject: renderAlbumProject,
    albumClass: renderAlbumClass,
    services: renderServices,
    settings: renderSettings,
    student: renderStudent
  };
  (renderers[state.route] || renderHome)();
  addContextBackButton();
  view.focus({ preventScroll: true });
  if (state.preserveScroll || prevRoute === state.route) window.scrollTo(0, prevScrollY);
  state.preserveScroll = false;
  state.lastRenderedRoute = state.route;
}

function addContextBackButton() {
  const mainRoutes = new Set(["home", "classes", "scan", "albums", "settings"]);
  const nestedMainRoute = state.route === "classes" && state.classId;
  if ((mainRoutes.has(state.route) && !nestedMainRoute) || view.querySelector(".fab-back")) return;
  const button = document.createElement("button");
  button.className = "fab-back";
  button.type = "button";
  button.setAttribute("aria-label", "Назад");
  button.title = "Назад";
  button.innerHTML = '<span data-icon="back"></span>';
  button.addEventListener("click", navigateContextBack);
  view.append(button);
  injectIcons(button);
}

function navigateContextBack() {
  if (state.route === "classes" && state.classId) {
    state.classId = null;
    return renderClasses();
  }
  if (state.route === "student") return navigateBackFromStudent();
  if (state.route === "services") return navigate("settings");
  if (state.route === "serviceDetail") return navigate("services");
  if (state.route === "albumProject") return navigate("albums");
  if (state.route === "albumClass") {
    const klass = albumClassById(state.albumClassId);
    return navigate("albumProject", { albumProjectId: klass?.albumProjectId || state.albumProjectId });
  }
  return history.length > 1 ? history.back() : navigate("home");
}

function setShell({ heading, context = "Фото CRM", summary = "" }) {
  title.textContent = heading;
  screenContext.textContent = context;
  screenSummary.textContent = summary;
}

function renderHome() {
  const projects = state.data.projects;
  const classes = state.data.classes;
  const students = state.data.students;
  const done = students.reduce((sum, student) => sum + completion(student.id).doneCount, 0);
  const total = students.reduce((sum, student) => sum + completion(student.id).total, 0);
  setShell({
    heading: "Главная",
    context: projects[0]?.name || "School Photo Flow",
    summary: `${classes.length} групп • ${students.length} учеников · ${done} из ${total} задач выполнено`
  });
  view.innerHTML = `
    <section class="crm-overview">
      <div class="toolbar home-toolbar">
        <div>
          <h2 class="card-title">Проекты съемки</h2>
          <p class="muted">Проекты, группы, ученики и статусы заказов.</p>
        </div>
        <button class="primary-button" data-add-project="home" type="button"><span data-icon="plus"></span>Проект</button>
      </div>
      <div class="metric-grid">
        <article class="metric-card">
          <span class="metric-icon metric-blue" data-icon="classes"></span>
          <div><strong>${classes.length} групп</strong><span>в работе</span></div>
        </article>
        <article class="metric-card">
          <span class="metric-icon metric-green" data-icon="check"></span>
          <div><strong>${students.length} учеников</strong><span>${done} из ${total} задач</span></div>
        </article>
      </div>
      <label class="search-box">
        <span data-icon="search"></span>
        <input data-query placeholder="Поиск проекта, группы или ученика" value="${escapeAttr(state.query)}" />
      </label>
      <div class="chip-row quick-filters">
        ${filterChip("all", "Все")}
        ${filterChip("unpaid", "Не оплачено")}
        ${filterChip("todo", "Не снято")}
        ${filterChip("processing", "В работе")}
        ${filterChip("ready", "Готово")}
      </div>
    </section>
    <section class="compact-stack">
      ${projects.map(projectCard).join("") || empty("Создайте первый проект")}
    </section>
  `;
  bindViewActions();
  const input = view.querySelector("[data-query]");
  input?.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderHome();
  });
}

function projectCard(project) {
  const classes = classesByProject(project.id);
  const students = classes.flatMap((klass) => state.data.students.filter((student) => student.classId === klass.id)).filter(matchesFilter).filter(matchesSearch);
  const done = students.filter((student) => completion(student.id).done).length;
  const pct = students.length ? Math.round((done / students.length) * 100) : 0;
  return `
    <article class="list-card card-button" data-open-project="${project.id}">
      <div class="list-card-main">
        <span class="list-icon metric-blue" data-icon="classes"></span>
        <div class="list-copy">
          <h2 class="card-title">${escapeHtml(project.name)}</h2>
          <p class="muted">${classes.length} групп · ${students.length} учеников</p>
          <div class="progress-label"><span>Прогресс ${pct}%</span></div>
          <div class="progress"><span style="width:${pct}%"></span></div>
        </div>
        <details class="item-menu">
          <summary aria-label="Меню проекта">...</summary>
          <div class="menu-panel">
            <button data-open-project-action="${project.id}" type="button">Открыть</button>
            <button data-export-status-project="${project.id}" type="button">Экспорт</button>
            <button data-rename-project="${project.id}" type="button">Переименовать</button>
            <button class="danger-text" data-delete-project="${project.id}" type="button">Удалить</button>
          </div>
        </details>
      </div>
    </article>
  `;
}

function matchesSearch(student) {
  const query = state.query.trim().toLowerCase();
  if (!query) return true;
  const klass = classById(student.classId);
  const project = projectById(klass?.projectId);
  return [student.firstName, student.lastName, student.qrId, klass?.name, project?.name].join(" ").toLowerCase().includes(query);
}

function renderClasses() {
  const projects = state.data.projects;
  const activeProject = state.projectId || projects[0]?.id || "";
  state.projectId = activeProject;
  const project = projectById(activeProject);
  const classes = activeProject ? classesByProject(activeProject) : [];
  const allProjectStudents = classes.flatMap((klass) => state.data.students.filter((student) => student.classId === klass.id));
  const doneTasks = allProjectStudents.reduce((sum, student) => sum + completion(student.id).doneCount, 0);
  const totalTasks = allProjectStudents.reduce((sum, student) => sum + completion(student.id).total, 0);
  if (state.classId && !classes.some((klass) => klass.id === state.classId)) state.classId = null;
  setShell({
    heading: project?.name || "Группы",
    context: "Проекты",
    summary: `${classes.length} групп · ${allProjectStudents.length} ученика · ${doneTasks} из ${totalTasks} задач выполнено`
  });
  view.innerHTML = `
    <section class="projects-actions">
      <select class="select project-select" data-project-select aria-label="Проект">
        ${projects.map((project) => `<option value="${project.id}" ${project.id === activeProject ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}
      </select>
      <div class="project-button-row">
        <button class="primary-button equal-button" data-add-project="classes" type="button"><span data-icon="plus"></span>Проект</button>
        <button class="secondary-button equal-button" data-export-status-project="${activeProject}" type="button"><span data-icon="catalog"></span>PDF статусов</button>
        <button class="primary-button equal-button" data-add-class="${activeProject}" type="button"><span data-icon="plus"></span>Группа</button>
      </div>
    </section>
    ${state.classId ? studentQuickForm(state.classId) : ""}
    <section class="group-card-grid">
      ${classes.map(classCard).join("") || empty("В проекте пока нет групп")}
    </section>
    ${state.classStatsId ? classStatsPanel(state.classStatsId) : ""}
    ${state.classId ? classStudentSection(state.classId) : ""}
  `;
  bindViewActions();
}

function classStudentSection(classId) {
  const klass = classById(classId);
  if (!klass) return "";
  const students = studentsForClassView(klass.id);
  return `
    <section class="class-section">
      <div class="toolbar">
        <h2 class="card-title">Ученики группы ${escapeHtml(klass.name)}</h2>
        <button class="secondary-button compact" data-close-class-students type="button">Свернуть</button>
      </div>
      <div class="student-list">
        ${students.map(studentCard).join("") || '<p class="muted class-empty">Добавьте учеников в группу.</p>'}
      </div>
    </section>
  `;
}

function classCard(klass) {
  const allStudents = state.data.students.filter((student) => student.classId === klass.id);
  const done = allStudents.filter((student) => completion(student.id).done).length;
  const pct = allStudents.length ? Math.round((done / allStudents.length) * 100) : 0;
  return `
    <article class="class-card group-card card-button" data-open-class="${klass.id}" tabindex="0">
      <div class="class-cover ${classCoverClass(klass.name)}">
        <span data-icon="classes"></span>
      </div>
      <div class="class-main">
        <div class="class-head">
          <div>
            <h2 class="card-title">${escapeHtml(klass.name)}</h2>
          </div>
          <details class="item-menu class-menu">
            <summary aria-label="Меню группы">...</summary>
            <div class="menu-panel">
              <button data-add-student="${klass.id}" type="button">Добавить ученика</button>
              <button data-show-class-stats="${klass.id}" type="button">Статистика</button>
              <button data-export-status-class="${klass.id}" type="button">Экспорт</button>
              <button data-rename-class="${klass.id}" type="button">Переименовать</button>
              <button class="danger-text" data-delete-class="${klass.id}" type="button">Удалить</button>
            </div>
          </details>
        </div>
        <p class="muted">${allStudents.length} ${pluralizeRu(allStudents.length, "ученик", "ученика", "учеников")}</p>
        <div class="progress-label">
          <span>Прогресс: ${pct}%</span>
          <strong>${pct}%</strong>
        </div>
        <div class="progress"><span style="width:${pct}%"></span></div>
      </div>
    </article>
  `;
}

function classStatsPanel(classId) {
  const klass = classById(classId);
  if (!klass) return "";
  const stats = classFinancialStats(classId);
  const project = projectById(klass.projectId);
  const projectStats = projectFinancialStats(klass.projectId);
  return `
    <section class="panel class-stats-panel">
      <div class="card-header">
        <div>
          <h2 class="card-title">Статистика группы ${escapeHtml(klass.name)}</h2>
          <p class="muted">${escapeHtml(project?.name || "Проект")} · оплаты, долг и прогресс работ.</p>
        </div>
        <button class="icon-button" data-close-class-stats type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      <h3 class="mini-heading">По группе</h3>
      <div class="stats finance-stats">
        <div class="stat"><strong>${formatMoney(stats.paidAmount)}</strong><span class="muted">Оплачено</span></div>
        <div class="stat"><strong>${formatMoney(stats.totalAmount)}</strong><span class="muted">Должны всего</span></div>
        <div class="stat"><strong>${formatMoney(stats.remainingAmount)}</strong><span class="muted">Осталось оплатить</span></div>
        <div class="stat"><strong>${stats.paidStudents}/${stats.students}</strong><span class="muted">Оплатили</span></div>
      </div>
      <div class="finance-progress">
        <div class="progress-label"><span>Оплата ${stats.paymentPercent}%</span><strong>${formatMoney(stats.remainingAmount)}</strong></div>
        <div class="progress"><span style="width:${stats.paymentPercent}%"></span></div>
      </div>
      <div class="finance-progress">
        <div class="progress-label"><span>Работы сделано ${stats.doneTasks} из ${stats.totalTasks}</span><strong>${stats.workPercent}%</strong></div>
        <div class="progress"><span style="width:${stats.workPercent}%"></span></div>
        <p class="muted">Осталось задач: ${Math.max(0, stats.totalTasks - stats.doneTasks)}</p>
      </div>
      <h3 class="mini-heading">По проекту</h3>
      <div class="stats finance-stats">
        <div class="stat"><strong>${formatMoney(projectStats.paidAmount)}</strong><span class="muted">Оплачено</span></div>
        <div class="stat"><strong>${formatMoney(projectStats.totalAmount)}</strong><span class="muted">Должны всего</span></div>
        <div class="stat"><strong>${formatMoney(projectStats.remainingAmount)}</strong><span class="muted">Осталось оплатить</span></div>
        <div class="stat"><strong>${projectStats.workPercent}%</strong><span class="muted">Работы готово</span></div>
      </div>
    </section>
  `;
}

function renderSearch() {
  setShell({ heading: "Поиск", context: "Глобальный поиск", summary: "Проекты · группы · ученики" });
  const results = filteredStudents();
  view.innerHTML = `
    <section class="grid">
      <input class="input" data-query placeholder="Ученик, группа, проект или QR" value="${escapeAttr(state.query)}" />
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
  setShell({ heading: "QR", context: "Сканер", summary: "Быстрое открытие ученика по QR" });
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
  setShell({ heading: "Альбомы", context: "Выпускные проекты", summary: "Группы · общие фото · экспорт дизайнеру" });
  const projects = state.data.albumProjects;
  view.innerHTML = `
    <section class="toolbar">
      <div>
        <h2 class="card-title">Выпускные альбомы</h2>
        <p class="muted">Проект → группа → ученики, общие фото, учителя и экспорт дизайнеру.</p>
      </div>
      <button class="primary-button" data-add-album-project type="button">Проект</button>
    </section>
    <section class="grid project-grid">
      ${projects.map(albumProjectCard).join("") || empty("Создайте первый проект для альбомов")}
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
    <article class="list-card card-button" data-open-album-project="${project.id}" tabindex="0">
      <div class="list-card-main">
        <span class="list-icon metric-blue" data-icon="catalog"></span>
        <div class="list-copy">
          <h2 class="card-title">${escapeHtml(project.schoolName)}</h2>
          <p class="muted">${classes.length} групп · ${students.length} учеников</p>
          <div class="progress-label"><span>Готовность ${pct}%</span></div>
          <div class="progress"><span style="width:${pct}%"></span></div>
        </div>
        <details class="item-menu">
          <summary aria-label="Меню проекта">...</summary>
          <div class="menu-panel">
            <button data-add-album-class="${project.id}" type="button">Добавить группу</button>
            <button data-open-album-project-action="${project.id}" type="button">Открыть</button>
            <button class="danger-text" data-delete-album-project="${project.id}" type="button">Удалить проект</button>
          </div>
        </details>
      </div>
    </article>
  `;
}

function renderAlbumProject() {
  const project = albumProjectById(state.albumProjectId);
  if (!project) {
    navigate("albums");
    return;
  }
  setShell({ heading: project.schoolName, context: "Альбомы", summary: "Группы выпускных альбомов" });
  const classes = albumClassesByProject(project.id);
  view.innerHTML = `
    <section class="toolbar">
      <div>
        <h2 class="card-title">${escapeHtml(project.schoolName)}</h2>
        <p class="muted">Группы выпускных альбомов</p>
      </div>
      <div class="row album-action-row">
        <button class="secondary-button" data-export-album-status-project="${project.id}" type="button">PDF статистики</button>
        <button class="primary-button" data-add-album-class="${project.id}" type="button">Группа</button>
      </div>
    </section>
    <button class="fab-back" data-back-to-albums type="button" aria-label="Назад" title="Назад"><span data-icon="back"></span></button>
    <section class="grid project-grid">
      ${classes.map(albumClassCard).join("") || empty("Добавьте первую группу")}
    </section>
  `;
  bindViewActions();
}

function albumClassCard(klass) {
  const stats = albumClassStats(klass.id);
  return `
    <article class="list-card card-button" data-open-album-class="${klass.id}" tabindex="0">
      <div class="list-card-main">
        <span class="list-icon ${classCoverClass(klass.name)}" data-icon="classes"></span>
        <div class="list-copy">
          <h2 class="card-title">${escapeHtml(klass.name)}</h2>
          <p class="muted">${albumTypeLabel(klass.albumType)} · ${klass.pagesCount || 0} страниц</p>
          <div class="progress-label"><span>Готовность ${stats.readyPercent}%</span></div>
          <div class="progress"><span style="width:${stats.readyPercent}%"></span></div>
        </div>
        <details class="item-menu">
          <summary aria-label="Меню группы">...</summary>
          <div class="menu-panel">
            <button data-open-album-class-action="${klass.id}" type="button">Открыть</button>
            <button data-edit-album-class="${klass.id}" type="button">Изменить</button>
            <button class="danger-text" data-delete-album-class="${klass.id}" type="button">Удалить группу</button>
          </div>
        </details>
      </div>
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
  setShell({ heading: klass.name, context: project?.schoolName || "Альбом", summary: `${albumTypeLabel(klass.albumType)} · ${klass.pagesCount || 0} страниц` });
  view.innerHTML = `
    <section class="album-class-head">
      <div class="toolbar">
        <div>
          <h2 class="card-title">${escapeHtml(klass.name)}</h2>
          <p class="muted">${albumTypeLabel(klass.albumType)} · ${klass.pagesCount || 0} страниц · ${escapeHtml(project?.schoolName || "")}</p>
        </div>
        <div class="row album-action-row">
          <button class="secondary-button" data-export-album-status-class="${klass.id}" type="button">PDF</button>
          <button class="secondary-button" data-import-album-zip type="button">Импорт ZIP</button>
          <button class="secondary-button" data-edit-album-class="${klass.id}" type="button">Изменить</button>
        </div>
      </div>
      <button class="fab-back" data-back-to-album-project="${klass.albumProjectId}" type="button" aria-label="Назад" title="Назад"><span data-icon="back"></span></button>
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
  const mediaItems = albumMediaByOwner("student", student.id);
  const portraitCount = mediaItems.filter((item) => item.fileType === "image").length;
  const videoCount = mediaItems.filter((item) => item.fileType === "video").length;
  return `
    <article class="student-card album-work-card">
      <div class="student-line album-card-head">
        <div>
          <h3>${escapeHtml(student.lastName)} ${escapeHtml(student.firstName)}</h3>
          <p class="muted">Индивидуальная папка · Фото: ${portraitCount} · Видео: ${videoCount}</p>
        </div>
        <span class="status-pill ${albumStatusClass(student.status)}">${albumStudentStatusLabel(student.status)}</span>
      </div>
      ${albumMediaGallery(mediaItems, "Фото и видео появятся внутри этой ячейки")}
      ${student.comment ? `<p class="muted">${escapeHtml(student.comment)}</p>` : ""}
      <div class="toolbar">
        <button class="secondary-button compact" data-album-media="student:${student.id}:portrait" type="button">Фото</button>
        <button class="secondary-button compact" data-album-media="student:${student.id}:video" type="button">Видео</button>
        <button class="secondary-button compact" data-show-album-qr="student:${student.id}" type="button">QR</button>
        <button class="secondary-button compact" data-edit-album-student="${student.id}" type="button">Изменить</button>
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
      ${items.map(albumGroupCard).join("") || empty("Добавьте фото, которые относятся ко всей группе")}
    </section>
  `;
}

function albumGroupCard(item) {
  const mediaItems = albumMediaByOwner("group", item.id);
  const photoCount = mediaItems.filter((entry) => entry.fileType === "image").length;
  const videoCount = mediaItems.filter((entry) => entry.fileType === "video").length;
  return `
    <article class="student-card album-work-card">
      <div class="student-line album-card-head">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p class="muted">Папка общих фото · ${albumGroupTypeLabel(item.type)} · Фото: ${photoCount} · Видео: ${videoCount}</p>
        </div>
        <span class="status-pill in-progress">${albumGroupTypeLabel(item.type)}</span>
      </div>
      ${albumMediaGallery(mediaItems, "Общие фото появятся внутри этой ячейки")}
      ${item.comment ? `<p class="muted">${escapeHtml(item.comment)}</p>` : ""}
      <div class="toolbar">
        <button class="secondary-button compact" data-album-media="group:${item.id}:image" type="button">Фото</button>
        <button class="secondary-button compact" data-album-media="group:${item.id}:video" type="button">Видео</button>
        <button class="secondary-button compact" data-show-album-qr="group:${item.id}" type="button">QR</button>
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
      ${teachers.map(albumTeacherCard).join("") || empty("Добавьте руководителя группы, директора или сотрудников")}
    </section>
  `;
}

function albumTeacherCard(teacher) {
  const mediaItems = albumMediaByOwner("teacher", teacher.id);
  const photoCount = mediaItems.filter((item) => item.fileType === "image").length;
  const videoCount = mediaItems.filter((item) => item.fileType === "video").length;
  return `
    <article class="student-card album-work-card">
      <div class="student-line album-card-head">
        <div>
          <h3>${escapeHtml(teacher.fullName)}</h3>
          <p class="muted">Папка учителя · ${escapeHtml(teacher.role || "Учитель")} · Фото: ${photoCount} · Видео: ${videoCount}</p>
        </div>
        <span class="status-pill ${photoCount || videoCount ? "paid" : "unpaid"}">${photoCount || videoCount ? "Есть материалы" : "Не снят"}</span>
      </div>
      ${albumMediaGallery(mediaItems, "Фото и видео учителя появятся внутри этой ячейки")}
      ${teacher.comment ? `<p class="muted">${escapeHtml(teacher.comment)}</p>` : ""}
      <div class="toolbar">
        <button class="secondary-button compact" data-album-media="teacher:${teacher.id}:portrait" type="button">Фото</button>
        <button class="secondary-button compact" data-album-media="teacher:${teacher.id}:video" type="button">Видео</button>
        <button class="secondary-button compact" data-show-album-qr="teacher:${teacher.id}" type="button">QR</button>
        <button class="secondary-button compact" data-edit-album-teacher="${teacher.id}" type="button">Изменить</button>
        <button class="danger-button compact" data-delete-album-teacher="${teacher.id}" type="button">Удалить</button>
      </div>
    </article>
  `;
}

function albumMediaGallery(items, emptyText) {
  if (!items.length) return `<div class="album-media-empty">${escapeHtml(emptyText)}</div>`;
  return `<div class="album-media-grid">${items.map((item, index) => albumMediaPreview(item, index + 1)).join("")}</div>`;
}

function albumMediaPreview(media, number) {
  const url = URL.createObjectURL(media.blob);
  const node = media.fileType === "video"
    ? `<video src="${url}" controls muted playsinline></video>`
    : `<img src="${url}" alt="${escapeAttr(media.fileName)}" loading="lazy" />`;
  return `<figure class="album-media-preview">${node}<figcaption>${media.fileType === "video" ? "Видео" : "Фото"} ${number}</figcaption></figure>`;
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
          <button class="secondary-button" data-export-album-status-class="${klass.id}" type="button">PDF статистики</button>
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
          <span>Услуги</span>
          <div class="service-picker">
            ${state.data.catalog.map((item) => `
              <label class="checkbox-row">
                <input type="checkbox" name="catalogIds" value="${item.id}" ${item.id === selectedCatalogId ? "checked" : ""} />
                <span>${escapeHtml(item.title)}</span>
              </label>
            `).join("") || '<p class="muted">Сначала добавьте услугу.</p>'}
          </div>
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
  const selectedCatalogIds = selectedCatalogIdsForStudent(student);
  const selectedCatalogTitle = selectedCatalogIds.map((id) => catalogItemById(id)?.title).filter(Boolean).join(", ") || "Услуги не выбраны";
  const c = completion(student.id);
  setShell({ heading: `${student.firstName} ${student.lastName}`, context: project?.name || "Ученик", summary: klass?.name || "" });
  view.innerHTML = `
    <section class="split">
      <div class="grid">
        <article class="panel">
          <div class="card-header">
            <div>
              <h2 class="card-title">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</h2>
              <p class="muted student-order-summary">Заказ: ${escapeHtml(selectedCatalogTitle)}</p>
            </div>
            <div class="row status-row">
              <span class="status-pill ${orderStatusClass(student)}">${orderStatusLabel(student)}</span>
              <span class="status-pill ${student.paymentStatus}">${paymentLabel(student.paymentStatus)}</span>
            </div>
          </div>
          <div class="detail-stats">
            <div class="detail-stat"><span>Статус</span><strong>${orderStatusLabel(student)}</strong></div>
            <div class="detail-stat"><span>Оплата</span><strong>${paymentLabel(student.paymentStatus)}</strong></div>
            <div class="detail-stat"><span>Услуга</span><strong>${escapeHtml(selectedCatalogTitle)}</strong></div>
            <div class="detail-stat"><span>Прогресс</span><strong>${c.percent}%</strong></div>
          </div>
          <div class="action-grid">
            <button class="action-button" data-capture="photo" data-order-type="${activeTask?.type || "portrait"}" type="button"><span data-icon="camera"></span>Фото</button>
            <button class="action-button" data-capture="video" data-order-type="${activeTask?.type || "video"}" type="button"><span data-icon="video"></span>Видео</button>
            <button class="action-button secondary" data-import-media data-order-type="${activeTask?.type || "portrait"}" type="button"><span data-icon="catalog"></span>Из телефона</button>
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
        <div class="field-label">
          <span>Услуги ученика</span>
          <div class="service-picker">
            ${state.data.catalog.map((item) => `
              <label class="checkbox-row">
                <input type="checkbox" data-student-service="${student.id}" value="${item.id}" ${selectedCatalogIds.includes(item.id) ? "checked" : ""} />
                <span>${escapeHtml(item.title)}</span>
              </label>
            `).join("") || '<p class="muted">Добавьте услуги в разделе настроек.</p>'}
          </div>
        </div>
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
    <button class="fab-back" data-back-from-student type="button" aria-label="Назад" title="Назад"><span data-icon="back"></span></button>
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
  renderServices();
}

function renderServices() {
  setShell({ heading: "Услуги", context: "Настройки съемки", summary: "Пакеты · чек-листы · референсы" });
  const catalog = state.data.catalog;
  view.innerHTML = `
    <section class="toolbar">
      <div>
        <h2 class="card-title">Пакеты съемки</h2>
        <p class="muted">Услуги, стоимость и набор ракурсов.</p>
      </div>
      <button class="primary-button" data-add-catalog type="button"><span data-icon="plus"></span>Услуга</button>
    </section>
    <section class="compact-stack">
      ${catalog.map(catalogCard).join("") || empty("Добавьте первую услугу для съемки")}
    </section>
  `;
  bindViewActions();
}

function catalogCard(item) {
  const preview = item.previewDataUrl
    ? `<img class="service-preview" src="${item.previewDataUrl}" alt="${escapeAttr(item.title)}" />`
    : '<div class="service-preview empty">Нет превью</div>';
  return `
    <article class="list-card card-button service-card" data-open-catalog="${item.id}" tabindex="0">
      <div class="list-card-main">
        <div class="service-preview-frame">${preview}</div>
        <div class="list-copy">
          <h2 class="card-title">${escapeHtml(item.title)}</h2>
          <div class="service-card-meta">
            <span>${escapeHtml(mediaKindLabel(item.mediaKind))}</span>
            <span>${escapeHtml(formatPrice(item.price))}</span>
            <span>${(item.angles || []).length} ракурсов</span>
          </div>
        </div>
        <details class="item-menu">
          <summary aria-label="Меню услуги">...</summary>
          <div class="menu-panel">
            <button data-open-catalog-action="${item.id}" type="button">Открыть</button>
            <button data-edit-catalog="${item.id}" type="button">Редактировать</button>
            <button data-duplicate-catalog="${item.id}" type="button">Дублировать</button>
            <button data-upload-catalog-preview="${item.id}" type="button">Превью</button>
            <button class="danger-text" data-delete-catalog="${item.id}" type="button">Удалить</button>
          </div>
        </details>
      </div>
    </article>
  `;
}

function renderServiceDetail() {
  const item = catalogItemById(state.catalogId);
  if (!item) {
    navigate("services");
    return;
  }
  setShell({ heading: item.title, context: mediaKindLabel(item.mediaKind), summary: formatPrice(item.price) });
  view.innerHTML = `
    <section class="grid">
      <article class="panel grid">
        <div class="catalog-details">
          <p><strong>Что получает клиент:</strong> ${escapeHtml(item.orderInfo || "Не заполнено")}</p>
          <p><strong>Что требуется:</strong> ${escapeHtml(item.requirements || "Не заполнено")}</p>
        </div>
      </article>
      <section class="toolbar">
        <h2 class="card-title">Ракурсы</h2>
        <button class="primary-button" data-add-angle="${item.id}" type="button"><span data-icon="plus"></span>Ракурс</button>
      </section>
      <section class="compact-stack">
        ${(item.angles || []).map((angle) => catalogAngleRow(item, angle)).join("") || empty("Ракурсы пока не добавлены")}
      </section>
      <article class="panel grid">
        <div>
          <h2 class="card-title">✨ AI-инструменты</h2>
          <p class="muted">Быстро подготовьте референсы и идеи для съемки.</p>
        </div>
        <div class="settings-list">
          <button class="settings-row" data-generate-references="${item.id}" type="button"><span>✨</span><div><strong>Сгенерировать референс</strong><small>Набор базовых кадров</small></div><b>›</b></button>
          <button class="settings-row" data-edit-catalog="${item.id}" type="button"><span>✍️</span><div><strong>Создать описание</strong><small>Заполнить детали пакета</small></div><b>›</b></button>
          <button class="settings-row" data-add-angle="${item.id}" type="button"><span>🎯</span><div><strong>Предложить ракурс</strong><small>Добавить новый сценарий</small></div><b>›</b></button>
        </div>
      </article>
    </section>
  `;
  bindViewActions();
}

function catalogAngleRow(item, angle) {
  const reference = angle.refDataUrl
    ? `<img class="reference-thumb large" src="${angle.refDataUrl}" alt="${escapeAttr(angle.name)}" />`
    : '<div class="reference-empty large">Нет фото</div>';
  return `
    <article class="list-card">
      <div class="list-card-main">
        ${reference}
        <div class="list-copy">
          <strong>${escapeHtml(angle.name)}</strong>
          <p class="muted">${escapeHtml(angle.details || "Описание ракурса не заполнено")}</p>
        </div>
        <details class="item-menu">
          <summary aria-label="Меню ракурса">...</summary>
          <div class="menu-panel">
            <button data-upload-reference="${item.id}:${angle.id}" type="button">Референс</button>
            <button data-edit-angle="${item.id}:${angle.id}" type="button">Изменить</button>
            <button class="danger-text" data-delete-angle="${item.id}:${angle.id}" type="button">Удалить</button>
          </div>
        </details>
      </div>
    </article>
  `;
}

function renderSettings() {
  setShell({ heading: "Настройки", context: "School Photo Flow", summary: "Шаблоны · PDF · импорт и экспорт" });
  view.innerHTML = `
    <section class="settings-list">
      <button class="settings-row" data-settings-detail="checklists" type="button"><span>📋</span><div><strong>Шаблоны чеклистов</strong><small>Настройка задач заказа</small></div><b>›</b></button>
      <button class="settings-row" data-settings-detail="pdf" type="button"><span>📄</span><div><strong>PDF статусы</strong><small>Колонки и заголовок отчета</small></div><b>›</b></button>
      <button class="settings-row" data-open-services type="button"><span>🎛</span><div><strong>Услуги</strong><small>Пакеты съемки и референсы</small></div><b>›</b></button>
      <button class="settings-row" data-settings-detail="transfer" type="button"><span>📦</span><div><strong>Импорт / экспорт</strong><small>Данные и настройки</small></div><b>›</b></button>
      <button class="settings-row" data-refresh-app type="button"><span>🔄</span><div><strong>Обновление</strong><small>Обновить кэш PWA</small></div><b>›</b></button>
      <button class="settings-row" data-settings-detail="demo" type="button"><span>🧪</span><div><strong>Демо данные</strong><small>Очистка и пересоздание примера</small></div><b>›</b></button>
    </section>
  `;
  bindViewActions();
}

function showSettingsDetail(section) {
  const template = state.data.templates[0] || { id: uid("template"), name: "Чеклист", items: Object.keys(ORDER_TYPES) };
  const items = templateItemsForSettings(template);
  const exportTemplate = getStatusExportTemplate();
  const content = {
    checklists: `
      <article class="panel grid">
        <div class="card-header"><div><h2 class="card-title">Шаблон чеклиста</h2><p class="muted">Эти пункты будут у каждого заказа ученика.</p></div><button class="secondary-button compact" data-add-template-item type="button">Добавить</button></div>
        <input class="input" data-template-name value="${escapeAttr(template.name)}" placeholder="Название шаблона" />
        <div class="checklist-editor" data-template-items>${items.map((item) => templateEditorRow(item)).join("")}</div>
        <button class="primary-button" data-save-template="${template.id}" type="button">Сохранить и применить</button>
      </article>`,
    pdf: `
      <article class="panel grid">
        <div><h2 class="card-title">Шаблон PDF статусов</h2><p class="muted">Выберите колонки отчета.</p></div>
        <label class="field-label"><span>Заголовок отчета</span><input class="input" data-status-export-title value="${escapeAttr(exportTemplate.title)}" /></label>
        <div class="export-column-grid">${statusExportColumns().map((column) => `<label class="checkbox-row"><input type="checkbox" data-status-export-column="${column.key}" ${exportTemplate.columns.includes(column.key) ? "checked" : ""} /><span>${escapeHtml(column.label)}</span></label>`).join("")}</div>
        <button class="primary-button" data-save-status-export-template type="button">Сохранить PDF</button>
      </article>`,
    transfer: `
      <article class="panel grid"><h2 class="card-title">Импорт / экспорт</h2><button class="secondary-button" data-import-settings type="button">Импорт настроек</button><button class="secondary-button" data-export-settings type="button">Экспорт настроек</button><button class="secondary-button" data-import-zip type="button">Импорт данных</button><button class="primary-button" data-action="export-all" type="button">Экспорт всех данных</button></article>`,
    demo: `
      <article class="panel grid"><h2 class="card-title">Демо-данные</h2><button class="danger-button" data-clear-all type="button">Очистить все данные</button><button class="secondary-button" data-reset-demo type="button">Очистить и создать демо</button></article>`
  }[section];
  if (!content) return;
  view.innerHTML = `<section class="grid">${content}</section><button class="fab-back" data-back-settings type="button" aria-label="Назад" title="Назад"><span data-icon="back"></span></button>`;
  bindViewActions();
}

function studentCard(student) {
  const klass = classById(student.classId);
  const project = projectById(klass?.projectId);
  const c = completion(student.id);
  const previewUrl = studentAvatarUrl(student);
  const fullName = `${student.lastName} ${student.firstName}`.trim();
  const preview = previewUrl
    ? `<img class="student-thumb" src="${previewUrl}" alt="${escapeAttr(fullName)}" loading="lazy" />`
    : '<div class="student-thumb empty"><span>👤</span><small>Нет фото</small></div>';
  return `
    <article class="student-card card-button" data-open-student="${student.id}" tabindex="0">
      <div class="student-card-grid">
        ${preview}
        <div class="student-identity">
          <div class="student-copy">
            <h3>${escapeHtml(student.lastName)} ${escapeHtml(student.firstName)}</h3>
            <p class="muted">${escapeHtml(project?.name || "")} • ${escapeHtml(klass?.name || "")}</p>
          </div>
          <div class="student-progress">
            <div class="progress-label">
              <span>${c.doneCount} из ${c.total} задач</span>
              <strong>${c.percent}%</strong>
            </div>
            <div class="progress"><span style="width:${c.percent}%"></span></div>
          </div>
          <div class="student-statuses">
            <span class="status-pill ${orderStatusClass(student)}">${statusDot(currentOrderStatus(student))}${orderStatusLabel(student)}</span>
            <span class="status-pill ${student.paymentStatus}">${statusDot(student.paymentStatus)}${paymentLabel(student.paymentStatus)}</span>
          </div>
        </div>
        <details class="item-menu student-menu">
          <summary aria-label="Меню ученика">...</summary>
          <div class="menu-panel">
            <button data-open-student-action="${student.id}" type="button">Открыть</button>
            <button data-edit-student="${student.id}" type="button">Редактировать</button>
            <button data-generate-qr="${student.id}" type="button">QR</button>
            <button data-export-student="${student.id}" type="button">Экспорт</button>
            <button class="danger-text" data-delete-student="${student.id}" type="button">Удалить</button>
          </div>
        </details>
      </div>
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
  bindDetailsMenus();
  fitStatusPills();
  view.querySelectorAll("[data-open-project]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (event.target.closest("details")) return;
      navigate("classes", { projectId: node.dataset.openProject });
    });
  });
  view.querySelectorAll("[data-open-project-action]").forEach((node) => {
    node.addEventListener("click", () => navigate("classes", { projectId: node.dataset.openProjectAction }));
  });
  view.querySelectorAll("[data-add-project]").forEach((node) => node.addEventListener("click", () => addProject(node.dataset.addProject)));
  view.querySelectorAll("[data-add-class]").forEach((node) => node.addEventListener("click", () => addClass(node.dataset.addClass)));
  view.querySelectorAll("[data-open-class], [data-show-class-students]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button") && !node.dataset.showClassStudents) return;
      if (event.target.closest("details") && !node.dataset.showClassStudents) return;
      state.classId = node.dataset.openClass || node.dataset.showClassStudents;
      state.preserveScroll = true;
      renderClasses();
    });
  });
  view.querySelector("[data-close-class-students]")?.addEventListener("click", () => {
    state.classId = null;
    state.preserveScroll = true;
    renderClasses();
  });
  view.querySelectorAll("[data-show-class-stats]").forEach((node) => node.addEventListener("click", () => {
    state.classStatsId = node.dataset.showClassStats;
    state.preserveScroll = true;
    renderClasses();
  }));
  view.querySelector("[data-close-class-stats]")?.addEventListener("click", () => {
    state.classStatsId = null;
    state.preserveScroll = true;
    renderClasses();
  });
  view.querySelectorAll("[data-add-student]").forEach((node) => node.addEventListener("click", () => showStudentForm(node.dataset.addStudent)));
  view.querySelectorAll("[data-delete-project]").forEach((node) => node.addEventListener("click", () => deleteProject(node.dataset.deleteProject)));
  view.querySelectorAll("[data-rename-project]").forEach((node) => node.addEventListener("click", () => renameProject(node.dataset.renameProject)));
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
      if (event.target.closest("details")) return;
      navigate("student", { studentId: node.dataset.openStudent });
    });
    node.addEventListener("keydown", (event) => {
      if (event.target.closest("button")) return;
      if (event.target.closest("details")) return;
      if (event.key === "Enter" || event.key === " ") navigate("student", { studentId: node.dataset.openStudent });
    });
  });
  view.querySelectorAll("[data-open-student-action]").forEach((node) => {
    node.addEventListener("click", () => navigate("student", { studentId: node.dataset.openStudentAction }));
  });
  view.querySelectorAll("[data-filter]").forEach((node) => node.addEventListener("click", () => {
    state.filter = node.dataset.filter;
    render();
  }));
  view.querySelector("[data-project-select]")?.addEventListener("change", (event) => navigate("classes", { projectId: event.target.value }));
  view.querySelectorAll("[data-capture]").forEach((node) => node.addEventListener("click", () => captureMedia(node.dataset.capture, node.dataset.orderType)));
  view.querySelectorAll("[data-import-media]").forEach((node) => node.addEventListener("click", () => importMediaFromDevice(node.dataset.orderType)));
  view.querySelectorAll("[data-done-task]").forEach((node) => node.addEventListener("click", () => markTaskDone(state.studentId, node.dataset.doneTask)));
  view.querySelectorAll("[data-toggle-task]").forEach((node) => node.addEventListener("click", () => {
    const [studentId, type] = node.dataset.toggleTask.split(":");
    toggleTask(studentId, type);
  }));
  view.querySelector("[data-toggle-payment]")?.addEventListener("click", (event) => togglePayment(event.currentTarget.dataset.togglePayment));
  view.querySelector("[data-back-from-student]")?.addEventListener("click", navigateBackFromStudent);
  view.querySelectorAll("[data-edit-student]").forEach((node) => node.addEventListener("click", (event) => editStudent(event.currentTarget.dataset.editStudent)));
  view.querySelectorAll("[data-student-service]").forEach((node) => node.addEventListener("change", () => {
    const studentId = node.dataset.studentService;
    const catalogIds = Array.from(view.querySelectorAll(`[data-student-service="${studentId}"]:checked`)).map((input) => input.value);
    updateStudentServices(studentId, catalogIds);
  }));
  view.querySelector("[data-order-status]")?.addEventListener("change", (event) => updateOrderStatus(event.target.dataset.orderStatus, event.target.value));
  view.querySelector("[data-payment]")?.addEventListener("change", (event) => updatePayment(event.target.dataset.payment, event.target.value));
  view.querySelector("[data-manual-qr]")?.addEventListener("submit", handleManualQr);
  view.querySelector("[data-start-scan]")?.addEventListener("click", startQrScanner);
  view.querySelector("[data-import-shoot]")?.addEventListener("click", () => shootImportInput.click());
  view.querySelector("[data-stop-scan]")?.addEventListener("click", stopQrStream);
  view.querySelector("[data-import-zip]")?.addEventListener("click", () => {
    state.zipImportMode = "full";
    zipInput.click();
  });
  view.querySelector("[data-import-settings]")?.addEventListener("click", () => {
    state.zipImportMode = "settings";
    zipInput.click();
  });
  view.querySelector("[data-export-settings]")?.addEventListener("click", exportSettingsZip);
  view.querySelectorAll("[data-action='export-all']").forEach((node) => node.addEventListener("click", () => exportZip()));
  view.querySelectorAll("[data-export-student]").forEach((node) => node.addEventListener("click", () => exportZip(node.dataset.exportStudent)));
  view.querySelectorAll("[data-export-status-class]").forEach((node) => node.addEventListener("click", () => exportStatusPdf({ classId: node.dataset.exportStatusClass })));
  view.querySelectorAll("[data-rename-class]").forEach((node) => node.addEventListener("click", () => renameClass(node.dataset.renameClass)));
  view.querySelectorAll("[data-export-status-project]").forEach((node) => node.addEventListener("click", () => exportStatusPdf({ projectId: node.dataset.exportStatusProject })));
  view.querySelector("[data-save-template]")?.addEventListener("click", saveTemplate);
  view.querySelector("[data-save-status-export-template]")?.addEventListener("click", saveStatusExportTemplate);
  view.querySelector("[data-add-template-item]")?.addEventListener("click", addTemplateEditorItem);
  view.querySelectorAll("[data-remove-template-item]").forEach((node) => node.addEventListener("click", () => {
    node.closest(".template-item-row")?.remove();
  }));
  view.querySelector("[data-clear-all]")?.addEventListener("click", clearAllData);
  view.querySelector("[data-reset-demo]")?.addEventListener("click", resetDemo);
  view.querySelector("[data-refresh-app]")?.addEventListener("click", refreshApp);
  view.querySelector("[data-reset-order]")?.addEventListener("click", () => resetOrder(state.studentId));
  view.querySelectorAll("[data-generate-qr]").forEach((node) => node.addEventListener("click", (event) => showQrPayload(event.currentTarget.dataset.generateQr || state.studentId)));
  view.querySelector("[data-open-services]")?.addEventListener("click", () => navigate("services"));
  view.querySelectorAll("[data-settings-detail]").forEach((node) => node.addEventListener("click", () => showSettingsDetail(node.dataset.settingsDetail)));
  view.querySelector("[data-back-settings]")?.addEventListener("click", () => renderSettings());
  view.querySelector("[data-add-catalog]")?.addEventListener("click", addCatalogItem);
  view.querySelectorAll("[data-open-catalog], [data-open-catalog-action]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button") && !node.dataset.openCatalogAction) return;
      if (event.target.closest("details") && !node.dataset.openCatalogAction) return;
      navigate("serviceDetail", { catalogId: node.dataset.openCatalog || node.dataset.openCatalogAction });
    });
  });
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
  view.querySelectorAll("[data-upload-catalog-preview]").forEach((node) => node.addEventListener("click", () => uploadCatalogPreview(node.dataset.uploadCatalogPreview)));
  view.querySelectorAll("[data-generate-references]").forEach((node) => node.addEventListener("click", () => generateReferenceSet(node.dataset.generateReferences)));
  view.querySelectorAll("[data-apply-template]").forEach((node) => node.addEventListener("click", () => applyCatalogAsTemplate(node.dataset.applyTemplate)));
  view.querySelector("[data-add-album-project]")?.addEventListener("click", addAlbumProject);
  view.querySelectorAll("[data-open-album-project]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (event.target.closest("details")) return;
      navigate("albumProject", { albumProjectId: node.dataset.openAlbumProject });
    });
  });
  view.querySelectorAll("[data-open-album-project-action]").forEach((node) => {
    node.addEventListener("click", () => navigate("albumProject", { albumProjectId: node.dataset.openAlbumProjectAction }));
  });
  view.querySelectorAll("[data-add-album-class]").forEach((node) => node.addEventListener("click", () => addAlbumClass(node.dataset.addAlbumClass)));
  view.querySelectorAll("[data-delete-album-project]").forEach((node) => node.addEventListener("click", () => deleteAlbumProject(node.dataset.deleteAlbumProject)));
  view.querySelectorAll("[data-open-album-class]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (event.target.closest("details")) return;
      navigate("albumClass", { albumClassId: node.dataset.openAlbumClass, albumTab: "students" });
    });
  });
  view.querySelectorAll("[data-open-album-class-action]").forEach((node) => {
    node.addEventListener("click", () => navigate("albumClass", { albumClassId: node.dataset.openAlbumClassAction, albumTab: "students" }));
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
  view.querySelectorAll("[data-show-album-qr]").forEach((node) => node.addEventListener("click", () => showAlbumQrPayload(node.dataset.showAlbumQr)));
  view.querySelectorAll("[data-export-album-class]").forEach((node) => node.addEventListener("click", () => exportAlbumClassZip(node.dataset.exportAlbumClass)));
  view.querySelectorAll("[data-export-album-status-class]").forEach((node) => node.addEventListener("click", () => exportAlbumStatusPdf({ classId: node.dataset.exportAlbumStatusClass })));
  view.querySelectorAll("[data-export-album-status-project]").forEach((node) => node.addEventListener("click", () => exportAlbumStatusPdf({ albumProjectId: node.dataset.exportAlbumStatusProject })));
  view.querySelector("[data-import-album-zip]")?.addEventListener("click", () => albumZipInput.click());
}

function bindDetailsMenus() {
  const menus = Array.from(view.querySelectorAll(".item-menu"));
  menus.forEach((menu) => {
    menu.addEventListener("toggle", () => {
      if (!menu.open) {
        menu.classList.remove("menu-up");
        return;
      }
      menus.forEach((other) => {
        if (other !== menu) other.open = false;
      });
      const panel = menu.querySelector(".menu-panel");
      const summary = menu.querySelector("summary");
      const panelHeight = panel?.offsetHeight || 190;
      const navReserve = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
      const summaryRect = summary?.getBoundingClientRect();
      const freeBelow = summaryRect ? window.innerHeight - summaryRect.bottom - navReserve - 14 : panelHeight;
      menu.classList.toggle("menu-up", freeBelow < panelHeight);
    });
  });
}

async function addProject(targetRoute = "home") {
  const name = prompt("Название проекта");
  if (!name) return;
  const projectId = uid("project");
  await put("projects", { id: projectId, name: name.trim(), createdAt: now(), templateId: state.data.templates[0]?.id });
  await refreshData();
  navigate(targetRoute === "classes" ? "classes" : "home", { projectId });
}

async function addClass(projectId) {
  if (!projectId) return notify("Сначала создайте проект.");
  const name = prompt("Название группы");
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
    catalogIds: new FormData(form).getAll("catalogIds"),
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

async function addStudent({ classId, fio, catalogId = "", catalogIds = [], paymentStatus = "unpaid", orderStatus = "not_started" }) {
  if (!classId) return null;
  if (!String(fio || "").trim()) {
    notify("Введите ФИО ученика.");
    return null;
  }
  const { firstName, lastName } = splitFullName(fio);
  const selectedCatalogIds = normalizeCatalogIds(catalogIds.length ? catalogIds : [catalogId || state.data.catalog[0]?.id || ""]);
  const selectedCatalogId = selectedCatalogIds[0] || "";
  const id = uid("student");
  const student = { id, classId, firstName, lastName, qrId: id, catalogId: selectedCatalogId, catalogIds: selectedCatalogIds, paymentStatus, orderStatus, status: "not_started" };
  await put("students", student);
  await put("orders", { id: `order_${id}`, studentId: id, catalogId: selectedCatalogId, catalogIds: selectedCatalogIds, status: orderStatus, items: orderItemsFromCatalogs(selectedCatalogIds) });
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
  state.preserveScroll = true;
  renderStudent();
}

async function deleteProject(projectId) {
  const project = projectById(projectId);
  if (!project) return;
  const classes = classesByProject(projectId);
  const students = classes.flatMap((klass) => state.data.students.filter((student) => student.classId === klass.id));
  if (!confirm(`Удалить проект "${project.name}" вместе с ${classes.length} группами и ${students.length} учениками?`)) return;
  for (const student of students) await deleteStudentRecords(student.id);
  for (const klass of classes) await del("classes", klass.id);
  await del("projects", projectId);
  await refreshData();
  notify("Проект удален.");
  navigate("home");
}

async function renameProject(projectId) {
  const project = projectById(projectId);
  if (!project) return;
  const name = prompt("Название проекта", project.name);
  if (!name?.trim()) return;
  await put("projects", { ...project, name: name.trim() });
  await refreshData();
  notify("Проект переименован.");
  navigate("home");
}

async function deleteClass(classId) {
  const klass = classById(classId);
  if (!klass) return;
  const students = state.data.students.filter((student) => student.classId === classId);
  if (!confirm(`Удалить группу "${klass.name}" вместе с ${students.length} учениками?`)) return;
  for (const student of students) await deleteStudentRecords(student.id);
  await del("classes", classId);
  await refreshData();
  notify("Группа удалена.");
  navigate("classes", { projectId: klass.projectId });
}

async function renameClass(classId) {
  const klass = classById(classId);
  if (!klass) return;
  const name = prompt("Название группы", klass.name);
  if (!name?.trim()) return;
  await put("classes", { ...klass, name: name.trim() });
  await refreshData();
  notify("Группа переименована.");
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
    state.preserveScroll = true;
    render();
  }
}

async function deleteStudentRecords(studentId) {
  for (const item of state.data.media.filter((media) => media.studentId === studentId)) await del("media", item.id);
  for (const order of state.data.orders.filter((entry) => entry.studentId === studentId)) await del("orders", order.id);
  await del("students", studentId);
}

async function updateStudentCatalog(studentId, catalogId) {
  return updateStudentServices(studentId, [catalogId]);
}

async function updateStudentServices(studentId, catalogIds) {
  const student = studentById(studentId);
  if (!student) return;
  const selectedCatalogIds = normalizeCatalogIds(catalogIds);
  if (!selectedCatalogIds.length) return notify("Выберите хотя бы одну услугу.");
  const order = orderByStudent(studentId);
  const nextItems = orderItemsFromCatalogs(selectedCatalogIds, order.items || []);
  await put("students", { ...student, catalogId: selectedCatalogIds[0], catalogIds: selectedCatalogIds });
  await put("orders", { ...order, catalogId: selectedCatalogIds[0], catalogIds: selectedCatalogIds, items: nextItems });
  await refreshData();
  notify("Услуги и чеклист ученика обновлены.");
  state.preserveScroll = true;
  renderStudent();
}

async function addCatalogItem() {
  const title = prompt("Название услуги / пакета", "Пират");
  if (!title) return;
  const mediaKind = normalizeMediaKind(prompt("Тип: фото, видео или оба", "оба"));
  const price = prompt("Цена", "0") || "";
  const orderInfo = prompt("Описание услуги", "Образ, позы, фон, реквизит и нужные кадры.") || "";
  const requirements = prompt("Что нужно для реализации", "Реквизит, чистый фон, свет, референсы.") || "";
  await put("catalog", { id: uid("catalog"), title: title.trim(), mediaKind, price: price.trim(), orderInfo: orderInfo.trim(), requirements: requirements.trim(), angles: [] });
  await refreshData();
  renderServices();
}

async function addAlbumProject() {
  const schoolName = prompt("Название проекта");
  if (!schoolName?.trim()) return;
  const project = { id: uid("album_project"), schoolName: schoolName.trim(), createdAt: now() };
  await put("albumProjects", project);
  await refreshData();
  navigate("albumProject", { albumProjectId: project.id });
}

async function deleteAlbumProject(projectId) {
  const project = albumProjectById(projectId);
  if (!project || !confirm(`Удалить проект "${project.schoolName}" вместе со всеми альбомными группами?`)) return;
  for (const klass of albumClassesByProject(projectId)) await deleteAlbumClassRecords(klass.id);
  await del("albumProjects", projectId);
  await refreshData();
  navigate("albums");
}

async function addAlbumClass(albumProjectId) {
  const project = albumProjectById(albumProjectId);
  if (!project) return;
  const name = prompt("Название группы", "11А");
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
  const name = prompt("Название группы", klass.name);
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
  if (!klass || !confirm(`Удалить альбомную группу "${klass.name}"?`)) return;
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
  const title = prompt("Название общего фото", "Общее фото группы");
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
  const role = prompt("Роль", "Руководитель группы") || "";
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

function uploadCatalogPreview(itemId) {
  state.currentPreview = { kind: "catalog", itemId };
  previewInput.value = "";
  previewInput.click();
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

function importMediaFromDevice(orderType) {
  state.currentCapture = { studentId: state.studentId, type: "photo", orderType };
  mediaInput.accept = "image/*,video/*";
  mediaInput.removeAttribute("capture");
  mediaInput.value = "";
  mediaInput.click();
}

async function handleMediaInput(event) {
  const file = event.target.files?.[0];
  if (!file || !state.currentCapture) return;
  const student = studentById(state.currentCapture.studentId);
  const klass = classById(student.classId);
  const type = fileLooksVideo(file) ? "video" : state.currentCapture.type;
  const ext = extensionFor(file, type);
  const fileName = safeFileName(`${klass.name}_${student.lastName}_${student.firstName}_${state.currentCapture.orderType}.${ext}`);
  const id = uid("media");
  await put("media", {
    id,
    studentId: student.id,
    type,
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
  const fileType = fileLooksVideo(file) ? "video" : "image";
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
  await attachAlbumMediaToOwner(target, media);
  state.currentAlbumMedia = null;
  event.target.value = "";
  await refreshData();
  notify("Медиа альбома сохранено.");
  renderAlbumClass();
}

async function attachAlbumMediaToOwner(target, media) {
  const isVideo = media.fileType === "video" || target.slot === "video";
  if (target.ownerType === "student") {
    const student = albumStudentById(target.ownerId);
    if (!student) return;
    const patch = isVideo
      ? { videoMediaId: media.id }
      : { portraitMediaId: media.id, status: student.status === "not_shot" ? "shot" : student.status };
    await put("albumStudents", { ...student, ...patch });
  }
  if (target.ownerType === "group") {
    const group = albumGroupById(target.ownerId);
    if (group) await put("albumGroupMedia", { ...group, [isVideo ? "videoMediaId" : "mediaId"]: media.id });
  }
  if (target.ownerType === "teacher") {
    const teacher = albumTeacherById(target.ownerId);
    if (teacher) await put("albumTeachers", { ...teacher, [isVideo ? "videoMediaId" : "portraitMediaId"]: media.id });
  }
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

function fitStatusPills() {
  const nodes = Array.from(view.querySelectorAll(".status-pill"));
  for (const node of nodes) {
    node.style.fontSize = "";
    const maxSteps = 6;
    const minPx = 10;
    let current = parseFloat(getComputedStyle(node).fontSize) || 13;
    let steps = 0;
    while (node.scrollWidth > node.clientWidth && steps < maxSteps && current > minPx) {
      current = Math.max(minPx, current - 1);
      node.style.fontSize = `${current}px`;
      steps += 1;
    }
  }
}

async function handlePreviewInput(event) {
  const file = event.target.files?.[0];
  if (!file || !state.currentPreview) return;
  if (!isReferenceImage(file)) {
    notify("Выберите изображение: JPG, PNG, WebP, HEIC/HEIF или GIF.");
    event.target.value = "";
    return;
  }
  const task = state.currentPreview;
  state.currentPreview = null;
  event.target.value = "";
  if (task.kind === "catalog") {
    const item = catalogItemById(task.itemId);
    if (!item) return;
    const previewDataUrl = await fileToDataUrl(file);
    await put("catalog", { ...item, previewDataUrl, previewName: file.name || "preview" });
    await refreshData();
    notify("Превью услуги сохранено.");
    renderServices();
  }
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
  state.preserveScroll = true;
  renderStudent();
}

async function toggleTask(studentId, type) {
  const order = orderByStudent(studentId);
  const item = order.items.find((entry) => entry.type === type);
  if (item) item.status = item.status === "done" ? "pending" : "done";
  await saveOrderWithAutoStatus(studentId, order);
  await refreshData();
  state.preserveScroll = true;
  renderStudent();
}

async function updatePayment(studentId, paymentStatus) {
  const student = studentById(studentId);
  await put("students", { ...student, paymentStatus });
  await refreshData();
  state.preserveScroll = true;
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
  state.preserveScroll = true;
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
  state.preserveScroll = true;
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
  for (const order of state.data.orders) {
    await put("orders", { ...order, catalogId: itemId, catalogIds: [itemId], items: orderItemsFromCatalogs([itemId], order.items || []) });
  }
  for (const student of state.data.students) {
    await put("students", { ...student, catalogId: itemId, catalogIds: [itemId] });
  }
  await refreshData();
  notify("Услуга назначена всем ученикам.");
  renderServices();
}

async function resetDemo() {
  if (!confirm("Очистить локальные данные и создать демо?")) return;
  for (const store of STORE_NAMES) await clearStore(store);
  await put("settings", { id: SETTING_IDS.initialized, value: false });
  await seedIfNeeded();
  await seedCatalogIfNeeded();
  await refreshData();
  navigate("home");
}

async function clearAllData() {
  if (!confirm("Очистить локальные данные? Демо не будет создано автоматически.")) return;
  for (const store of STORE_NAMES) await clearStore(store);
  await put("settings", { id: SETTING_IDS.initialized, value: true });
  await seedCatalogIfNeeded();
  await refreshData();
  state.projectId = null;
  state.classId = null;
  state.studentId = null;
  navigate("home");
}

async function refreshApp() {
  if (!confirm("Обновить приложение и очистить кеш?")) return;
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // ignore
  }
  location.reload();
}

function handleManualQr(event) {
  event.preventDefault();
  openQrValue(new FormData(event.currentTarget).get("qr"));
}

async function openQrValue(value) {
  const parsed = parseQrPayload(value);
  const student = studentFromQrValue(value);
  if (!student) {
    await createStudentFromMissingQr(parsed);
    return;
  }
  navigate("student", { studentId: student.id });
}

async function createStudentFromMissingQr(qrId) {
  if (!qrId || !qrId.startsWith("student_")) {
    notify(`Ученик по QR не найден: ${qrId || "пустой код"}.`);
    return;
  }
  const fio = prompt(`Этот QR есть, но ученика нет в локальной базе. Создать ученика для QR?\n${qrId}`, "");
  if (!fio?.trim()) {
    notify(`Ученик по QR не найден: ${qrId}.`);
    return;
  }
  const classId = await ensureQrFallbackClass();
  const { firstName, lastName } = splitFullName(fio);
  const selectedCatalogId = state.data.catalog[0]?.id || "";
  const selectedCatalogIds = selectedCatalogId ? [selectedCatalogId] : [];
  const student = {
    id: qrId,
    classId,
    firstName,
    lastName,
    qrId,
    catalogId: selectedCatalogId,
    catalogIds: selectedCatalogIds,
    paymentStatus: "unpaid",
    orderStatus: "not_started",
    status: "not_started"
  };
  await put("students", student);
  await put("orders", {
    id: `order_${qrId}`,
    studentId: qrId,
    catalogId: selectedCatalogId,
    catalogIds: selectedCatalogIds,
    status: "not_started",
    items: orderItemsFromCatalogs(selectedCatalogIds)
  });
  await refreshData();
  notify("Ученик создан из QR.");
  navigate("student", { studentId: qrId });
}

async function ensureQrFallbackClass() {
  const existing = state.classId || state.data.classes.find((klass) => klass.projectId === state.projectId)?.id || state.data.classes[0]?.id;
  if (existing) return existing;
  const projectId = uid("project");
  const classId = uid("class");
  await put("projects", { id: projectId, name: "QR импорт", createdAt: now(), templateId: state.data.templates[0]?.id });
  await put("classes", { id: classId, projectId, name: "Без группы" });
  await refreshData();
  return classId;
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
  const files = Array.from(event.target.files || []).filter(fileLooksImage);
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

async function importShootEntries(entries) {
  let currentStudent = null;
  let qrCount = 0;
  let assignedCount = 0;
  let skippedCount = 0;
  let lastStudentId = "";
  const pendingBeforeQr = [];
  const items = [];
  for (const entry of entries.filter(isImageZipEntry).sort(sortZipEntries)) {
    const file = zipEntryToFile(entry, "photo");
    const rawQr = await detectQrFromImageFile(file);
    const qrStudent = rawQr ? studentFromQrValue(parseQrPayload(rawQr)) : null;
    items.push({ file, qrStudent });
  }
  const markers = items.filter((item) => item.qrStudent);
  if (markers.length === 1) {
    currentStudent = markers[0].qrStudent;
    qrCount = 1;
    lastStudentId = currentStudent.id;
    for (const item of items) {
      if (item.qrStudent) continue;
      await importShotForStudent(currentStudent, item.file);
      assignedCount += 1;
    }
    return { qrCount, assignedCount, skippedCount: 0, lastStudentId };
  }
  for (const item of items) {
    if (item.qrStudent) {
      const qrStudent = item.qrStudent;
      currentStudent = qrStudent;
      lastStudentId = qrStudent.id;
      qrCount += 1;
      while (pendingBeforeQr.length) {
        await importShotForStudent(currentStudent, pendingBeforeQr.shift());
        assignedCount += 1;
      }
      continue;
    }
    if (!currentStudent) {
      pendingBeforeQr.push(item.file);
      continue;
    }
    await importShotForStudent(currentStudent, item.file);
    assignedCount += 1;
  }
  skippedCount = pendingBeforeQr.length;
  return { qrCount, assignedCount, skippedCount, lastStudentId };
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

async function importAlbumShootEntries(entries) {
  let currentOwner = null;
  let qrCount = 0;
  let assignedCount = 0;
  let skippedCount = 0;
  const pendingBeforeQr = [];
  const items = [];
  for (const entry of entries.filter(isAlbumMediaZipEntry).sort(sortZipEntries)) {
    const fileType = isVideoZipEntry(entry) ? "video" : "photo";
    const file = zipEntryToFile(entry, fileType);
    let qrOwner = null;
    if (isImageZipEntry(entry)) {
      const rawQr = await detectQrFromImageFile(file);
      qrOwner = rawQr ? albumOwnerFromQrValue(rawQr) : null;
    }
    items.push({ file, qrOwner });
  }
  const markers = items.filter((item) => item.qrOwner);
  if (markers.length === 1) {
    currentOwner = markers[0].qrOwner;
    qrCount = 1;
    for (const item of items) {
      if (item.qrOwner) continue;
      await importAlbumShotForOwner(currentOwner, item.file);
      assignedCount += 1;
    }
    return { qrCount, assignedCount, skippedCount: 0 };
  }
  for (const item of items) {
    if (item.qrOwner) {
      currentOwner = item.qrOwner;
      qrCount += 1;
      while (pendingBeforeQr.length) {
        await importAlbumShotForOwner(currentOwner, pendingBeforeQr.shift());
        assignedCount += 1;
      }
      continue;
    }
    if (!currentOwner) {
      pendingBeforeQr.push(item.file);
      continue;
    }
    await importAlbumShotForOwner(currentOwner, item.file);
    assignedCount += 1;
  }
  skippedCount = pendingBeforeQr.length;
  return { qrCount, assignedCount, skippedCount };
}

async function importAlbumShotForOwner(owner, file) {
  const fileType = fileLooksVideo(file) ? "video" : "image";
  const fileName = safeFileName(file.name || `album_media.${extensionFor(file, fileType === "video" ? "video" : "photo")}`);
  const media = {
    id: uid("album_media"),
    ownerType: owner.ownerType,
    ownerId: owner.ownerId,
    fileName,
    fileType,
    blobId: uid("blob"),
    blob: file,
    createdAt: now()
  };
  await put("albumMedia", media);
  await attachAlbumMediaToOwner(owner, media);
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
  const files = studentId ? await buildExportFiles(studentId) : await buildFullExportFiles();
  const blob = createZip(files);
  downloadBlob(blob, `SPF_${studentId ? "student" : "full"}_${new Date().toISOString().slice(0, 10)}.zip`);
  notify("ZIP экспортирован.");
}

async function exportSettingsZip() {
  const blob = createZip([{
    path: "spf-settings.json",
    data: jsonBytes({
      kind: "spf_settings",
      version: 1,
      exportedAt: now(),
      templates: state.data.templates,
      settings: state.data.settings,
      catalog: state.data.catalog
    })
  }]);
  downloadBlob(blob, `SPF_settings_${new Date().toISOString().slice(0, 10)}.zip`);
  notify("Настройки экспортированы.");
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
    klass?.name || (projectId ? "Все группы проекта" : "Все проекты"),
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

function exportAlbumStatusPdf({ classId = "", albumProjectId = "" } = {}) {
  const classes = classId
    ? state.data.albumClasses.filter((klass) => klass.id === classId)
    : albumClassesByProject(albumProjectId);
  if (!classes.length) return notify("Нет групп для PDF статистики.");
  const project = albumProjectById(albumProjectId || classes[0]?.albumProjectId);
  const subtitle = [
    project?.schoolName,
    classId ? classes[0]?.name : "Все группы проекта",
    new Date().toLocaleDateString("ru-RU")
  ].filter(Boolean).join(" · ");
  const classRows = classes.map((klass) => {
    const stats = albumClassStats(klass.id);
    return `
      <tr>
        <td>${escapeHtml(klass.name)}</td>
        <td>${escapeHtml(albumTypeLabel(klass.albumType))}</td>
        <td>${klass.pagesCount || 0}</td>
        <td>${escapeHtml(albumClassStatusLabel(klass.status))}</td>
        <td>${stats.students}</td>
        <td>${stats.portraits}/${stats.students}</td>
        <td>${stats.videos}</td>
        <td>${stats.teachers}</td>
        <td>${stats.groups}</td>
        <td>${stats.readyPercent}%</td>
      </tr>
    `;
  }).join("");
  const studentRows = classId ? albumStudentsByClass(classId).map((student, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(`${student.lastName} ${student.firstName}`.trim())}</td>
      <td>${student.portraitMediaId ? "Да" : "Нет"}</td>
      <td>${student.videoMediaId ? "Да" : "Нет"}</td>
      <td>${escapeHtml(albumStudentStatusLabel(student.status))}</td>
      <td>${escapeHtml(student.comment || "")}</td>
    </tr>
  `).join("") : "";
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return notify("Браузер заблокировал окно PDF.");
  win.document.write(`
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>Статистика альбомов</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #111827; font-family: Arial, sans-serif; }
          header { margin-bottom: 14px; }
          h1 { margin: 0 0 6px; font-size: 22px; }
          h2 { margin: 18px 0 8px; font-size: 16px; }
          p { margin: 0; color: #4b5563; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { padding: 7px 8px; border: 1px solid #d1d5db; text-align: left; vertical-align: top; }
          th { background: #eef2ff; font-weight: 700; }
          tr:nth-child(even) td { background: #f9fafb; }
          button { min-height: 38px; margin-top: 14px; padding: 0 14px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; font-weight: 700; cursor: pointer; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <header>
          <h1>Статистика выпускных альбомов</h1>
          <p>${escapeHtml(subtitle)}</p>
        </header>
        <table>
          <thead>
            <tr><th>Группа</th><th>Тип</th><th>Страниц</th><th>Статус</th><th>Ученики</th><th>Портреты</th><th>Видео</th><th>Учителя</th><th>Общие фото</th><th>Готовность</th></tr>
          </thead>
          <tbody>${classRows}</tbody>
        </table>
        ${classId ? `
          <h2>Ученики</h2>
          <table>
            <thead><tr><th>#</th><th>Ученик</th><th>Портрет</th><th>Видео</th><th>Статус</th><th>Комментарий</th></tr></thead>
            <tbody>${studentRows}</tbody>
          </table>
        ` : ""}
        <button onclick="window.print()">Сохранить в PDF</button>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  notify("PDF статистики альбомов открыт.");
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
    const previewNames = new Set();
    const selectedServices = selectedCatalogIdsForStudent(student).map((id) => {
      const item = catalogItemById(id);
      return item ? { id: item.id, title: item.title, previewFile: item.previewDataUrl ? uniqueServicePreviewFile(item, previewNames) : "" } : null;
    }).filter(Boolean);
    files.push({ path: `${base}/meta.json`, data: jsonBytes({ student, order, services: selectedServices }) });
    for (const service of selectedServices) {
      if (!service.previewFile) continue;
      const item = catalogItemById(service.id);
      const parsed = item?.previewDataUrl ? dataUrlToBytes(item.previewDataUrl) : null;
      if (!parsed) continue;
      files.push({ path: `${base}/${service.previewFile}`, data: parsed.bytes });
    }
    for (const item of mediaByStudent(student.id)) {
      const folder = item.type === "video" ? "videos" : "photos";
      files.push({ path: `${base}/${folder}/${item.fileName}`, data: new Uint8Array(await item.blob.arrayBuffer()) });
    }
  }
  return files;
}

function uniqueServicePreviewFile(item, taken) {
  const ext = dataUrlExtension(item.previewDataUrl);
  const base = safePath(item.title || "service");
  let fileName = `${base}.${ext}`;
  let index = 2;
  while (taken.has(fileName)) {
    fileName = `${base}_${index}.${ext}`;
    index += 1;
  }
  taken.add(fileName);
  return fileName;
}

async function buildFullExportFiles() {
  const files = [];
  const meta = {
    kind: "spf_full_export",
    version: 1,
    exportedAt: now()
  };
  STORE_NAMES.forEach((store) => {
    meta[store] = state.data[store].map((record) => {
      if (store === "media" || store === "albumMedia") {
        const { blob, ...rest } = record;
        return rest;
      }
      return record;
    });
  });
  files.push({ path: "spf-full-data.json", data: jsonBytes(meta) });
  for (const item of state.data.media) {
    if (!item.blob) continue;
    files.push({ path: `media/${item.id}/${item.fileName}`, data: new Uint8Array(await item.blob.arrayBuffer()) });
  }
  for (const item of state.data.albumMedia) {
    if (!item.blob) continue;
    files.push({ path: `album_media/${item.id}/${item.fileName}`, data: new Uint8Array(await item.blob.arrayBuffer()) });
  }
  for (const item of state.data.catalog) {
    if (!item.previewDataUrl) continue;
    const parsed = dataUrlToBytes(item.previewDataUrl);
    if (!parsed) continue;
    const ext = dataUrlExtension(item.previewDataUrl);
    files.push({ path: `catalog_previews/${item.id}.${ext}`, data: parsed.bytes });
  }
  return files;
}

async function handleZipInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const entries = await parseZip(new Uint8Array(await file.arrayBuffer()));
    const settingsEntry = entries.find((entry) => entry.path.endsWith("spf-settings.json"));
    const fullEntry = entries.find((entry) => entry.path.endsWith("spf-full-data.json"));
    if (settingsEntry || state.zipImportMode === "settings") {
      if (!settingsEntry) throw new Error("spf-settings.json not found");
      await importSettingsMeta(JSON.parse(new TextDecoder().decode(settingsEntry.data)));
      await refreshData();
      notify("Настройки импортированы.");
      renderSettings();
      return;
    }
    if (fullEntry) {
      await importFullMeta(JSON.parse(new TextDecoder().decode(fullEntry.data)), entries);
      await refreshData();
      notify("Все данные импортированы.");
      navigate("home");
      return;
    }
    const dataEntry = entries.find((entry) => entry.path.endsWith("spf-data.json"));
    if (!dataEntry) {
      const result = await importShootEntries(entries);
      if (!result.assignedCount && !result.qrCount) throw new Error("spf-data.json not found");
      await refreshData();
      notify(`ZIP съемки: QR ${result.qrCount}, фото ${result.assignedCount}${result.skippedCount ? `, пропущено ${result.skippedCount}` : ""}.`);
      if (result.lastStudentId) navigate("student", { studentId: result.lastStudentId });
      return;
    }
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
    notify(zipImportErrorMessage(error));
  } finally {
    state.zipImportMode = "auto";
    event.target.value = "";
  }
}

async function importSettingsMeta(meta) {
  for (const store of ["templates", "settings", "catalog"]) {
    for (const record of meta[store] || []) await put(store, record);
  }
}

async function importFullMeta(meta, entries) {
  for (const store of STORE_NAMES) {
    if (store === "media" || store === "albumMedia") continue;
    for (const record of meta[store] || []) await put(store, record);
  }
  for (const record of meta.media || []) {
    const entry = entries.find((item) => item.path.endsWith(`media/${record.id}/${record.fileName}`) || item.path.endsWith(`/${record.fileName}`));
    const blob = new Blob(entry ? [entry.data] : [], { type: record.type === "video" ? "video/mp4" : "image/jpeg" });
    await put("media", { ...record, blob });
  }
  for (const record of meta.albumMedia || []) {
    const entry = entries.find((item) => item.path.endsWith(`album_media/${record.id}/${record.fileName}`) || item.path.endsWith(`/${record.fileName}`));
    const blob = new Blob(entry ? [entry.data] : [], { type: albumMimeType(record) });
    await put("albumMedia", { ...record, blob });
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
    const ownerMedia = albumMediaByOwner("student", student.id);
    files.push({ path: `${folder}/meta.json`, data: jsonBytes({ ...student, mediaFileNames: ownerMedia.map((item) => item.fileName) }) });
    for (const item of ownerMedia) {
      if (!item.blob) continue;
      const prefix = item.fileType === "video" ? "video" : "photo";
      const exportName = uniqueAlbumExportName(exportNames, item, prefix);
      files.push({ path: `${folder}/${exportName}`, data: new Uint8Array(await item.blob.arrayBuffer()) });
    }
  }
  const groupMeta = [];
  for (const group of groups) {
    const ownerMedia = albumMediaByOwner("group", group.id);
    groupMeta.push({ ...group, mediaFileNames: ownerMedia.map((item) => item.fileName) });
    for (const item of ownerMedia) {
      if (!item.blob) continue;
      const prefix = item.fileType === "video" ? "video" : group.type || "photo";
      const exportName = uniqueAlbumExportName(exportNames, item, prefix);
      files.push({ path: `${base}/group_photos/${exportName}`, data: new Uint8Array(await item.blob.arrayBuffer()) });
    }
  }
  files.push({ path: `${base}/group_photos/meta.json`, data: jsonBytes(groupMeta) });
  for (const teacher of teachers) {
    const folder = `${base}/teachers/${safePath(teacher.fullName)}`;
    const ownerMedia = albumMediaByOwner("teacher", teacher.id);
    files.push({ path: `${folder}/meta.json`, data: jsonBytes({ ...teacher, mediaFileNames: ownerMedia.map((item) => item.fileName) }) });
    for (const item of ownerMedia) {
      if (!item.blob) continue;
      const prefix = item.fileType === "video" ? "video" : "photo";
      const exportName = uniqueAlbumExportName(exportNames, item, prefix);
      files.push({ path: `${folder}/${exportName}`, data: new Uint8Array(await item.blob.arrayBuffer()) });
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
    const entries = await parseZip(new Uint8Array(await file.arrayBuffer()));
    const dataEntry = entries.find((entry) => entry.path.endsWith("spf-album-data.json"));
    if (!dataEntry) {
      const result = await importAlbumShootEntries(entries);
      if (!result.assignedCount && !result.qrCount) throw new Error("spf-album-data.json not found");
      await refreshData();
      notify(`ZIP альбомной съемки: QR ${result.qrCount}, файлов ${result.assignedCount}${result.skippedCount ? `, пропущено ${result.skippedCount}` : ""}.`);
      if (state.albumClassId) renderAlbumClass();
      return;
    }
    const meta = JSON.parse(new TextDecoder().decode(dataEntry.data));
    const project = meta.project || { id: uid("album_project"), schoolName: meta.classInfo?.schoolName || "Импортированный альбом", createdAt: now() };
    const klass = meta.klass || { id: uid("album_class"), albumProjectId: project.id, name: meta.classInfo?.className || "Группа", albumType: "standard", pagesCount: 0, status: "not_started", createdAt: now() };
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
    notify(zipImportErrorMessage(error, "альбома"));
  } finally {
    event.target.value = "";
  }
}

function zipImportErrorMessage(error, scope = "") {
  const text = String(error?.message || "");
  if (text.includes("Unsupported ZIP compression") || text.includes("Unable to decompress")) {
    return `Safari не распаковал сжатый ZIP${scope ? ` ${scope}` : ""}. Создайте ZIP без сжатия или импортируйте отдельные фото.`;
  }
  return `Не удалось импортировать ZIP${scope ? ` ${scope}` : ""}.`;
}

function albumExportMediaName(prefix, media) {
  return safeFileName(`${prefix}.${extensionFor({ name: media.fileName, type: albumMimeType(media) }, media.fileType === "video" ? "video" : "photo")}`);
}

function uniqueAlbumExportName(map, media, prefix) {
  const extension = extensionFor({ name: media.fileName, type: albumMimeType(media) }, media.fileType === "video" ? "video" : "photo");
  const taken = new Set(map.values());
  let index = 1;
  let name = safeFileName(`${prefix}.${extension}`);
  while (taken.has(name)) {
    index += 1;
    name = safeFileName(`${prefix}_${index}.${extension}`);
  }
  map.set(media.id, name);
  return name;
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

function isImageZipEntry(entry) {
  return !isIgnoredZipEntry(entry) && /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(entry.path);
}

function isVideoZipEntry(entry) {
  return !isIgnoredZipEntry(entry) && /\.(mp4|mov|m4v|webm)$/i.test(entry.path);
}

function isIgnoredZipEntry(entry) {
  const parts = String(entry.path || "").split("/").filter(Boolean);
  const name = parts.at(-1) || "";
  return parts.includes("__MACOSX") || name.startsWith("._") || name === ".DS_Store";
}

function isAlbumMediaZipEntry(entry) {
  return isImageZipEntry(entry) || isVideoZipEntry(entry);
}

function sortZipEntries(a, b) {
  if (Number.isFinite(a.index) && Number.isFinite(b.index)) return a.index - b.index;
  return a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: "base" });
}

function zipEntryToFile(entry, fallbackType = "photo") {
  const mime = mimeForPath(entry.path, fallbackType);
  const name = entry.path.split("/").filter(Boolean).pop() || `import.${fallbackType === "video" ? "mp4" : "jpg"}`;
  return new File([entry.data], name, { type: mime });
}

function mimeForPath(path, fallbackType = "photo") {
  const ext = String(path || "").split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "mp4" || ext === "m4v") return "video/mp4";
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  return fallbackType === "video" ? "video/mp4" : "image/jpeg";
}

async function parseZip(bytes) {
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
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : await decompressZipEntry(compressed, method);
    entries.push({ path, data, index: entries.length });
    offset = dataStart + compressedSize;
  }
  return entries;
}

async function decompressZipEntry(bytes, method) {
  if (method !== 8 || !("DecompressionStream" in window)) throw new Error("Unsupported ZIP compression");
  for (const format of ["deflate-raw", "deflate"]) {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {}
  }
  throw new Error("Unable to decompress ZIP entry");
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

function albumMediaByOwner(ownerType, ownerId) {
  return state.data.albumMedia
    .filter((media) => media.ownerType === ownerType && media.ownerId === ownerId)
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
}

function albumQrOwner(ownerType, ownerId) {
  if (ownerType === "student") {
    const student = albumStudentById(ownerId);
    if (!student) return null;
    const klass = albumClassById(student.albumClassId);
    return {
      title: "QR ученика альбома",
      subtitle: `${student.lastName} ${student.firstName}`.trim() || klass?.name || "Ученик"
    };
  }
  if (ownerType === "teacher") {
    const teacher = albumTeacherById(ownerId);
    if (!teacher) return null;
    return {
      title: "QR учителя",
      subtitle: [teacher.fullName, teacher.role].filter(Boolean).join(" · ")
    };
  }
  if (ownerType === "group") {
    const group = albumGroupById(ownerId);
    if (!group) return null;
    return {
      title: "QR общих фото",
      subtitle: [group.title, albumGroupTypeLabel(group.type)].filter(Boolean).join(" · ")
    };
  }
  return null;
}

function albumQrPayload(ownerType, ownerId) {
  return `album:${ownerType}:${ownerId}`;
}

function albumOwnerFromQrValue(value) {
  const text = String(value || "").trim();
  let ownerType = "";
  let ownerId = "";
  try {
    const parsed = JSON.parse(text);
    ownerType = parsed.albumOwnerType || parsed.ownerType || "";
    ownerId = parsed.albumOwnerId || parsed.ownerId || "";
  } catch {}
  const match = text.match(/album:(student|teacher|group):([^#\s]+)/i);
  if (match) {
    ownerType = match[1].toLowerCase();
    ownerId = match[2];
  }
  if (!ownerType || !ownerId || !albumQrOwner(ownerType, ownerId)) return null;
  return { ownerType, ownerId };
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

function studentsForClassView(classId) {
  const query = state.query.trim().toLowerCase();
  return state.data.students.filter((student) => {
    if (student.classId !== classId) return false;
    if (!query) return true;
    const klass = classById(student.classId);
    const project = projectById(klass?.projectId);
    return [student.firstName, student.lastName, student.qrId, klass?.name, project?.name].join(" ").toLowerCase().includes(query);
  });
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

function classFinancialStats(classId) {
  const students = state.data.students.filter((student) => student.classId === classId);
  return financialStatsForStudents(students);
}

function projectFinancialStats(projectId) {
  const classIds = new Set(classesByProject(projectId).map((klass) => klass.id));
  const students = state.data.students.filter((student) => classIds.has(student.classId));
  return financialStatsForStudents(students);
}

function financialStatsForStudents(students) {
  const totals = students.reduce((acc, student) => {
    const amount = studentTotalPrice(student);
    const done = completion(student.id).doneCount;
    const total = completion(student.id).total;
    acc.totalAmount += amount;
    acc.totalTasks += total;
    acc.doneTasks += done;
    if (student.paymentStatus === "paid") {
      acc.paidAmount += amount;
      acc.paidStudents += 1;
    }
    return acc;
  }, { students: students.length, totalAmount: 0, paidAmount: 0, paidStudents: 0, totalTasks: 0, doneTasks: 0 });
  const remainingAmount = Math.max(0, totals.totalAmount - totals.paidAmount);
  return {
    ...totals,
    remainingAmount,
    paymentPercent: totals.totalAmount ? Math.round((totals.paidAmount / totals.totalAmount) * 100) : 0,
    workPercent: totals.totalTasks ? Math.round((totals.doneTasks / totals.totalTasks) * 100) : 0
  };
}

function studentTotalPrice(student) {
  return selectedCatalogIdsForStudent(student).reduce((sum, id) => sum + parseMoney(catalogItemById(id)?.price), 0);
}

function parseMoney(value) {
  const text = String(value || "").replace(/\s+/g, "").replace(",", ".");
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatMoney(value) {
  return `${Math.round(Number(value || 0)).toLocaleString("ru-RU")} ₽`;
}

function statusExportColumns() {
  return [
    { key: "number", label: "#", value: (_student, index) => index + 1 },
    { key: "student", label: "Ученик", value: (student) => `${student.lastName} ${student.firstName}`.trim() },
    { key: "class", label: "Группа", value: (student) => classById(student.classId)?.name || "" },
    { key: "payment", label: "Оплата", value: (student) => paymentLabel(student.paymentStatus) },
    { key: "catalog", label: "Услуги", value: (student) => selectedCatalogIdsForStudent(student).map((id) => catalogItemById(id)?.title).filter(Boolean).join(", ") || "Не выбраны" },
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
  if (state.filter === "unpaid") return student.paymentStatus !== "paid";
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
  const parsed = parseServiceTaskType(type);
  if (parsed) return catalogItemById(parsed.catalogId)?.angles?.find((entry) => entry.id === parsed.angleId) || null;
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
  return orderItemsFromCatalogs([catalogId]);
}

function orderItemsFromCatalogs(catalogIds, existingItems = []) {
  const selected = normalizeCatalogIds(catalogIds);
  const items = [];
  selected.forEach((catalogId) => {
    const catalog = catalogItemById(catalogId);
    (catalog?.angles || []).forEach((angle) => {
      const type = serviceTaskType(catalogId, angle.id);
      const existing = existingItems.find((item) => item.type === type);
      items.push(existing
        ? { ...existing, label: serviceTaskLabel(catalog, angle) }
        : { type, label: serviceTaskLabel(catalog, angle), status: "pending", fileIds: [] });
    });
  });
  if (items.length) return items;
  return orderItemsFromTemplate();
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
  const parsed = parseServiceTaskType(type);
  if (parsed) {
    const catalog = catalogItemById(parsed.catalogId);
    const angle = catalog?.angles?.find((entry) => entry.id === parsed.angleId);
    if (catalog && angle) return serviceTaskLabel(catalog, angle);
  }
  return catalogAngleByType(type)?.name || ORDER_TYPES[type] || type;
}

function orderItemLabel(item) {
  return item?.label || orderTypeLabel(item?.type || "");
}

function templateItemsForSettings(template) {
  const labels = template.labels || {};
  return (template.items || Object.keys(ORDER_TYPES)).map((type) => ({ type, label: labels[type] || orderTypeLabel(type) }));
}

function selectedCatalogIdsForStudent(student) {
  return normalizeCatalogIds(student?.catalogIds?.length ? student.catalogIds : [student?.catalogId || state.data.catalog[0]?.id || ""]);
}

function normalizeCatalogIds(catalogIds) {
  const ids = Array.from(new Set((catalogIds || []).map(String).map((id) => id.trim()).filter(Boolean)));
  return ids.filter((id) => catalogItemById(id));
}

function serviceTaskType(catalogId, angleId) {
  return `${catalogId}__${angleId}`;
}

function parseServiceTaskType(type) {
  const text = String(type || "");
  if (!text.includes("__")) return null;
  const [catalogId, ...rest] = text.split("__");
  return { catalogId, angleId: rest.join("__") };
}

function serviceTaskLabel(catalog, angle) {
  return `${catalog.title}: ${angle.name}`;
}

function paymentLabel(status) {
  return status === "paid" ? "Оплачено" : "Не оплачено";
}

function studentServicePreviewUrl(student) {
  const ids = selectedCatalogIdsForStudent(student);
  for (const id of ids) {
    const item = catalogItemById(id);
    if (item?.previewDataUrl) return item.previewDataUrl;
  }
  return "";
}

function studentAvatarUrl(student) {
  const photo = mediaByStudent(student.id).find((item) => item.type === "photo" || item.type === "image");
  if (photo?.blob) return URL.createObjectURL(photo.blob);
  return "";
}

function classCoverClass(name) {
  const normalized = String(name || "").toUpperCase();
  if (normalized.includes("4А") || normalized.includes("4A")) return "cover-green";
  if (normalized.includes("4Б") || normalized.includes("4B")) return "cover-blue";
  if (normalized.includes("9А") || normalized.includes("9A")) return "cover-purple";
  if (normalized.includes("11А") || normalized.includes("11A")) return "cover-gold";
  return "cover-blue";
}

function pluralizeRu(count, one, few, many) {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function statusDot(status) {
  const colorClass = status === "paid" || status === "ready" || status === "delivered" ? "dot-green" : status === "processing" || status === "shooting" ? "dot-blue" : "dot-yellow";
  return `<span class="status-dot ${colorClass}"></span>`;
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
  if (!student) return notify("Ученик не найден.");
  const value = studentQrPayload(student);
  const name = `${student.lastName} ${student.firstName}`.trim() || "Ученик";
  showQrPanel({
    value,
    title: "QR ученика",
    subtitle: name,
    codeLabel: student.qrId || student.id
  });
}

function showAlbumQrPayload(payload) {
  const [ownerType, ownerId] = String(payload || "").split(":");
  const owner = albumQrOwner(ownerType, ownerId);
  if (!owner) return notify("Объект альбома не найден.");
  showQrPanel({
    value: albumQrPayload(ownerType, ownerId),
    title: owner.title,
    subtitle: owner.subtitle,
    codeLabel: `${ownerType}:${ownerId}`
  });
}

function showQrPanel({ value, title: panelTitle, subtitle = "", codeLabel = value }) {
  const svg = createQrSvg(value, 7);
  document.querySelector(".qr-panel-backdrop")?.remove();
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop";
  panel.innerHTML = `
    <section class="qr-panel" role="dialog" aria-modal="true" aria-label="${escapeAttr(panelTitle)}">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHtml(panelTitle)}</h2>
          ${subtitle ? `<p class="muted">${escapeHtml(subtitle)}</p>` : ""}
        </div>
        <button class="icon-button" data-close-qr-panel type="button" aria-label="Закрыть">x</button>
      </div>
      <div class="qr-panel-code">${svg}</div>
      <code>${escapeHtml(codeLabel)}</code>
      <div class="toolbar">
        <button class="secondary-button" data-copy-qr-value type="button">Скопировать ID</button>
        <button class="primary-button" data-close-qr-panel type="button">Готово</button>
      </div>
    </section>
  `;
  const close = () => panel.remove();
  panel.addEventListener("click", (event) => {
    if (event.target === panel || event.target.closest("[data-close-qr-panel]")) close();
  });
  panel.querySelector("[data-copy-qr-value]")?.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(codeLabel).catch(() => {});
    notify("QR ID скопирован.");
  });
  document.body.append(panel);
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

function dataUrlExtension(dataUrl) {
  const mime = String(dataUrl || "").slice(0, 64);
  if (mime.includes("image/png")) return "png";
  if (mime.includes("image/webp")) return "webp";
  if (mime.includes("image/gif")) return "gif";
  return "jpg";
}

function dataUrlToBytes(dataUrl) {
  const text = String(dataUrl || "");
  const match = text.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { mime: match[1], bytes };
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

function fileLooksVideo(file) {
  return file?.type?.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/i.test(file?.name || "");
}

function fileLooksImage(file) {
  return file?.type?.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file?.name || "");
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
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M9 9h2v2H9zM13 9h2v2h-2zM9 13h2v2H9zM14 14h1v1h-1z"/></svg>',
    classes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
    catalog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h10a4 4 0 0 1 4 4v12H8a3 3 0 0 1-3-3Z"/><path d="M8 4v13a3 3 0 0 0 3 3"/><path d="M11 8h5M11 12h5"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/><path d="M4 12h5"/><path d="M13 12h7"/><circle cx="11" cy="12" r="2"/></svg>',
    theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 1 0 9 6 8 8 0 1 1-9-6Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18 9 12l6-6"/><path d="M9 12h12"/><path d="M3 12h6"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="3"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h11v12H4z"/><path d="m15 10 5-3v10l-5-3z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m20 6-11 11-5-5"/></svg>'
    ,
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 1-15.3 6.4L3 16"/><path d="M3 16v5h5"/><path d="M3 12A9 9 0 0 1 18.3 5.6L21 8"/><path d="M21 8V3h-5"/></svg>'
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

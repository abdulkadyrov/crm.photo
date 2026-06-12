const DB_NAME = "school-photo-flow";
const APP_NAME = "Vakha Studio";
const APP_LOGO_SRC = "./icons/vakha-studio-logo.png";
const DB_VERSION = 6;
const STORE_NAMES = [
  "projects",
  "classes",
  "students",
  "orders",
  "media",
  "operators",
  "operatorEvents",
  "templates",
  "settings",
  "catalog",
  "albumProjects",
  "albumClasses",
  "albumStudents",
  "albumGroupMedia",
  "albumTeachers",
  "albumMedia",
  "finalWorks",
  "documents"
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
  shot: "Снято",
  processed: "Обработано",
  printed: "Напечатано",
  delivered: "Выдан"
};
const STUDENT_AUTO_STATUS_KEYS = ["not_started", "shooting", "shot", "processed"];
const STUDENT_MANUAL_STATUS_KEYS = ["printed", "delivered"];
const LEGACY_STUDENT_STATUS_MAP = {
  processing: "shooting",
  ready: "processed"
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
  shot: "Снято",
  layout: "Верстка",
  print_ready: "Готово к печати",
  printed: "Напечатано",
  delivered: "Выдано"
};
const ALBUM_CLASS_MANUAL_STATUS_KEYS = ["layout", "print_ready", "printed", "delivered"];
const LEGACY_ALBUM_CLASS_STATUS_MAP = {
  editing: "layout",
  ready: "print_ready",
  printing: "printed"
};
const ALBUM_STUDENT_STATUSES = {
  not_shot: "Не снят",
  shot: "Снято",
  processed: "Обработано",
  ready: "Готов"
};
const LEGACY_ALBUM_STUDENT_STATUS_MAP = {
  editing: "processed"
};
const DOCUMENT_ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"];
const DOCUMENT_ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp"
];
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
  initialized: "spf-initialized",
  catalogWatermark: "spf-catalog-watermark",
  serviceCategories: "spf-service-categories",
  finalWorkPrint: "spf-final-work-print"
};
const OPERATOR_STORAGE_KEY = "spf-current-operator-id";
const OPERATOR_SKIP_SESSION_KEY = "spf-skip-operator-gate";
const UNKNOWN_OPERATOR_ID = "unknown_operator";
const OPERATOR_ROLES = {
  owner: "Владелец",
  photographer: "Фотограф",
  designer: "Дизайнер"
};
const TRANSFER_APP_NAME = APP_NAME;
const TRANSFER_LEGACY_APP_NAMES = ["School Photo Flow"];
const TRANSFER_SCHEMA_VERSION = 1;
const TRANSFER_STORE_MAP = {
  operators: "operators",
  operatorEvents: "operatorEvents",
  projects: "projects",
  classes: "classes",
  students: "students",
  services: "catalog",
  orders: "orders",
  media: "media",
  finalWorks: "finalWorks",
  documents: "documents",
  settings: "settings",
  checklistTemplates: "templates"
};
const TRANSFER_STORE_ORDER = ["operators", "operatorEvents", "projects", "classes", "services", "checklistTemplates", "settings", "students", "orders", "media", "finalWorks", "documents"];
const TRANSFER_COUNT_LABELS = {
  operators: "сотрудников",
  operatorEvents: "действий",
  projects: "проектов",
  classes: "классов",
  students: "учеников",
  services: "услуг",
  orders: "заказов",
  media: "медиа",
  finalWorks: "готовых работ",
  documents: "документов",
  settings: "настроек",
  checklistTemplates: "шаблонов"
};
const TRANSFER_IMPORT_SCOPES = {
  project: ["operators", "projects", "classes", "students", "orders", "media", "finalWorks", "documents", "services", "settings", "checklistTemplates"],
  class: ["operators", "projects", "classes", "students", "orders", "media", "finalWorks", "documents", "services", "settings", "checklistTemplates"],
  operators: ["operators"],
  services: ["services"],
  settings: ["operators", "settings", "checklistTemplates"],
  work_config: ["operators", "services", "settings", "checklistTemplates"],
  full_backup: ["operators", "operatorEvents", "projects", "classes", "students", "orders", "media", "finalWorks", "documents", "services", "settings", "checklistTemplates"]
};
const CLASS_SORT_MODES = {
  manual: "Ручной порядок",
  numeric: "По цифрам",
  alpha: "По алфавиту"
};
const SERVICE_SORT_MODES = {
  manual: "Свой порядок",
  alpha: "По алфавиту",
  category: "По категориям"
};
const SERVICE_UNCATEGORIZED = "__uncategorized";
const SERVICE_DEFAULT_CATEGORIES = ["Мультики", "Военные", "Спортивные", "Сказочные", "Профессии", "Праздничные"];
const CLASS_COLOR_OPTIONS = [
  { id: "blue", label: "Синий", accent: "#2563eb", gradient: "linear-gradient(135deg, #2563eb, #818cf8)" },
  { id: "green", label: "Зеленый", accent: "#16a34a", gradient: "linear-gradient(135deg, #22c55e, #86efac)" },
  { id: "gold", label: "Золотой", accent: "#d97706", gradient: "linear-gradient(135deg, #d97706, #fbbf24)" },
  { id: "teal", label: "Бирюза", accent: "#0f766e", gradient: "linear-gradient(135deg, #0f766e, #5eead4)" },
  { id: "rose", label: "Розовый", accent: "#be123c", gradient: "linear-gradient(135deg, #be123c, #fb7185)" },
  { id: "slate", label: "Серый", accent: "#475569", gradient: "linear-gradient(135deg, #334155, #94a3b8)" }
];

const state = {
  route: "home",
  projectId: null,
  classId: null,
  studentFormClassId: null,
  studentId: null,
  catalogId: null,
  filter: "all",
  query: "",
  catalogAudience: "all",
  catalogQuery: "",
  catalogCategory: "all",
  serviceSort: "manual",
  serviceCategoryFilter: "all",
  selectedServiceIds: new Set(),
  currentOperatorId: localStorage.getItem(OPERATOR_STORAGE_KEY) || "",
  profileOperatorId: "",
  unknownOperatorWarned: false,
  db: null,
  data: emptyData(),
  currentCapture: null,
  currentReference: null,
  currentPreview: null,
  currentAlbumMedia: null,
  currentFinalWork: null,
  currentDocumentTarget: null,
  currentImportDraft: null,
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
const shootFolderInput = document.querySelector("#shoot-folder-input");
const zipInput = document.querySelector("#zip-input");
const transferFolderInput = document.querySelector("#transfer-folder-input");
const albumMediaInput = document.querySelector("#album-media-input");
const albumZipInput = document.querySelector("#album-zip-input");
const finalWorkInput = document.querySelector("#final-work-input");
const documentInput = document.querySelector("#document-input");

init();

async function init() {
  injectIcons();
  lockGestures();
  document.documentElement.dataset.theme = localStorage.getItem("spf-theme") || "light";
  state.db = await openDb();
  await seedIfNeeded();
  await seedCatalogIfNeeded();
  await refreshData();
  normalizeCurrentOperator();
  bindShell();
  if (shouldShowOperatorGate()) {
    renderOperatorGate();
    registerServiceWorker();
    return;
  }
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
    operators: [],
    operatorEvents: [],
    templates: [],
    settings: [],
    catalog: [],
    finalWorks: [],
    documents: []
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

function normalizeCurrentOperator() {
  const stored = localStorage.getItem(OPERATOR_STORAGE_KEY) || "";
  const operator = state.data.operators.find((item) => item.id === stored && item.isActive !== false);
  if (operator) {
    state.currentOperatorId = operator.id;
    return;
  }
  state.currentOperatorId = "";
  localStorage.removeItem(OPERATOR_STORAGE_KEY);
}

function shouldShowOperatorGate() {
  if (sessionStorage.getItem(OPERATOR_SKIP_SESSION_KEY) === "true") return false;
  if (!state.data.operators.length) return true;
  return !currentOperator() && activeOperators().length > 0;
}

function renderOperatorGate() {
  const hasOperators = state.data.operators.length > 0;
  setShell({
    heading: hasOperators ? "Кто работает?" : "Создать главный профиль",
    context: "Локальный профиль",
    summary: hasOperators ? "Выберите сотрудника и введите код" : "Первичная настройка владельца"
  });
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  const active = activeOperators();
  view.innerHTML = hasOperators ? `
    <section class="operator-gate">
      <form class="panel grid operator-auth-card" data-operator-login>
        <div>
          <h2 class="card-title">Кто работает?</h2>
          <p class="muted">Код нужен только чтобы случайно не войти под чужим именем.</p>
        </div>
        <div class="operator-choice-list">
          ${active.map((operator, index) => `
            <label class="operator-choice">
              <input type="radio" name="operatorId" value="${operator.id}" ${index === 0 ? "checked" : ""} />
              <span class="operator-avatar">${escapeHtml(operatorInitials(operator))}</span>
              <span><strong>${escapeHtml(operator.name)}</strong><small>${escapeHtml(operatorRoleLabel(operator.role))}</small></span>
            </label>
          `).join("") || '<p class="muted">Активных сотрудников нет.</p>'}
        </div>
        <label class="field-label"><span>Код</span><input class="input" name="code" inputmode="numeric" pattern="[0-9]{4,6}" autocomplete="off" placeholder="4-6 цифр" /></label>
        <div class="toolbar">
          <button class="secondary-button" data-skip-operator-gate type="button">Продолжить без профиля</button>
          <button class="secondary-button" data-import-operator-gate type="button">Импорт профиля</button>
          <button class="primary-button" type="submit">Войти</button>
        </div>
      </form>
    </section>
  ` : `
    <section class="operator-gate">
      <form class="panel grid operator-auth-card" data-owner-setup>
        <div>
          <h2 class="card-title">Создать главный профиль</h2>
          <p class="muted">Этот профиль будет владельцем на главном компьютере.</p>
        </div>
        <label class="field-label"><span>Имя</span><input class="input" name="name" required autocomplete="name" placeholder="Например: Расул" /></label>
        <label class="field-label"><span>Код</span><input class="input" name="code" required inputmode="numeric" pattern="[0-9]{4,6}" autocomplete="off" placeholder="4-6 цифр" /></label>
        <div class="detail-stat"><span>Роль</span><strong>Владелец</strong></div>
        <div class="toolbar">
          <button class="secondary-button" data-skip-operator-gate type="button">Продолжить без профиля</button>
          <button class="secondary-button" data-import-operator-gate type="button">Импорт профиля</button>
          <button class="primary-button" type="submit">Создать профиль</button>
        </div>
      </form>
    </section>
  `;
  view.querySelector("[data-owner-setup]")?.addEventListener("submit", handleOwnerSetup);
  view.querySelector("[data-operator-login]")?.addEventListener("submit", handleOperatorLogin);
  view.querySelector("[data-skip-operator-gate]")?.addEventListener("click", continueWithoutOperator);
  view.querySelector("[data-import-operator-gate]")?.addEventListener("click", () => {
    state.zipImportMode = "work_config";
    zipInput.click();
  });
  injectIcons();
}

async function handleOwnerSetup(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.name.value.trim();
  const code = normalizeOperatorCode(form.elements.code.value);
  if (!name) return notify("Введите имя владельца.");
  if (!code) return notify("Код должен быть из 4-6 цифр.");
  const operator = createOperatorRecord({ name, code, role: "owner" });
  await put("operators", operator);
  await refreshData();
  setCurrentOperator(operator.id);
  notify("Главный профиль создан.");
  navigateFromUrl() || navigate("home");
}

async function handleOperatorLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const operator = operatorById(new FormData(form).get("operatorId"));
  const code = normalizeOperatorCode(form.elements.code.value);
  if (!operator) return notify("Выберите сотрудника.");
  if (operator.code !== code) return notify("Неверный код сотрудника.");
  setCurrentOperator(operator.id);
  notify(`Вход: ${operator.name}.`);
  navigateFromUrl() || navigate("home");
}

function continueWithoutOperator() {
  sessionStorage.setItem(OPERATOR_SKIP_SESSION_KEY, "true");
  state.currentOperatorId = "";
  localStorage.removeItem(OPERATOR_STORAGE_KEY);
  notify("Профиль не выбран. Действия будут сохранены как неизвестный сотрудник.");
  navigateFromUrl() || navigate("home");
}

function setCurrentOperator(operatorId) {
  state.currentOperatorId = operatorId || "";
  sessionStorage.removeItem(OPERATOR_SKIP_SESSION_KEY);
  if (operatorId) localStorage.setItem(OPERATOR_STORAGE_KEY, operatorId);
  else localStorage.removeItem(OPERATOR_STORAGE_KEY);
}

function activeOperators() {
  return state.data.operators.filter((operator) => operator.isActive !== false);
}

function operatorById(operatorId) {
  const id = String(operatorId || "");
  if (!id) return null;
  return state.data.operators.find((operator) => operator.id === id || (operator.aliases || []).includes(id)) || null;
}

function currentOperator() {
  const operator = operatorById(state.currentOperatorId);
  return operator?.isActive === false ? null : operator;
}

function currentOperatorIdForAction({ warn = true } = {}) {
  const operator = currentOperator();
  if (operator) return operator.id;
  if (warn) warnUnknownOperator();
  return UNKNOWN_OPERATOR_ID;
}

function warnUnknownOperator() {
  if (state.unknownOperatorWarned) return;
  state.unknownOperatorWarned = true;
  notify("Профиль не выбран. Действия будут сохранены как неизвестный сотрудник.");
}

function createOperatorRecord({ name, code, role = "photographer", id = "" }) {
  const time = now();
  return {
    id: id || uid("operator"),
    name: String(name || "").trim(),
    code: normalizeOperatorCode(code),
    role: normalizeOperatorRole(role),
    isActive: true,
    createdAt: time,
    updatedAt: time
  };
}

function normalizeOperatorCode(value) {
  const code = String(value || "").replace(/\D/g, "");
  return /^\d{4,6}$/.test(code) ? code : "";
}

function normalizeOperatorRole(role) {
  return OPERATOR_ROLES[role] ? role : "photographer";
}

function operatorRoleLabel(role) {
  return OPERATOR_ROLES[role] || "Неизвестный сотрудник";
}

function operatorDisplayName(operatorId) {
  if (operatorId === UNKNOWN_OPERATOR_ID) return "Неизвестный сотрудник";
  return operatorById(operatorId)?.name || "Неизвестный сотрудник";
}

function operatorInitials(operator) {
  const parts = String(operator?.name || "?").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?";
}

function stampCreated(record, { warn = true } = {}) {
  const time = now();
  const operatorId = currentOperatorIdForAction({ warn });
  return {
    ...record,
    createdAt: record.createdAt || time,
    updatedAt: time,
    createdBy: record.createdBy || operatorId,
    updatedBy: operatorId
  };
}

function stampUpdated(record, { warn = true } = {}) {
  return {
    ...record,
    updatedAt: now(),
    updatedBy: currentOperatorIdForAction({ warn })
  };
}

function stampImported(record, { warn = true } = {}) {
  const operatorId = currentOperatorIdForAction({ warn });
  const time = now();
  return {
    ...record,
    createdAt: record.createdAt || time,
    updatedAt: time,
    createdBy: record.createdBy || operatorId,
    updatedBy: operatorId,
    importedBy: operatorId,
    importedAt: time
  };
}

function stampExported(record, { warn = true } = {}) {
  return {
    ...record,
    exportedBy: currentOperatorIdForAction({ warn }),
    exportedAt: now()
  };
}

async function recordOperatorEvent(type, patch = {}) {
  const operatorId = patch.operatorId || currentOperatorIdForAction({ warn: false });
  const event = {
    id: uid("operator_event"),
    type,
    operatorId,
    createdAt: now(),
    ...patch
  };
  if (type === "export") event.exportedBy = operatorId;
  if (type === "import") event.importedBy = operatorId;
  await put("operatorEvents", event);
  return event;
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
    await put("students", { id, classId, firstName, lastName, qrId: id, paymentStatus, orderStatus: "", catalogId, status: "" });
    await put("orders", { id: `order_${id}`, studentId: id, status: "", catalogId, items: catalogId ? orderItemsFromCatalog(catalogId) : defaultOrderItems() });
  }
  await put("settings", { id: SETTING_IDS.initialized, value: true });
}

async function seedCatalogIfNeeded() {
  const catalog = await getAll("catalog");
  if (catalog.length) return;
  await put("catalog", {
    id: uid("catalog"),
    title: "Стандартный проектный пакет",
    name: "Стандартный проектный пакет",
    mediaKind: "both",
    price: "0",
    shortDescription: "Портреты, полный рост, профиль, короткое видео и интервью.",
    description: "Базовый пакет для школьной фотосъемки с набором ракурсов и короткими видео-сценами.",
    gender: "unisex",
    category: "",
    popular: false,
    orderIndex: 0,
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
    button.addEventListener("click", () => {
      const route = button.dataset.route;
      if (route === "classes") return navigate("classes", { classId: null, studentFormClassId: null });
      navigate(route);
    });
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
  shootFolderInput.addEventListener("change", handleShootImport);
  zipInput.addEventListener("change", handleZipInput);
  transferFolderInput?.addEventListener("change", handleTransferFolderInput);
  albumMediaInput.addEventListener("change", handleAlbumMediaInput);
  albumZipInput.addEventListener("change", handleAlbumZipInput);
  finalWorkInput?.addEventListener("change", handleFinalWorkInput);
  documentInput?.addEventListener("change", handleDocumentInput);
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
    item.classList.toggle("active", itemRoute === route || (itemRoute === "albums" && route.startsWith("album")) || (itemRoute === "settings" && ["settings", "profile", "services", "serviceDetail", "catalog"].includes(route)));
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
    studentFormClassId: state.studentFormClassId,
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
    profile: renderProfile,
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
    state.studentFormClassId = null;
    return renderClasses();
  }
  if (state.route === "student") return navigateBackFromStudent();
  if (state.route === "services") return navigate("settings");
  if (state.route === "serviceDetail") return navigate("services");
  if (state.route === "catalog") return navigate("settings");
  if (state.route === "profile") return navigate("settings");
  if (state.route === "albumProject") return navigate("albums");
  if (state.route === "albumClass") {
    const klass = albumClassById(state.albumClassId);
    return navigate("albumProject", { albumProjectId: klass?.albumProjectId || state.albumProjectId });
  }
  return history.length > 1 ? history.back() : navigate("home");
}

function setShell({ heading, context = APP_NAME, summary = "" }) {
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
    context: projects[0]?.name || APP_NAME,
    summary: `${classes.length} групп • ${students.length} учеников · ${done} из ${total} задач выполнено`
  });
  view.innerHTML = `
    <section class="crm-overview">
      <article class="brand-hero" aria-label="${APP_NAME}">
        <img class="brand-hero-logo" src="${APP_LOGO_SRC}" alt="${APP_NAME}" />
      </article>
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
        ${filterChip("processing", "На съемке")}
        ${filterChip("ready", "Обработано")}
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
  const finance = projectFinancialStats(project.id);
  const docsCount = documentsForOwner("project", project.id).length;
  return `
    <article class="list-card card-button" data-open-project="${project.id}">
      <div class="list-card-main">
        <span class="list-icon metric-blue" data-icon="classes"></span>
        <div class="list-copy">
          <h2 class="card-title">${escapeHtml(project.name)}</h2>
          <p class="muted">${classes.length} групп · ${students.length} учеников · Документы: ${docsCount}</p>
          <div class="progress-label"><span>Прогресс ${pct}%</span></div>
          <div class="progress"><span style="width:${pct}%"></span></div>
          <div class="progress-label"><span>Оплачено ${formatMoney(finance.paidAmount)} из ${formatMoney(finance.totalAmount)}</span><strong>${finance.paymentPercent}%</strong></div>
          <div class="progress finance-mini-progress"><span style="width:${finance.paymentPercent}%"></span></div>
        </div>
        <details class="item-menu">
          <summary aria-label="Меню проекта">...</summary>
          <div class="menu-panel">
            <button data-open-project-action="${project.id}" type="button">Открыть</button>
            <button data-export-status-project="${project.id}" type="button">Экспорт</button>
            <button data-export-project="${project.id}" type="button">ZIP проекта</button>
            <button data-open-project-documents="${project.id}" type="button">Документы</button>
            <button data-assign-operator-project="${project.id}" type="button">Назначить сотрудника</button>
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
  const sortMode = classSortMode(project);
  const allProjectStudents = classes.flatMap((klass) => state.data.students.filter((student) => student.classId === klass.id));
  const doneTasks = allProjectStudents.reduce((sum, student) => sum + completion(student.id).doneCount, 0);
  const totalTasks = allProjectStudents.reduce((sum, student) => sum + completion(student.id).total, 0);
  if (state.classId && !classes.some((klass) => klass.id === state.classId)) state.classId = null;
  if (state.studentFormClassId && !classes.some((klass) => klass.id === state.studentFormClassId)) state.studentFormClassId = null;
  const isClassOpen = Boolean(state.classId);
  const formClassId = state.studentFormClassId;
  setShell({
    heading: project?.name || "Группы",
    context: "Проекты",
    summary: `${classes.length} групп · ${allProjectStudents.length} ученика · ${doneTasks} из ${totalTasks} задач выполнено`
  });
  view.innerHTML = `
    ${isClassOpen ? "" : `<section class="projects-actions">
      <select class="select project-select" data-project-select aria-label="Проект">
        ${projects.map((project) => `<option value="${project.id}" ${project.id === activeProject ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}
      </select>
      <div class="project-button-row">
        <button class="secondary-button equal-button" data-export-status-project="${activeProject}" type="button"><span data-icon="catalog"></span>PDF статусов</button>
        <button class="primary-button equal-button" data-add-class="${activeProject}" type="button"><span data-icon="plus"></span>Группа</button>
      </div>
    </section>`}
    ${!isClassOpen && activeProject ? documentsSection("project", activeProject) : ""}
    ${formClassId ? studentQuickForm(formClassId) : ""}
    ${isClassOpen ? "" : `
      <section class="class-order-toolbar">
        <label>
          <span>Порядок групп</span>
          <select class="select" data-class-sort-project="${activeProject}" aria-label="Порядок групп">
            ${Object.entries(CLASS_SORT_MODES).map(([value, label]) => `<option value="${value}" ${sortMode === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <p class="muted">Для ручного порядка используйте кнопки "Выше" и "Ниже" в меню карточки.</p>
      </section>
      <section class="group-card-grid">
        ${classes.map((klass, index) => classCard(klass, index, classes.length, sortMode)).join("") || empty("В проекте пока нет групп")}
      </section>
      ${state.classStatsId ? classStatsPanel(state.classStatsId) : ""}
    `}
    ${isClassOpen ? classStudentSection(state.classId) : ""}
  `;
  bindViewActions();
  addContextBackButton();
}

function classStudentSection(classId) {
  const klass = classById(classId);
  if (!klass) return "";
  const students = studentsForClassView(klass.id);
  return `
    <section class="class-section">
      <div class="toolbar">
        <h2 class="card-title">Ученики группы ${escapeHtml(klass.name)}</h2>
        <div class="row">
          <button class="primary-button compact" data-add-student="${klass.id}" type="button">Ученик</button>
          <button class="secondary-button compact" data-close-class-students type="button">Свернуть</button>
        </div>
      </div>
      ${documentsSection("group", klass.id)}
      <div class="student-list">
        ${students.map(studentCard).join("") || '<p class="muted class-empty">Добавьте учеников в группу.</p>'}
      </div>
    </section>
  `;
}

function classCard(klass, index = 0, total = 0, sortMode = "manual") {
  const allStudents = state.data.students.filter((student) => student.classId === klass.id);
  const done = allStudents.filter((student) => completion(student.id).done).length;
  const pct = allStudents.length ? Math.round((done / allStudents.length) * 100) : 0;
  const finance = classFinancialStats(klass.id);
  const color = classColorOption(klass.color, klass.name);
  const manualMoveDisabled = sortMode !== "manual";
  const docsCount = documentsForOwner("group", klass.id).length;
  return `
    <article class="class-card group-card card-button" data-open-class="${klass.id}" tabindex="0" style="--class-accent:${escapeAttr(color.accent)};">
      <div class="class-cover" style="background:${escapeAttr(color.gradient)};">
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
              <button data-open-class-action="${klass.id}" type="button">Открыть группу</button>
              <button data-add-student="${klass.id}" type="button">Добавить ученика</button>
              <button data-show-class-stats="${klass.id}" type="button">Статистика</button>
              <button data-export-status-class="${klass.id}" type="button">Экспорт</button>
              <button data-export-class="${klass.id}" type="button">ZIP группы</button>
              <button data-mark-printed-class="${klass.id}" type="button">Отметить печать</button>
              <button data-assign-operator-class="${klass.id}" type="button">Назначить сотрудника</button>
              <button data-rename-class="${klass.id}" type="button">Переименовать</button>
              <button data-move-class="${klass.id}:up" ${manualMoveDisabled || index === 0 ? "disabled" : ""} type="button">Выше</button>
              <button data-move-class="${klass.id}:down" ${manualMoveDisabled || index >= total - 1 ? "disabled" : ""} type="button">Ниже</button>
              <div class="class-color-palette" aria-label="Цвет карточки">
                ${CLASS_COLOR_OPTIONS.map((option) => `<button class="class-color-dot ${option.id === color.id ? "active" : ""}" data-set-class-color="${klass.id}:${option.id}" style="--dot-color:${escapeAttr(option.accent)};" title="${escapeAttr(option.label)}" type="button"></button>`).join("")}
              </div>
              <button class="danger-text" data-delete-class="${klass.id}" type="button">Удалить</button>
            </div>
          </details>
        </div>
        <p class="muted">${allStudents.length} ${pluralizeRu(allStudents.length, "ученик", "ученика", "учеников")} · Документы: ${docsCount}</p>
        <div class="progress-label">
          <span>Прогресс: ${pct}%</span>
          <strong>${pct}%</strong>
        </div>
        <div class="progress"><span style="width:${pct}%"></span></div>
        <div class="progress-label">
          <span>Оплата: ${formatMoney(finance.paidAmount)} из ${formatMoney(finance.totalAmount)}</span>
          <strong>${finance.paymentPercent}%</strong>
        </div>
        <div class="progress finance-mini-progress"><span style="width:${finance.paymentPercent}%"></span></div>
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
        ${filterChip("processing", "На съемке")}
        ${filterChip("ready", "Обработано")}
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
  setShell({ heading: "QR", context: "Сканер", summary: "Открытие ученика и распознавание готовых работ" });
  view.innerHTML = `
    <section class="split">
      <div class="panel">
        <div class="qr-box" id="qr-box">
          <div>
            <p class="card-title">QR → ученик / готовая работа</p>
            <p class="muted">Наведите камеру на QR ученика или служебный QR на готовой фотографии.</p>
          </div>
        </div>
        <div class="toolbar" style="margin-top:12px">
          <button class="primary-button" data-start-scan type="button">Сканировать</button>
          <button class="secondary-button" data-import-shoot type="button">Импорт фото</button>
          <button class="secondary-button" data-import-shoot-folder type="button">Импорт папки</button>
          <button class="secondary-button" data-import-shoot-zip type="button">Импорт ZIP</button>
          <button class="secondary-button" data-stop-scan type="button">Стоп</button>
        </div>
        <p class="muted scan-note">Импорт съемки распределяет фото по QR-разделителям: QR ученика, затем его снимки, потом QR следующего ученика.</p>
      </div>
      <form class="panel grid" data-manual-qr>
        <h2 class="card-title">Ручной ввод</h2>
        <input class="input" name="qr" placeholder="ID ученика или служебный QR" required />
        <button class="primary-button" type="submit">Распознать</button>
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
  const ready = classes.filter((klass) => ["shot", "layout", "print_ready", "printed", "delivered"].includes(calculateAlbumClassStatus(klass))).length;
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
  const status = calculateAlbumClassStatus(klass);
  return `
    <article class="list-card card-button" data-open-album-class="${klass.id}" tabindex="0">
      <div class="list-card-main">
        <span class="list-icon ${classCoverClass(klass.name)}" data-icon="classes"></span>
        <div class="list-copy">
          <h2 class="card-title">${escapeHtml(klass.name)}</h2>
          <p class="muted">${albumTypeLabel(klass.albumType)} · ${klass.pagesCount || 0} страниц</p>
          <span class="status-pill ${albumStatusClass(status)}">${albumClassStatusLabel(status)}</span>
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
  const status = calculateAlbumClassStatus(klass);
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
        <div class="stat"><strong>${escapeHtml(albumClassStatusLabel(status))}</strong><span class="muted">Статус</span></div>
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
  const status = calculateAlbumStudentStatus(student);
  return `
    <article class="student-card album-work-card">
      <div class="student-line album-card-head">
        <div>
          <h3>${escapeHtml(student.lastName)} ${escapeHtml(student.firstName)}</h3>
          <p class="muted">Индивидуальная папка · Фото: ${portraitCount} · Видео: ${videoCount}</p>
        </div>
        <span class="status-pill ${albumStatusClass(status)}">${albumStudentStatusLabel(status)}</span>
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
          <select class="select" name="catalogIds">
            ${state.data.catalog.map((item) => `<option value="${item.id}" ${item.id === selectedCatalogId ? "selected" : ""}>${escapeHtml(serviceName(item))}</option>`).join("")}
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
          <span>Ручной статус</span>
          <select class="select" name="orderStatus">
            <option value="auto">Автоматически</option>
            ${STUDENT_MANUAL_STATUS_KEYS.map((value) => `<option value="${value}">${escapeHtml(ORDER_STATUSES[value])}</option>`).join("")}
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
  const finalStats = finalWorkStatsForStudent(student.id);
  const activeTask = order.items.find((item) => item.status !== "done") || order.items[0];
  const selectedCatalogIds = selectedCatalogIdsForStudent(student);
  const selectedCatalogTitle = selectedCatalogIds.map((id) => serviceName(catalogItemById(id))).filter(Boolean).join(", ") || "Услуги не выбраны";
  const orderPrice = studentTotalPrice(student);
  const c = completion(student.id);
  const price = studentTotalPrice(student);
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
            <div class="detail-stat"><span>Сумма</span><strong>${escapeHtml(formatMoney(orderPrice))}</strong></div>
            <div class="detail-stat"><span>Услуга</span><strong>${escapeHtml(selectedCatalogTitle)}</strong></div>
            <div class="detail-stat"><span>Прогресс</span><strong>${c.percent}%</strong></div>
            <div class="detail-stat"><span>Готовые работы</span><strong>${finalStats.total}</strong></div>
            <div class="detail-stat"><span>Напечатано</span><strong>${finalStats.printed}</strong></div>
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
          <div class="service-dropdown-picker">
            <select class="select" data-add-student-service="${student.id}" aria-label="Добавить услугу">
              <option value="">Выбрать услугу</option>
              ${state.data.catalog.filter((item) => !selectedCatalogIds.includes(item.id)).map((item) => `<option value="${item.id}">${escapeHtml(serviceName(item))} · ${escapeHtml(formatPrice(item.price))}</option>`).join("")}
            </select>
            <div class="service-chip-list">
              ${selectedCatalogIds.map((id) => {
                const item = catalogItemById(id);
                return item ? `<span class="service-chip">${escapeHtml(serviceName(item))}<button data-remove-student-service="${student.id}:${item.id}" type="button" aria-label="Убрать услугу">×</button></span>` : "";
              }).join("") || '<p class="muted">Услуги не выбраны.</p>'}
            </div>
          </div>
        </div>
        <label class="field-label">
          <span>Ручной статус</span>
          <select class="select" data-order-status="${student.id}">
            <option value="auto" ${manualStudentStatus(student) ? "" : "selected"}>Автоматически: ${escapeHtml(orderStatusLabel(student))}</option>
            ${STUDENT_MANUAL_STATUS_KEYS.map((value) => `<option value="${value}" ${value === manualStudentStatus(student) ? "selected" : ""}>${escapeHtml(ORDER_STATUSES[value])}</option>`).join("")}
          </select>
        </label>
        <button class="${student.paymentStatus === "paid" ? "secondary-button" : "primary-button"}" data-toggle-payment="${student.id}" type="button">
          ${student.paymentStatus === "paid" ? "Отметить как не оплачено" : "Оплачено"}
        </button>
        <button class="secondary-button" data-edit-student="${student.id}" type="button">Редактировать ученика</button>
        <button class="secondary-button" data-open-montage="${student.id}" type="button">Монтаж</button>
        <button class="secondary-button" data-export-final-works="student:${student.id}" type="button">Экспорт готовых фото</button>
        ${finalStats.total && finalStats.printed < finalStats.total ? `<button class="secondary-button" data-mark-printed-student="${student.id}" type="button">Отметить как напечатано</button>` : ""}
        <button class="secondary-button" data-generate-qr="${student.id}" type="button">Показать QR-код</button>
        <button class="secondary-button" data-show-student-references="${student.id}" type="button">Показать референсы</button>
        <button class="danger-button" data-delete-student="${student.id}" type="button">Удалить ученика</button>
      </aside>
    </section>
    <button class="fab-back" data-back-from-student type="button" aria-label="Назад" title="Назад"><span data-icon="back"></span></button>
  `;
  bindViewActions();
}

function taskRow(item, studentId) {
  const angle = catalogAngleForStudent(studentId, item.type);
  const hasReference = Boolean(angle?.refDataUrl || angle?.videoRefDataUrl);
  const reference = hasReference
    ? `<button class="reference-thumb-button" data-view-student-reference="${escapeAttr(`${studentId}:${item.type}`)}" type="button" title="Посмотреть референс">${angle.refDataUrl ? `<img class="reference-thumb" src="${angle.refDataUrl}" alt="${escapeAttr(angle.name)}" />` : '<div class="reference-empty">Видео</div>'}</button>`
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
        ${item.status === "done" ? "Снято" : "Ожидает"}
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
    ? `<video src="${url}" controls muted title="${escapeAttr(item.fileName)}"></video>`
    : `<button class="media-tile-button" data-view-media="${item.id}" type="button" title="${escapeAttr(item.fileName)}"><img src="${url}" alt="${escapeAttr(item.fileName)}" loading="lazy" /></button>`;
  return `<figure class="media-tile">${node}</figure>`;
}

function renderCatalog() {
  setShell({ heading: "Каталог услуг", context: "Витрина", summary: "Покажите детям и родителям доступные варианты" });
  const sections = catalogDisplaySections();
  const categories = serviceCategoryOptions({ includeDefaults: false });
  const hasUncategorized = state.data.catalog.some((item) => !serviceCategory(item));
  view.innerHTML = `
    <section class="catalog-page">
      <article class="panel catalog-hero">
        <div>
          <h2 class="card-title">Каталог услуг</h2>
          <p class="muted">Покажите детям и родителям доступные варианты</p>
        </div>
        <button class="primary-button" data-export-catalog type="button"><span data-icon="download"></span>Экспортировать каталог</button>
      </article>
      <label class="search-box catalog-search">
        <span data-icon="search"></span>
        <input data-catalog-query placeholder="Найти услугу" value="${escapeAttr(state.catalogQuery)}" />
      </label>
      <div class="chip-row catalog-tabs">
        ${catalogAudienceChip("all", "Все")}
        ${catalogAudienceChip("boys", "Мальчикам")}
        ${catalogAudienceChip("girls", "Девочкам")}
      </div>
      ${categories.length || hasUncategorized ? `
        <div class="chip-row catalog-tabs">
          ${catalogCategoryChip("all", "Все категории")}
          ${categories.map((category) => catalogCategoryChip(category, category)).join("")}
          ${hasUncategorized ? catalogCategoryChip(SERVICE_UNCATEGORIZED, "Без категории") : ""}
        </div>
      ` : ""}
      <section class="catalog-feed">
        ${sections.map(catalogSection).join("") || empty("В каталоге пока нет услуг")}
      </section>
    </section>
  `;
  bindViewActions();
}

function catalogAudienceChip(value, label) {
  return `<button class="chip ${state.catalogAudience === value ? "active" : ""}" data-catalog-audience="${value}" type="button">${label}</button>`;
}

function catalogCategoryChip(value, label) {
  return `<button class="chip ${state.catalogCategory === value ? "active" : ""}" data-catalog-category="${escapeAttr(value)}" type="button">${escapeHtml(label)}</button>`;
}

function catalogDisplaySections() {
  const visible = publicOrderedServices(state.data.catalog)
    .filter(serviceMatchesCatalogQuery)
    .filter(serviceMatchesCatalogCategory)
    .filter(serviceMatchesCatalogAudience);
  const popular = visible.filter(isServicePopular);
  const popularIds = new Set(popular.map((item) => item.id));
  const sections = popular.length ? [{ title: "Популярные", services: popular, featured: true }] : [];
  catalogAudienceSections().forEach((section) => {
    const services = visible.filter((item) => serviceGender(item) === section.gender && !popularIds.has(item.id));
    if (services.length) sections.push({ ...section, services });
  });
  return sections;
}

function catalogAudienceSections() {
  const sections = [
    { gender: "boys", title: "Для мальчиков" },
    { gender: "girls", title: "Для девочек" },
    { gender: "unisex", title: "Для всех" }
  ];
  if (state.catalogAudience === "boys") return sections.filter((section) => section.gender !== "girls");
  if (state.catalogAudience === "girls") return sections.filter((section) => section.gender !== "boys");
  return sections;
}

function catalogServicesForSection(gender) {
  return state.data.catalog
    .filter((item) => serviceGender(item) === gender)
    .filter(serviceMatchesCatalogQuery);
}

function serviceMatchesCatalogAudience(item) {
  const gender = serviceGender(item);
  if (state.catalogAudience === "boys") return gender !== "girls";
  if (state.catalogAudience === "girls") return gender !== "boys";
  return true;
}

function serviceMatchesCatalogCategory(item) {
  if (state.catalogCategory === "all") return true;
  if (state.catalogCategory === SERVICE_UNCATEGORIZED) return !serviceCategory(item);
  return serviceCategory(item) === state.catalogCategory;
}

function serviceMatchesCatalogQuery(item) {
  const query = state.catalogQuery.trim().toLowerCase();
  if (!query) return true;
  return [
    serviceName(item),
    serviceShortDescription(item),
    serviceDescription(item),
    serviceCategory(item),
    item.price
  ].join(" ").toLowerCase().includes(query);
}

function catalogSection(section) {
  return `
    <section class="catalog-section">
      <div class="catalog-section-heading">
        <h3>${escapeHtml(section.title)}</h3>
        <span>${section.services.length}</span>
      </div>
      <div class="catalog-card-list">
        ${section.services.map(catalogServiceCard).join("")}
      </div>
    </section>
  `;
}

function catalogServiceCard(item) {
  const previewUrl = servicePreviewImageDataUrl(item);
  const preview = previewUrl
    ? `<img src="${previewUrl}" alt="${escapeAttr(serviceName(item))}" loading="lazy" />`
    : `<div class="catalog-card-empty">${escapeHtml(serviceName(item).slice(0, 1) || "У")}</div>`;
  const videoBadge = servicePreviewVideoDataUrl(item) ? '<span class="catalog-card-badge video">Видео</span>' : "";
  const shortDescription = serviceShortDescription(item);
  const category = serviceCategory(item);
  return `
    <article class="catalog-service-card card-button" data-open-catalog-service="${item.id}" tabindex="0">
      <div class="catalog-card-preview">${preview}</div>
      <div class="catalog-card-body">
        <div class="catalog-card-title-row">
          <h3>${escapeHtml(serviceName(item))}</h3>
          <strong>${escapeHtml(formatPrice(item.price))}</strong>
        </div>
        ${shortDescription ? `<p>${escapeHtml(shortDescription)}</p>` : '<p class="muted">Описание можно добавить в услуге.</p>'}
        <div class="catalog-card-badges">
          ${isServicePopular(item) ? '<span class="catalog-card-badge popular">Популярное</span>' : ""}
          <span class="catalog-card-badge">${escapeHtml(serviceGenderLabel(item))}</span>
          ${category ? `<span class="catalog-card-badge">${escapeHtml(category)}</span>` : ""}
          ${videoBadge}
        </div>
      </div>
    </article>
  `;
}

function showCatalogServiceViewer(itemId) {
  const item = catalogItemById(itemId);
  if (!item) return;
  document.querySelector(".catalog-modal-backdrop")?.remove();
  const videoUrl = servicePreviewVideoDataUrl(item);
  const imageUrl = servicePreviewImageDataUrl(item);
  const description = serviceDescription(item) || serviceShortDescription(item) || "Описание скоро появится.";
  const media = videoUrl
    ? `<div class="catalog-modal-media"><video data-catalog-modal-video src="${videoUrl}" controls playsinline></video><button class="secondary-button compact" data-catalog-video-fullscreen type="button">На весь экран</button></div>`
    : imageUrl
      ? `<img class="catalog-modal-image" src="${imageUrl}" alt="${escapeAttr(serviceName(item))}" />`
      : `<div class="catalog-modal-image empty">Нет превью</div>`;
  const panel = document.createElement("div");
  panel.className = "catalog-modal-backdrop";
  panel.innerHTML = `
    <section class="catalog-modal" role="dialog" aria-modal="true" aria-label="${escapeAttr(serviceName(item))}">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHtml(serviceName(item))}</h2>
          <p class="muted">${escapeHtml(formatPrice(item.price))}</p>
        </div>
        <button class="icon-button" data-close-catalog-modal type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      ${media}
      <div class="catalog-modal-copy">
        <div class="catalog-card-badges">
          ${isServicePopular(item) ? '<span class="catalog-card-badge popular">Популярное</span>' : ""}
          <span class="catalog-card-badge">${escapeHtml(serviceGenderLabel(item))}</span>
          ${serviceCategory(item) ? `<span class="catalog-card-badge">${escapeHtml(serviceCategory(item))}</span>` : ""}
          ${videoUrl ? '<span class="catalog-card-badge video">Видео</span>' : ""}
        </div>
        <p>${escapeHtml(description)}</p>
      </div>
      <button class="secondary-button" data-close-catalog-modal type="button">Назад</button>
    </section>
  `;
  const close = () => panel.remove();
  panel.querySelectorAll("[data-close-catalog-modal]").forEach((node) => node.addEventListener("click", close));
  panel.addEventListener("click", (event) => {
    if (event.target === panel) close();
  });
  panel.querySelector("[data-catalog-video-fullscreen]")?.addEventListener("click", async () => {
    const video = panel.querySelector("[data-catalog-modal-video]");
    if (video?.requestFullscreen) await video.requestFullscreen().catch(() => {});
    else video?.webkitEnterFullscreen?.();
  });
  document.body.append(panel);
  injectIcons();
}

function renderServices() {
  setShell({ heading: "Услуги", context: "Настройки съемки", summary: "Пакеты · чек-листы · референсы" });
  pruneSelectedServices();
  const catalog = servicesForAdminView();
  const categories = serviceCategoryOptions();
  const selectedCount = state.selectedServiceIds.size;
  const canMove = state.serviceSort === "manual" && state.serviceCategoryFilter === "all";
  view.innerHTML = `
    <section class="toolbar">
      <div>
        <h2 class="card-title">Пакеты съемки</h2>
        <p class="muted">Услуги, стоимость и набор ракурсов.</p>
      </div>
      <div class="row">
        <button class="secondary-button" data-manage-service-categories type="button">Категории</button>
        <button class="primary-button" data-add-catalog type="button"><span data-icon="plus"></span>Услуга</button>
      </div>
    </section>
    <section class="service-order-toolbar">
      <label class="field-label compact-field"><span>Порядок</span><select class="select" data-service-sort>
        ${Object.entries(SERVICE_SORT_MODES).map(([value, label]) => `<option value="${value}" ${state.serviceSort === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
      </select></label>
      <label class="field-label compact-field"><span>Категория</span><select class="select" data-service-category-filter>
        <option value="all" ${state.serviceCategoryFilter === "all" ? "selected" : ""}>Все категории</option>
        <option value="${SERVICE_UNCATEGORIZED}" ${state.serviceCategoryFilter === SERVICE_UNCATEGORIZED ? "selected" : ""}>Без категории</option>
        ${categories.map((category) => `<option value="${escapeAttr(category)}" ${state.serviceCategoryFilter === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
      </select></label>
      <span class="muted">${catalog.length} из ${state.data.catalog.length} услуг</span>
    </section>
    ${selectedCount ? serviceBulkPanel(selectedCount) : ""}
    <section class="compact-stack">
      ${catalog.map((item, index) => catalogCard(item, index, catalog.length, canMove)).join("") || empty("Добавьте первую услугу для съемки")}
    </section>
  `;
  bindViewActions();
}

function serviceBulkPanel(selectedCount) {
  return `
    <section class="panel service-bulk-panel">
      <div>
        <h3 class="card-title">Выбрано услуг: ${selectedCount}</h3>
        <p class="muted">Можно сразу назначить цену, категорию, аудиторию или скопировать ракурсы.</p>
      </div>
      <div class="service-bulk-grid">
        <label class="field-label compact-field"><span>Цена</span><input class="input" data-bulk-price inputmode="decimal" placeholder="500" /></label>
        <button class="secondary-button compact" data-bulk-apply-price type="button">Применить цену</button>
        <label class="field-label compact-field"><span>Категория</span><input class="input" data-bulk-category list="service-category-options" placeholder="Мультики" /></label>
        <button class="secondary-button compact" data-bulk-apply-category type="button">Применить категорию</button>
        <label class="field-label compact-field"><span>Для кого</span><select class="select" data-bulk-gender>
          <option value="unisex">Для всех</option>
          <option value="boys">Для мальчиков</option>
          <option value="girls">Для девочек</option>
        </select></label>
        <button class="secondary-button compact" data-bulk-apply-gender type="button">Применить</button>
        <label class="field-label compact-field"><span>Ракурсы как у</span><select class="select" data-bulk-angle-source>
          ${manualOrderedServices().map((item) => `<option value="${item.id}">${escapeHtml(serviceName(item))}</option>`).join("")}
        </select></label>
        <button class="secondary-button compact" data-bulk-copy-angles type="button">Скопировать ракурсы</button>
      </div>
      <div class="toolbar">
        <button class="secondary-button compact" data-clear-service-selection type="button">Снять выбор</button>
      </div>
      <datalist id="service-category-options">
        ${serviceCategoryOptions().map((category) => `<option value="${escapeAttr(category)}"></option>`).join("")}
      </datalist>
    </section>
  `;
}

function catalogCard(item, index = 0, total = 0, canMove = false) {
  const previewUrl = servicePreviewImageDataUrl(item);
  const preview = previewUrl
    ? `<img class="service-preview" src="${previewUrl}" alt="${escapeAttr(serviceName(item))}" loading="lazy" decoding="async" />`
    : '<div class="service-preview empty">Нет превью</div>';
  const promptBadge = servicePrompt(item) ? '<span>✨ Prompt есть</span>' : "";
  const videoBadge = servicePreviewVideoDataUrl(item) ? '<span>Видео</span>' : "";
  const description = serviceShortDescription(item);
  const selected = state.selectedServiceIds.has(item.id);
  const popular = isServicePopular(item);
  const category = serviceCategory(item);
  return `
    <article class="list-card card-button service-card ${selected ? "selected" : ""}" data-open-catalog="${item.id}" tabindex="0">
      <div class="list-card-main">
        <label class="service-select" title="Выбрать услугу"><input type="checkbox" data-select-service="${item.id}" ${selected ? "checked" : ""} /><span></span></label>
        <div class="service-preview-frame">${preview}</div>
        <div class="list-copy">
          <div class="service-title-row">
            <h2 class="card-title">${escapeHtml(serviceName(item))}</h2>
            <button class="service-star ${popular ? "active" : ""}" data-toggle-service-popular="${item.id}" type="button" aria-label="${popular ? "Убрать из популярных" : "Добавить в популярные"}" title="Популярное"><span data-icon="star"></span></button>
          </div>
          ${description ? `<p class="muted">${escapeHtml(description)}</p>` : ""}
          <div class="service-card-meta">
            <span>${escapeHtml(formatPrice(item.price))}</span>
            <span>${escapeHtml(serviceGenderLabel(item))}</span>
            <span>${escapeHtml(category || "Без категории")}</span>
            ${popular ? "<span>Популярное</span>" : ""}
            <span>${(item.angles || []).length} ракурсов</span>
            ${videoBadge}
            ${promptBadge}
          </div>
        </div>
        <div class="service-move-buttons">
          <button class="icon-button compact" data-move-service="${item.id}:up" type="button" ${!canMove || index === 0 ? "disabled" : ""} aria-label="Выше" title="Выше">↑</button>
          <button class="icon-button compact" data-move-service="${item.id}:down" type="button" ${!canMove || index >= total - 1 ? "disabled" : ""} aria-label="Ниже" title="Ниже">↓</button>
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
  const previewUrl = servicePreviewImageDataUrl(item);
  const videoUrl = servicePreviewVideoDataUrl(item);
  const preview = previewUrl
    ? `<img class="service-detail-preview" src="${previewUrl}" alt="${escapeAttr(serviceName(item))}" />`
    : '<div class="service-detail-preview empty">Нет превью</div>';
  const prompt = servicePrompt(item);
  setShell({ heading: serviceName(item), context: "Услуга", summary: formatPrice(item.price) });
  view.innerHTML = `
    <section class="grid">
      <article class="panel grid">
        <div class="service-detail-head">
          ${preview}
          <div class="catalog-details">
            <p><strong>Цена:</strong> ${escapeHtml(formatPrice(item.price))}</p>
            <p><strong>Для кого:</strong> ${escapeHtml(serviceGenderLabel(item))}</p>
            <p><strong>Категория:</strong> ${escapeHtml(serviceCategoryLabel(item))}</p>
            ${isServicePopular(item) ? '<p><strong>Популярное:</strong> показывается выше в каталоге</p>' : ""}
            ${serviceShortDescription(item) ? `<p><strong>Короткое описание:</strong> ${escapeHtml(serviceShortDescription(item))}</p>` : ""}
            ${serviceDescription(item) ? `<p><strong>Полное описание:</strong> ${escapeHtml(serviceDescription(item))}</p>` : ""}
            ${videoUrl ? '<p><strong>Превью видео:</strong> добавлено</p>' : ""}
            <button class="secondary-button compact" data-edit-catalog="${item.id}" type="button">Редактировать услугу</button>
          </div>
        </div>
        ${videoUrl ? `<video class="service-detail-video" src="${videoUrl}" controls playsinline></video>` : ""}
      </article>
      <article class="panel grid">
        <div class="card-header">
          <div>
            <h2 class="card-title">✨ Prompt / инструкция</h2>
            <p class="muted">${prompt ? "Текст можно скопировать для нейросети, сценария или съемки." : "Промпт не добавлен"}</p>
          </div>
        </div>
        ${prompt ? `<div class="prompt-box">${escapeHtml(prompt)}</div>` : ""}
        <div class="toolbar">
          ${prompt ? `<button class="secondary-button" data-copy-service-prompt="${item.id}" type="button">Скопировать</button><button class="secondary-button" data-edit-catalog="${item.id}" type="button">Изменить</button>` : `<button class="secondary-button" data-edit-catalog="${item.id}" type="button">Добавить prompt</button>`}
        </div>
      </article>
      <section class="toolbar">
        <h2 class="card-title">Ракурсы</h2>
        <button class="primary-button" data-add-angle="${item.id}" type="button"><span data-icon="plus"></span>Добавить ракурс</button>
      </section>
      <section class="compact-stack">
        ${(item.angles || []).map((angle) => catalogAngleRow(item, angle)).join("") || empty("Ракурсы пока не добавлены")}
      </section>
    </section>
  `;
  bindViewActions();
}

function catalogAngleRow(item, angle) {
  const reference = angle.refDataUrl
    ? `<img class="reference-thumb large" src="${angle.refDataUrl}" alt="${escapeAttr(angle.name)}" />`
    : `<div class="reference-empty large">${angle.videoRefDataUrl ? "Видео" : "Нет референса"}</div>`;
  const badges = [
    angle.refDataUrl ? '<span class="status-pill paid">Фото</span>' : "",
    angle.videoRefDataUrl ? '<span class="status-pill in-progress">Видео</span>' : ""
  ].filter(Boolean).join("");
  return `
    <article class="list-card">
      <div class="list-card-main">
        ${reference}
        <div class="list-copy">
          <strong>${escapeHtml(angle.name)}</strong>
          <p class="muted">${escapeHtml(angle.details || "Описание ракурса не заполнено")}</p>
          <div class="service-card-meta">${badges || "<span>Нет референса</span>"}</div>
        </div>
        <details class="item-menu">
          <summary aria-label="Меню ракурса">...</summary>
          <div class="menu-panel">
            <button data-view-angle-reference="${item.id}:${angle.id}" type="button">Посмотреть референс</button>
            <button data-edit-angle="${item.id}:${angle.id}" type="button">Изменить</button>
            <button class="danger-text" data-delete-angle="${item.id}:${angle.id}" type="button">Удалить</button>
          </div>
        </details>
      </div>
    </article>
  `;
}

function renderProfile() {
  const operator = currentOperator();
  const isOwner = operator?.role === "owner";
  const profileId = operator?.id || UNKNOWN_OPERATOR_ID;
  const selectedId = state.profileOperatorId || profileId;
  const selectedOperator = operatorById(selectedId) || (selectedId === UNKNOWN_OPERATOR_ID ? { id: UNKNOWN_OPERATOR_ID, name: "Неизвестный сотрудник", role: "" } : null);
  const profileStats = buildOperatorStats(profileId);
  const teamStats = operatorStatsList();
  setShell({
    heading: "Мой профиль",
    context: operator ? `${operator.name} · ${operatorRoleLabel(operator.role)}` : "Профиль не выбран",
    summary: "Профиль, роль и статистика работы"
  });
  view.innerHTML = `
    <section class="profile-page">
      ${!operator ? profileUnknownPanel() : ""}
      <article class="panel profile-summary-card">
        <div class="profile-main">
          <span class="operator-avatar large">${escapeHtml(operatorInitials(operator || { name: "?" }))}</span>
          <div>
            <h2 class="card-title">${escapeHtml(operator?.name || "Неизвестный сотрудник")}</h2>
            <p class="muted">${escapeHtml(operator ? operatorRoleLabel(operator.role) : "Профиль не выбран")}</p>
          </div>
        </div>
        <div class="toolbar">
          ${operator ? '<button class="secondary-button compact" data-logout-operator type="button">Сменить профиль</button>' : '<button class="primary-button compact" data-open-operator-login type="button">Выбрать профиль</button>'}
        </div>
      </article>
      ${operatorStatsPanel(profileStats)}
      ${isOwner ? `
        <article class="panel grid">
          <div class="card-header">
            <div>
              <h2 class="card-title">Управление сотрудниками</h2>
              <p class="muted">${state.data.operators.length} сотрудников в локальной базе.</p>
            </div>
            <button class="primary-button compact" data-add-operator type="button"><span data-icon="plus"></span>Добавить сотрудника</button>
          </div>
          <div class="operator-list">
            ${state.data.operators.map(operatorListRow).join("") || empty("Сотрудников пока нет")}
          </div>
          <div class="toolbar profile-transfer-actions">
            <button class="secondary-button" data-export-operators type="button">Экспорт сотрудников</button>
            <button class="secondary-button" data-import-operators type="button">Импорт сотрудников</button>
          </div>
        </article>
        <article class="panel grid">
          <div>
            <h2 class="card-title">Статистика команды</h2>
            <p class="muted">Считается по созданным, обновленным, импортированным и экспортированным данным.</p>
          </div>
          <div class="team-stat-grid">
            ${teamStats.map((item) => teamStatCard(item, item.operator.id === selectedId)).join("")}
          </div>
        </article>
        ${selectedOperator ? operatorDetailPanel(selectedOperator, buildOperatorStats(selectedOperator.id)) : ""}
      ` : ""}
    </section>
    <button class="fab-back" data-back-settings type="button" aria-label="Назад" title="Назад"><span data-icon="back"></span></button>
  `;
  bindViewActions();
}

function profileUnknownPanel() {
  return `
    <article class="panel profile-warning">
      <strong>Профиль не выбран</strong>
      <span>Действия будут сохранены как неизвестный сотрудник.</span>
    </article>
  `;
}

function operatorStatsPanel(stats) {
  return `
    <article class="panel grid">
      <div class="stats finance-stats profile-stat-grid">
        <div class="stat"><strong>${stats.projects}</strong><span class="muted">Проектов создано</span></div>
        <div class="stat"><strong>${stats.classes}</strong><span class="muted">Классов создано</span></div>
        <div class="stat"><strong>${stats.students}</strong><span class="muted">Учеников добавлено</span></div>
        <div class="stat"><strong>${stats.media}</strong><span class="muted">Фото/видео добавлено</span></div>
        <div class="stat"><strong>${stats.imports}</strong><span class="muted">Импортов выполнено</span></div>
        <div class="stat"><strong>${stats.exports}</strong><span class="muted">Экспортов сделано</span></div>
        <div class="stat"><strong>${stats.tasks}</strong><span class="muted">Задач выполнено</span></div>
        <div class="stat"><strong>${stats.readyStudents}</strong><span class="muted">Учеников готово</span></div>
        <div class="stat"><strong>${stats.unpaidStudents}</strong><span class="muted">Не оплачено</span></div>
        <div class="stat"><strong>${escapeHtml(formatActivityDate(stats.lastActivity))}</strong><span class="muted">Последняя активность</span></div>
      </div>
    </article>
  `;
}

function operatorListRow(operator) {
  return `
    <div class="operator-row">
      <span class="operator-avatar">${escapeHtml(operatorInitials(operator))}</span>
      <div>
        <strong>${escapeHtml(operator.name)}</strong>
        <small>${escapeHtml(operatorRoleLabel(operator.role))} · ${operator.isActive === false ? "отключен" : "активен"}</small>
      </div>
      <div class="row">
        <button class="secondary-button compact" data-edit-operator="${operator.id}" type="button">Изменить</button>
        <button class="secondary-button compact" data-toggle-operator="${operator.id}" type="button">${operator.isActive === false ? "Включить" : "Отключить"}</button>
      </div>
    </div>
  `;
}

function teamStatCard(item, selected = false) {
  const stats = item.stats;
  return `
    <button class="team-stat-card ${selected ? "selected" : ""}" data-profile-operator="${item.operator.id}" type="button">
      <div class="profile-main">
        <span class="operator-avatar">${escapeHtml(operatorInitials(item.operator))}</span>
        <div>
          <strong>${escapeHtml(item.operator.name)}</strong>
          <small>${escapeHtml(operatorRoleLabel(item.operator.role))}</small>
        </div>
      </div>
      <div class="team-stat-lines">
        <span>классов: ${stats.classes}</span>
        <span>учеников: ${stats.students}</span>
        <span>фото: ${stats.media}</span>
        <span>готово: ${stats.readyStudents}</span>
        <span>последняя активность: ${escapeHtml(formatActivityDate(stats.lastActivity))}</span>
      </div>
    </button>
  `;
}

function operatorDetailPanel(operator, stats) {
  return `
    <article class="panel grid">
      <div>
        <h2 class="card-title">${escapeHtml(operator.name)}</h2>
        <p class="muted">Подробная статистика по проектам, классам, датам, импортам и экспортам.</p>
      </div>
      <div class="profile-detail-grid">
        ${operatorDetailGroup("По проектам", stats.projectDetails)}
        ${operatorDetailGroup("По классам", stats.classDetails)}
        ${operatorDetailGroup("По датам", stats.dateDetails)}
        ${operatorDetailGroup("Импорт / экспорт", stats.transferDetails)}
      </div>
    </article>
  `;
}

function operatorDetailGroup(title, rows) {
  return `
    <div class="profile-detail-card">
      <h3 class="mini-heading">${escapeHtml(title)}</h3>
      <div class="import-draft-list">
        ${rows.map((row) => `<div class="import-draft-row"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.value)}</span></div>`).join("") || '<p class="muted">Пока нет данных.</p>'}
      </div>
    </div>
  `;
}

function operatorStatsList() {
  const known = state.data.operators.map((operator) => ({ operator, stats: buildOperatorStats(operator.id) }));
  const unknownStats = buildOperatorStats(UNKNOWN_OPERATOR_ID);
  if (unknownStats.totalActivity) known.push({ operator: { id: UNKNOWN_OPERATOR_ID, name: "Неизвестный сотрудник", role: "" }, stats: unknownStats });
  return known;
}

function buildOperatorStats(operatorId) {
  const projects = state.data.projects.filter((item) => recordMatchesOperator(item, operatorId, ["createdBy"]));
  const classes = state.data.classes.filter((item) => recordMatchesOperator(item, operatorId, ["createdBy"]));
  const students = state.data.students.filter((item) => recordMatchesOperator(item, operatorId, ["createdBy"]));
  const media = state.data.media.filter((item) => recordMatchesOperator(item, operatorId, ["createdBy", "importedBy", "capturedBy"]));
  const importEvents = state.data.operatorEvents.filter((item) => item.type === "import" && recordMatchesOperator(item, operatorId, ["operatorId", "importedBy"]));
  const exportEvents = state.data.operatorEvents.filter((item) => item.type === "export" && recordMatchesOperator(item, operatorId, ["operatorId", "exportedBy"]));
  const exportedRecords = [...state.data.projects, ...state.data.classes, ...state.data.students].filter((item) => recordMatchesOperator(item, operatorId, ["exportedBy"]));
  const tasks = state.data.orders.flatMap((order) => (order.items || []).map((item) => ({ ...item, order })))
    .filter((item) => item.status === "done" && recordMatchesOperator(item, operatorId, ["completedBy", "updatedBy"]));
  const readyStudents = state.data.students.filter((student) => ["processed", "printed", "delivered"].includes(currentOrderStatus(student)) && (
    recordMatchesOperator(student, operatorId, ["createdBy", "updatedBy"]) || studentHasCompletedTaskByOperator(student.id, operatorId)
  ));
  const unpaidStudents = state.data.students.filter((student) => student.paymentStatus !== "paid" && recordMatchesOperator(student, operatorId, ["createdBy", "updatedBy"]));
  const lastActivity = latestActivityDate({ projects, classes, students, media, events: [...importEvents, ...exportEvents], tasks });
  return {
    projects: projects.length,
    classes: classes.length,
    students: students.length,
    media: media.length,
    imports: importEvents.length || media.filter((item) => recordMatchesOperator(item, operatorId, ["importedBy"])).length,
    exports: exportEvents.length || exportedRecords.length,
    tasks: tasks.length,
    readyStudents: readyStudents.length,
    unpaidStudents: unpaidStudents.length,
    lastActivity,
    totalActivity: projects.length + classes.length + students.length + media.length + importEvents.length + exportEvents.length + tasks.length,
    projectDetails: operatorProjectDetails(operatorId),
    classDetails: operatorClassDetails(operatorId),
    dateDetails: operatorDateDetails(operatorId),
    transferDetails: operatorTransferDetails(operatorId)
  };
}

function recordMatchesOperator(record, operatorId, fields) {
  const ids = operatorComparisonIds(operatorId);
  const values = fields.map((field) => record?.[field]).filter(Boolean);
  if (operatorId === UNKNOWN_OPERATOR_ID) return values.length === 0 || values.some((value) => ids.has(String(value)));
  return values.some((value) => ids.has(String(value)));
}

function operatorComparisonIds(operatorId) {
  const ids = new Set([String(operatorId || "")]);
  const operator = operatorById(operatorId);
  (operator?.aliases || []).forEach((id) => ids.add(String(id)));
  return ids;
}

function studentHasCompletedTaskByOperator(studentId, operatorId) {
  const order = orderByStudent(studentId);
  return (order.items || []).some((item) => item.status === "done" && recordMatchesOperator(item, operatorId, ["completedBy", "updatedBy"]));
}

function latestActivityDate(groups) {
  const dates = [];
  Object.values(groups).flat().forEach((item) => {
    ["createdAt", "updatedAt", "importedAt", "exportedAt", "completedAt"].forEach((key) => {
      if (item?.[key]) dates.push(item[key]);
    });
  });
  return dates.sort().pop() || "";
}

function formatActivityDate(value) {
  if (!value) return "нет";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "нет";
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function operatorProjectDetails(operatorId) {
  return state.data.projects.map((project) => {
    const classes = classesByProject(project.id);
    const classIds = new Set(classes.map((klass) => klass.id));
    const students = state.data.students.filter((student) => classIds.has(student.classId));
    const media = state.data.media.filter((item) => students.some((student) => student.id === item.studentId) && recordMatchesOperator(item, operatorId, ["createdBy", "importedBy", "capturedBy"]));
    const ownStudents = students.filter((student) => recordMatchesOperator(student, operatorId, ["createdBy", "updatedBy"]));
    if (!media.length && !ownStudents.length && !recordMatchesOperator(project, operatorId, ["createdBy", "updatedBy", "exportedBy"])) return null;
    return { label: project.name, value: `${ownStudents.length} учеников · ${media.length} фото` };
  }).filter(Boolean).slice(0, 12);
}

function operatorClassDetails(operatorId) {
  return state.data.classes.map((klass) => {
    const students = state.data.students.filter((student) => student.classId === klass.id);
    const ownStudents = students.filter((student) => recordMatchesOperator(student, operatorId, ["createdBy", "updatedBy"]));
    const media = state.data.media.filter((item) => students.some((student) => student.id === item.studentId) && recordMatchesOperator(item, operatorId, ["createdBy", "importedBy", "capturedBy"]));
    if (!media.length && !ownStudents.length && !recordMatchesOperator(klass, operatorId, ["createdBy", "updatedBy", "exportedBy"])) return null;
    return { label: `${projectById(klass.projectId)?.name || "Проект"} · ${klass.name}`, value: `${ownStudents.length} учеников · ${media.length} фото` };
  }).filter(Boolean).slice(0, 12);
}

function operatorDateDetails(operatorId) {
  const days = new Map();
  const add = (dateValue, count = 1) => {
    if (!dateValue) return;
    const day = String(dateValue).slice(0, 10);
    days.set(day, (days.get(day) || 0) + count);
  };
  state.data.students.filter((item) => recordMatchesOperator(item, operatorId, ["createdBy", "updatedBy"])).forEach((item) => add(item.createdAt || item.updatedAt));
  state.data.media.filter((item) => recordMatchesOperator(item, operatorId, ["createdBy", "importedBy", "capturedBy"])).forEach((item) => add(item.importedAt || item.createdAt));
  state.data.operatorEvents.filter((item) => recordMatchesOperator(item, operatorId, ["operatorId", "importedBy", "exportedBy"])).forEach((item) => add(item.createdAt));
  return Array.from(days.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 10)
    .map(([day, count]) => ({ label: new Date(day).toLocaleDateString("ru-RU"), value: `${count} действий` }));
}

function operatorTransferDetails(operatorId) {
  const imports = state.data.operatorEvents.filter((item) => item.type === "import" && recordMatchesOperator(item, operatorId, ["operatorId", "importedBy"]));
  const exports = state.data.operatorEvents.filter((item) => item.type === "export" && recordMatchesOperator(item, operatorId, ["operatorId", "exportedBy"]));
  return [
    ...imports.slice(-6).map((item) => ({ label: `Импорт ${item.targetType || ""}`.trim(), value: formatActivityDate(item.createdAt) })),
    ...exports.slice(-6).map((item) => ({ label: `Экспорт ${item.targetType || ""}`.trim(), value: formatActivityDate(item.createdAt) }))
  ].slice(-12).reverse();
}

function settingsProfileCard() {
  const operator = currentOperator();
  const subtitle = operator
    ? (operator.role === "owner" ? `${operatorRoleLabel(operator.role)} · ${state.data.operators.length} сотрудников` : `${operator.name} · ${operatorRoleLabel(operator.role)}`)
    : "Профиль не выбран";
  return `
    <button class="settings-row profile-settings-row" data-open-profile type="button">
      <span class="operator-avatar">${escapeHtml(operatorInitials(operator || { name: "?" }))}</span>
      <div><strong>Мой профиль</strong><small>Профиль, роль и статистика работы</small><small>${escapeHtml(subtitle)}</small></div>
      <b>›</b>
    </button>
  `;
}

function renderSettings() {
  setShell({ heading: "Настройки", context: APP_NAME, summary: "Профиль · PDF · импорт и экспорт" });
  view.innerHTML = `
    <section class="settings-list">
      ${settingsProfileCard()}
      <button class="settings-row" data-settings-detail="pdf" type="button"><span>📄</span><div><strong>PDF статусы</strong><small>Колонки и заголовок отчета</small></div><b>›</b></button>
      <button class="settings-row" data-open-services type="button"><span>🎛</span><div><strong>Услуги</strong><small>Пакеты съемки и референсы</small></div><b>›</b></button>
      <button class="settings-row" data-open-public-catalog type="button"><span>🛍️</span><div><strong>Каталог</strong><small>Витрина услуг для детей и родителей</small></div><b>›</b></button>
      <button class="settings-row" data-settings-detail="watermark" type="button"><span>©</span><div><strong>Водяной знак</strong><small>Защита фото в публичном каталоге</small></div><b>›</b></button>
      <button class="settings-row" data-settings-detail="finalPrint" type="button"><span>🖨</span><div><strong>Печать готовых работ</strong><small>QR, положение и экспорт HTML</small></div><b>›</b></button>
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
  const watermark = catalogWatermarkSettings();
  const finalPrint = finalWorkPrintSettings();
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
    watermark: `
      <article class="panel grid">
        <div><h2 class="card-title">Водяной знак каталога</h2><p class="muted">При экспорте публичного каталога знак будет нанесен поверх превью фото.</p></div>
        <label class="checkbox-row"><input type="checkbox" data-watermark-enabled ${watermark.enabled ? "checked" : ""} /><span>Включить водяной знак</span></label>
        <label class="field-label"><span>Текст</span><input class="input" data-watermark-text placeholder="Ваше имя, студия или телефон" value="${escapeAttr(watermark.text)}" /></label>
        <label class="field-label"><span>Прозрачность</span><input class="input" data-watermark-opacity type="range" min="0.25" max="0.85" step="0.05" value="${escapeAttr(String(watermark.opacity))}" /></label>
        <div class="watermark-logo-row">
          ${watermark.logoDataUrl ? `<img class="watermark-logo-preview" src="${watermark.logoDataUrl}" alt="Логотип водяного знака" />` : '<div class="watermark-logo-preview empty">Лого</div>'}
          <div class="toolbar">
            <button class="secondary-button" data-upload-watermark-logo type="button">Загрузить PNG/логотип</button>
            ${watermark.logoDataUrl ? '<button class="secondary-button" data-remove-watermark-logo type="button">Убрать логотип</button>' : ""}
          </div>
        </div>
        <button class="primary-button" data-save-watermark-settings type="button">Сохранить водяной знак</button>
      </article>`,
    finalPrint: `
      <article class="panel grid">
        <div><h2 class="card-title">Печать готовых работ</h2><p class="muted">Служебный QR добавляется только в копию для печати и распознается внутри приложения.</p></div>
        <label class="checkbox-row"><input type="checkbox" data-final-print-qr-enabled ${finalPrint.qrEnabled ? "checked" : ""} /><span>Включить QR для печати</span></label>
        <label class="field-label"><span>Положение QR</span><select class="select" data-final-print-qr-position>
          ${["bottom-right", "bottom-left", "top-right", "top-left"].map((value) => `<option value="${value}" ${value === finalPrint.qrPosition ? "selected" : ""}>${value}</option>`).join("")}
        </select></label>
        <label class="field-label"><span>Размер QR</span><select class="select" data-final-print-qr-size>
          ${["small", "medium", "large"].map((value) => `<option value="${value}" ${value === finalPrint.qrSize ? "selected" : ""}>${value}</option>`).join("")}
        </select></label>
        <label class="field-label"><span>Отступ QR</span><select class="select" data-final-print-qr-margin>
          ${["5px", "10px", "20px"].map((value) => `<option value="${value}" ${value === finalPrint.qrMargin ? "selected" : ""}>${value}</option>`).join("")}
        </select></label>
        <div class="transfer-button-row">
          <button class="primary-button" data-save-final-print-settings type="button">Сохранить настройки</button>
          <button class="secondary-button" data-export-final-works="project:${state.projectId || state.data.projects[0]?.id || ""}" type="button">Экспорт проекта</button>
          <button class="secondary-button" data-export-final-works="class:${state.classId || state.data.classes[0]?.id || ""}" type="button">Экспорт группы</button>
        </div>
      </article>`,
    transfer: `
      <article class="panel grid">
        <h2 class="card-title">Импорт / экспорт</h2>
        <section class="transfer-group">
          <h3 class="mini-heading">Рабочая конфигурация</h3>
          <p class="muted">Сотрудники, услуги, категории и настройки для телефона сотрудника.</p>
          <div class="transfer-button-row">
            <button class="primary-button" data-export-work-config type="button">Экспорт рабочей конфигурации</button>
            <button class="secondary-button" data-import-work-config type="button">Импорт рабочей конфигурации</button>
            <button class="secondary-button" data-import-settings type="button">Импорт только настроек</button>
          </div>
        </section>
        <section class="transfer-group">
          <h3 class="mini-heading">Проект</h3>
          <label class="field-label"><span>Проект</span><select class="select" data-transfer-project>${state.data.projects.map((project) => `<option value="${project.id}" ${project.id === state.projectId ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}</select></label>
          <div class="transfer-button-row">
            <button class="secondary-button" data-export-selected-project type="button">Экспорт проекта</button>
            <button class="secondary-button" data-import-project type="button">Импорт проекта</button>
          </div>
        </section>
        <section class="transfer-group">
          <h3 class="mini-heading">Класс / группа</h3>
          <label class="field-label"><span>Класс / группа</span><select class="select" data-transfer-class>${state.data.classes.map((klass) => `<option value="${klass.id}" ${klass.id === state.classId ? "selected" : ""}>${escapeHtml(`${projectById(klass.projectId)?.name || ""} · ${klass.name}`)}</option>`).join("")}</select></label>
          <div class="transfer-button-row">
            <button class="secondary-button" data-export-selected-class type="button">Экспорт класса/группы</button>
            <button class="secondary-button" data-import-class type="button">Импорт класса/группы</button>
          </div>
        </section>
        <section class="transfer-group">
          <h3 class="mini-heading">Услуги и каталог</h3>
          <div class="transfer-button-row">
            <button class="secondary-button" data-export-services type="button">Экспорт услуг</button>
            <button class="secondary-button" data-import-services type="button">Импорт услуг ZIP</button>
            <button class="secondary-button" data-import-services-folder type="button">Импорт папки услуг</button>
            <button class="secondary-button" data-export-catalog type="button">Экспорт публичного каталога</button>
          </div>
        </section>
        <section class="transfer-group">
          <h3 class="mini-heading">Все данные</h3>
          <div class="transfer-button-row">
            <button class="primary-button" data-action="export-all" type="button">Экспорт всех данных</button>
            <button class="secondary-button" data-import-zip type="button">Импорт всех данных</button>
          </div>
        </section>
      </article>`,
    demo: `
      <article class="panel grid"><h2 class="card-title">Демо-данные</h2><button class="danger-button" data-clear-all type="button">Очистить все данные</button><button class="secondary-button" data-reset-demo type="button">Очистить и создать демо</button></article>`
  }[section];
  if (!content) return;
  view.innerHTML = `<section class="grid">${content}</section><button class="fab-back" data-back-settings type="button" aria-label="Назад" title="Назад"><span data-icon="back"></span></button>`;
  bindViewActions();
}

function showOperatorEditor(operatorId = "") {
  if (currentOperator()?.role !== "owner") return notify("Управление сотрудниками доступно только владельцу.");
  const operator = operatorById(operatorId);
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop operator-editor-backdrop";
  panel.innerHTML = `
    <form class="qr-panel operator-editor-panel" data-operator-editor>
      <div class="card-header">
        <div>
          <h2 class="card-title">${operator ? "Изменить сотрудника" : "Добавить сотрудника"}</h2>
          <p class="muted">Профиль работает только локально, без сервера.</p>
        </div>
        <button class="icon-button" data-close-operator-editor type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      <label class="field-label"><span>Имя</span><input class="input" name="name" required value="${escapeAttr(operator?.name || "")}" placeholder="Имя сотрудника" /></label>
      <label class="field-label"><span>Код</span><input class="input" name="code" required inputmode="numeric" pattern="[0-9]{4,6}" value="${escapeAttr(operator?.code || "")}" placeholder="4-6 цифр" /></label>
      <label class="field-label"><span>Роль</span><select class="select" name="role">
        ${Object.entries(OPERATOR_ROLES).map(([value, label]) => `<option value="${value}" ${normalizeOperatorRole(operator?.role) === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
      </select></label>
      <div class="toolbar">
        <button class="primary-button" type="submit">Сохранить</button>
        <button class="secondary-button" data-close-operator-editor type="button">Отмена</button>
      </div>
    </form>
  `;
  const close = () => panel.remove();
  panel.querySelectorAll("[data-close-operator-editor]").forEach((node) => node.addEventListener("click", close));
  panel.querySelector("[data-operator-editor]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveOperatorFromEditor(event.currentTarget, operator, close);
  });
  document.body.append(panel);
  injectIcons();
}

async function saveOperatorFromEditor(form, operator, close) {
  const fields = form.elements;
  const name = fields.name.value.trim();
  const code = normalizeOperatorCode(fields.code.value);
  const role = normalizeOperatorRole(fields.role.value);
  if (!name) return notify("Введите имя сотрудника.");
  if (!code) return notify("Код должен быть из 4-6 цифр.");
  const duplicateName = state.data.operators.find((item) => item.id !== operator?.id && item.name.trim().toLowerCase() === name.toLowerCase());
  if (duplicateName && !confirm(`Сотрудник "${name}" уже есть. Сохранить все равно?`)) return;
  const next = operator
    ? { ...operator, name, code, role, updatedAt: now() }
    : createOperatorRecord({ name, code, role });
  await put("operators", next);
  await refreshData();
  close();
  notify(operator ? "Сотрудник сохранен." : "Сотрудник добавлен.");
  renderProfile();
}

async function toggleOperatorActive(operatorId) {
  if (currentOperator()?.role !== "owner") return notify("Управление сотрудниками доступно только владельцу.");
  const operator = operatorById(operatorId);
  if (!operator) return;
  if (operator.id === state.currentOperatorId && operator.isActive !== false) return notify("Нельзя отключить текущий профиль.");
  await put("operators", { ...operator, isActive: operator.isActive === false, updatedAt: now() });
  await refreshData();
  notify(operator.isActive === false ? "Сотрудник включен." : "Сотрудник отключен.");
  renderProfile();
}

async function exportOperators() {
  return withBusy("Экспорт сотрудников...", async () => {
    if (currentOperator()?.role !== "owner") return notify("Экспорт сотрудников доступен владельцу.");
    const blob = createZip(await buildTransferExportFiles("operators"));
    downloadBlob(blob, `SPF_operators_${new Date().toISOString().slice(0, 10)}.zip`);
    await recordOperatorEvent("export", { targetType: "operators" });
    notify("Сотрудники экспортированы.");
  });
}

function showAssignOperatorPanel(scope, targetId) {
  if (currentOperator()?.role !== "owner") return notify("Назначать сотрудника может только владелец.");
  const operators = activeOperators();
  if (!operators.length) return notify("Сначала добавьте сотрудника.");
  const title = scope === "project" ? projectById(targetId)?.name : classById(targetId)?.name;
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop operator-assign-backdrop";
  panel.innerHTML = `
    <form class="qr-panel operator-editor-panel" data-assign-operator-form>
      <div class="card-header">
        <div>
          <h2 class="card-title">Назначить сотрудника</h2>
          <p class="muted">${escapeHtml(title || "Выбранные данные")}</p>
        </div>
        <button class="icon-button" data-close-assign-operator type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      <label class="field-label"><span>Сотрудник</span><select class="select" name="operatorId">
        ${operators.map((operator) => `<option value="${operator.id}">${escapeHtml(operator.name)} · ${escapeHtml(operatorRoleLabel(operator.role))}</option>`).join("")}
      </select></label>
      <p class="muted">Будут назначены авторы проекта/группы, учеников, заказов и импортированных медиа внутри выбранной области.</p>
      <div class="toolbar">
        <button class="secondary-button" data-close-assign-operator type="button">Отмена</button>
        <button class="primary-button" type="submit">Назначить</button>
      </div>
    </form>
  `;
  const close = () => panel.remove();
  panel.querySelectorAll("[data-close-assign-operator]").forEach((node) => node.addEventListener("click", close));
  panel.querySelector("[data-assign-operator-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const operatorId = new FormData(event.currentTarget).get("operatorId");
    await assignOperatorToScope(scope, targetId, operatorId);
    close();
  });
  document.body.append(panel);
  injectIcons();
}

async function assignOperatorToScope(scope, targetId, operatorId) {
  const operator = operatorById(operatorId);
  if (!operator) return notify("Сотрудник не найден.");
  const classIds = new Set();
  const studentIds = new Set();
  if (scope === "project") {
    const project = projectById(targetId);
    if (!project) return;
    await put("projects", assignOperatorFields(project, operator.id));
    classesByProject(project.id).forEach((klass) => classIds.add(klass.id));
  }
  if (scope === "class") classIds.add(targetId);
  for (const klass of state.data.classes.filter((item) => classIds.has(item.id))) {
    await put("classes", assignOperatorFields(klass, operator.id));
  }
  state.data.students.filter((student) => classIds.has(student.classId)).forEach((student) => studentIds.add(student.id));
  for (const student of state.data.students.filter((item) => studentIds.has(item.id))) {
    await put("students", assignOperatorFields(student, operator.id));
  }
  for (const order of state.data.orders.filter((item) => studentIds.has(item.studentId))) {
    await put("orders", assignOperatorFields(order, operator.id));
  }
  for (const media of state.data.media.filter((item) => studentIds.has(item.studentId))) {
    await put("media", assignOperatorFields(media, operator.id, true));
  }
  await refreshData();
  notify(`Назначено: ${operator.name}.`);
  state.preserveScroll = true;
  render();
}

function assignOperatorFields(record, operatorId, media = false) {
  const next = {
    ...record,
    createdBy: operatorId,
    updatedBy: operatorId,
    updatedAt: now()
  };
  if (media) {
    next.importedBy = record.importedBy || operatorId;
    next.capturedBy = record.capturedBy || operatorId;
  }
  if (Array.isArray(next.items)) {
    next.items = next.items.map((item) => item.status === "done"
      ? { ...item, updatedBy: operatorId, completedBy: item.completedBy || operatorId, completedAt: item.completedAt || now() }
      : { ...item, updatedBy: operatorId });
  }
  return next;
}

function studentCard(student) {
  const klass = classById(student.classId);
  const project = projectById(klass?.projectId);
  const c = completion(student.id);
  const price = studentTotalPrice(student);
  const previewUrl = studentAvatarUrl(student);
  const fullName = `${student.lastName} ${student.firstName}`.trim();
  const preview = previewUrl
    ? `<img class="student-thumb" src="${previewUrl}" alt="${escapeAttr(fullName)}" loading="lazy" />`
    : '<div class="student-thumb empty"><span>👤</span><small>Нет фото</small></div>';
  const finalStats = finalWorkStatsForStudent(student.id);
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
            <span class="price-pill">${student.paymentStatus === "paid" ? "Оплачено" : "К оплате"} ${escapeHtml(formatMoney(price))}</span>
            ${finalStats.total ? `<span class="status-pill paid">Готовые работы: ${finalStats.total}</span><span class="status-pill ${finalStats.printed === finalStats.total ? "paid" : "in-progress"}">Напечатано: ${finalStats.printed}</span>` : ""}
          </div>
        </div>
        <details class="item-menu student-menu">
          <summary aria-label="Меню ученика">...</summary>
          <div class="menu-panel">
            <button data-open-student-action="${student.id}" type="button">Открыть</button>
            <button data-edit-student="${student.id}" type="button">Редактировать</button>
            <button data-generate-qr="${student.id}" type="button">QR</button>
            <button data-open-montage="${student.id}" type="button">Монтаж</button>
            <button data-show-student-references="${student.id}" type="button">Референсы</button>
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
      navigate("classes", { projectId: node.dataset.openProject, classId: null, studentFormClassId: null });
    });
  });
  view.querySelectorAll("[data-open-project-action]").forEach((node) => {
    node.addEventListener("click", () => navigate("classes", { projectId: node.dataset.openProjectAction, classId: null, studentFormClassId: null }));
  });
  view.querySelectorAll("[data-open-project-documents]").forEach((node) => {
    node.addEventListener("click", () => navigate("classes", { projectId: node.dataset.openProjectDocuments, classId: null, studentFormClassId: null }));
  });
  view.querySelectorAll("[data-add-project]").forEach((node) => node.addEventListener("click", () => addProject(node.dataset.addProject)));
  view.querySelectorAll("[data-add-class]").forEach((node) => node.addEventListener("click", () => addClass(node.dataset.addClass)));
  view.querySelectorAll("[data-open-class], [data-show-class-students]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button") && !node.dataset.showClassStudents) return;
      if (event.target.closest("details") && !node.dataset.showClassStudents) return;
      openClassStudents(node.dataset.openClass || node.dataset.showClassStudents);
    });
    node.addEventListener("keydown", (event) => {
      if (event.target.closest("button")) return;
      if (event.target.closest("details")) return;
      if (event.key === "Enter" || event.key === " ") openClassStudents(node.dataset.openClass || node.dataset.showClassStudents);
    });
  });
  view.querySelectorAll("[data-open-class-action]").forEach((node) => node.addEventListener("click", () => openClassStudents(node.dataset.openClassAction)));
  view.querySelector("[data-close-class-students]")?.addEventListener("click", () => {
    state.classId = null;
    state.studentFormClassId = null;
    state.preserveScroll = true;
    renderClasses();
  });
  view.querySelectorAll("[data-show-class-stats]").forEach((node) => node.addEventListener("click", () => {
    state.classStatsId = node.dataset.showClassStats;
    state.preserveScroll = true;
    renderClasses();
  }));
  view.querySelector("[data-class-sort-project]")?.addEventListener("change", (event) => updateProjectClassSort(event.currentTarget.dataset.classSortProject, event.currentTarget.value));
  view.querySelectorAll("[data-move-class]").forEach((node) => node.addEventListener("click", () => moveClass(node.dataset.moveClass)));
  view.querySelectorAll("[data-set-class-color]").forEach((node) => node.addEventListener("click", () => setClassColor(node.dataset.setClassColor)));
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
  view.querySelectorAll("[data-assign-operator-project]").forEach((node) => node.addEventListener("click", () => showAssignOperatorPanel("project", node.dataset.assignOperatorProject)));
  view.querySelectorAll("[data-assign-operator-class]").forEach((node) => node.addEventListener("click", () => showAssignOperatorPanel("class", node.dataset.assignOperatorClass)));
  view.querySelector("[data-student-form]")?.addEventListener("submit", handleStudentFormSubmit);
  view.querySelector("[data-cancel-student-form]")?.addEventListener("click", () => {
    state.studentFormClassId = null;
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
  view.querySelector("[data-add-student-service]")?.addEventListener("change", (event) => {
    const studentId = event.currentTarget.dataset.addStudentService;
    const catalogId = event.currentTarget.value;
    const student = studentById(studentId);
    if (!student || !catalogId) return;
    updateStudentServices(studentId, [...selectedCatalogIdsForStudent(student), catalogId]);
  });
  view.querySelectorAll("[data-remove-student-service]").forEach((node) => node.addEventListener("click", () => {
    const [studentId, catalogId] = node.dataset.removeStudentService.split(":");
    const student = studentById(studentId);
    if (!student) return;
    updateStudentServices(studentId, selectedCatalogIdsForStudent(student).filter((id) => id !== catalogId));
  }));
  view.querySelector("[data-order-status]")?.addEventListener("change", (event) => updateOrderStatus(event.target.dataset.orderStatus, event.target.value));
  view.querySelector("[data-payment]")?.addEventListener("change", (event) => updatePayment(event.target.dataset.payment, event.target.value));
  view.querySelector("[data-manual-qr]")?.addEventListener("submit", handleManualQr);
  view.querySelector("[data-start-scan]")?.addEventListener("click", startQrScanner);
  view.querySelector("[data-import-shoot]")?.addEventListener("click", () => shootImportInput.click());
  view.querySelector("[data-import-shoot-folder]")?.addEventListener("click", () => shootFolderInput.click());
  view.querySelector("[data-import-shoot-zip]")?.addEventListener("click", () => {
    state.zipImportMode = "shoot";
    zipInput.click();
  });
  view.querySelector("[data-stop-scan]")?.addEventListener("click", stopQrStream);
  view.querySelector("[data-import-zip]")?.addEventListener("click", () => {
    state.zipImportMode = "full_backup";
    zipInput.click();
  });
  view.querySelector("[data-import-project]")?.addEventListener("click", () => {
    state.zipImportMode = "project";
    zipInput.click();
  });
  view.querySelector("[data-import-class]")?.addEventListener("click", () => {
    state.zipImportMode = "class";
    zipInput.click();
  });
  view.querySelector("[data-import-services]")?.addEventListener("click", () => {
    state.zipImportMode = "services";
    zipInput.click();
  });
  view.querySelector("[data-import-services-folder]")?.addEventListener("click", () => {
    if (!transferFolderInput) return notify("Обновите страницу, чтобы появилась загрузка папки услуг.");
    state.zipImportMode = "services";
    transferFolderInput.value = "";
    transferFolderInput.click();
  });
  view.querySelector("[data-import-settings]")?.addEventListener("click", () => {
    state.zipImportMode = "settings";
    zipInput.click();
  });
  view.querySelector("[data-import-work-config]")?.addEventListener("click", () => {
    state.zipImportMode = "work_config";
    zipInput.click();
  });
  view.querySelector("[data-export-settings]")?.addEventListener("click", exportSettings);
  view.querySelector("[data-export-work-config]")?.addEventListener("click", exportWorkConfig);
  view.querySelector("[data-export-services]")?.addEventListener("click", exportServices);
  view.querySelector("[data-export-selected-project]")?.addEventListener("click", () => exportProject(view.querySelector("[data-transfer-project]")?.value || state.projectId));
  view.querySelector("[data-export-selected-class]")?.addEventListener("click", () => exportClass(view.querySelector("[data-transfer-class]")?.value || state.classId));
  view.querySelectorAll("[data-action='export-all']").forEach((node) => node.addEventListener("click", () => exportFullBackup()));
  view.querySelectorAll("[data-export-project]").forEach((node) => node.addEventListener("click", () => exportProject(node.dataset.exportProject)));
  view.querySelectorAll("[data-export-class]").forEach((node) => node.addEventListener("click", () => exportClass(node.dataset.exportClass)));
  view.querySelectorAll("[data-export-student]").forEach((node) => node.addEventListener("click", () => exportZip(node.dataset.exportStudent)));
  view.querySelectorAll("[data-open-montage]").forEach((node) => node.addEventListener("click", () => showMontagePanel(node.dataset.openMontage)));
  view.querySelectorAll("[data-export-final-works]").forEach((node) => node.addEventListener("click", () => exportFinalWorksFromDataset(node.dataset.exportFinalWorks)));
  view.querySelectorAll("[data-mark-printed-student]").forEach((node) => node.addEventListener("click", () => markFinalWorksPrintedForStudent(node.dataset.markPrintedStudent)));
  view.querySelectorAll("[data-mark-printed-class]").forEach((node) => node.addEventListener("click", () => markFinalWorksPrintedForClass(node.dataset.markPrintedClass)));
  view.querySelectorAll("[data-view-media]").forEach((node) => node.addEventListener("click", (event) => {
    event.stopPropagation();
    showMediaPreview(node.dataset.viewMedia);
  }));
  view.querySelectorAll("[data-upload-document]").forEach((node) => node.addEventListener("click", () => selectDocumentFiles(node.dataset.uploadDocument)));
  view.querySelectorAll("[data-open-document]").forEach((node) => node.addEventListener("click", () => showDocumentPreview(node.dataset.openDocument)));
  view.querySelectorAll("[data-download-document]").forEach((node) => node.addEventListener("click", () => downloadDocument(node.dataset.downloadDocument)));
  view.querySelectorAll("[data-delete-document]").forEach((node) => node.addEventListener("click", () => deleteDocument(node.dataset.deleteDocument)));
  view.querySelectorAll("[data-export-status-class]").forEach((node) => node.addEventListener("click", () => exportStatusPdf({ classId: node.dataset.exportStatusClass })));
  view.querySelectorAll("[data-rename-class]").forEach((node) => node.addEventListener("click", () => renameClass(node.dataset.renameClass)));
  view.querySelectorAll("[data-export-status-project]").forEach((node) => node.addEventListener("click", () => exportStatusPdf({ projectId: node.dataset.exportStatusProject })));
  view.querySelector("[data-save-template]")?.addEventListener("click", saveTemplate);
  view.querySelector("[data-save-status-export-template]")?.addEventListener("click", saveStatusExportTemplate);
  view.querySelector("[data-save-watermark-settings]")?.addEventListener("click", saveWatermarkSettingsFromView);
  view.querySelector("[data-save-final-print-settings]")?.addEventListener("click", saveFinalPrintSettingsFromView);
  view.querySelector("[data-upload-watermark-logo]")?.addEventListener("click", uploadWatermarkLogo);
  view.querySelector("[data-remove-watermark-logo]")?.addEventListener("click", removeWatermarkLogo);
  view.querySelector("[data-add-template-item]")?.addEventListener("click", addTemplateEditorItem);
  view.querySelectorAll("[data-remove-template-item]").forEach((node) => node.addEventListener("click", () => {
    node.closest(".template-item-row")?.remove();
  }));
  view.querySelector("[data-clear-all]")?.addEventListener("click", clearAllData);
  view.querySelector("[data-reset-demo]")?.addEventListener("click", resetDemo);
  view.querySelector("[data-refresh-app]")?.addEventListener("click", refreshApp);
  view.querySelector("[data-reset-order]")?.addEventListener("click", () => resetOrder(state.studentId));
  view.querySelectorAll("[data-generate-qr]").forEach((node) => node.addEventListener("click", (event) => showQrPayload(event.currentTarget.dataset.generateQr || state.studentId)));
  view.querySelectorAll("[data-show-student-references]").forEach((node) => node.addEventListener("click", (event) => showStudentReferences(event.currentTarget.dataset.showStudentReferences)));
  view.querySelectorAll("[data-view-student-reference]").forEach((node) => node.addEventListener("click", (event) => {
    const payload = event.currentTarget.dataset.viewStudentReference || "";
    const divider = payload.indexOf(":");
    if (divider < 0) return;
    showStudentReferences(payload.slice(0, divider), payload.slice(divider + 1));
  }));
  view.querySelector("[data-open-services]")?.addEventListener("click", () => navigate("services"));
  view.querySelector("[data-open-public-catalog]")?.addEventListener("click", () => navigate("catalog"));
  view.querySelector("[data-open-profile]")?.addEventListener("click", () => navigate("profile"));
  view.querySelector("[data-open-operator-login]")?.addEventListener("click", () => {
    sessionStorage.removeItem(OPERATOR_SKIP_SESSION_KEY);
    renderOperatorGate();
  });
  view.querySelector("[data-logout-operator]")?.addEventListener("click", () => {
    setCurrentOperator("");
    renderOperatorGate();
  });
  view.querySelector("[data-add-operator]")?.addEventListener("click", () => showOperatorEditor());
  view.querySelectorAll("[data-edit-operator]").forEach((node) => node.addEventListener("click", () => showOperatorEditor(node.dataset.editOperator)));
  view.querySelectorAll("[data-toggle-operator]").forEach((node) => node.addEventListener("click", () => toggleOperatorActive(node.dataset.toggleOperator)));
  view.querySelector("[data-export-operators]")?.addEventListener("click", exportOperators);
  view.querySelector("[data-import-operators]")?.addEventListener("click", () => {
    state.zipImportMode = "operators";
    zipInput.click();
  });
  view.querySelectorAll("[data-profile-operator]").forEach((node) => node.addEventListener("click", () => {
    state.profileOperatorId = node.dataset.profileOperator;
    renderProfile();
  }));
  view.querySelectorAll("[data-settings-detail]").forEach((node) => node.addEventListener("click", () => showSettingsDetail(node.dataset.settingsDetail)));
  view.querySelector("[data-back-settings]")?.addEventListener("click", () => navigate("settings"));
  view.querySelector("[data-export-catalog]")?.addEventListener("click", exportPublicCatalog);
  view.querySelectorAll("[data-catalog-audience]").forEach((node) => node.addEventListener("click", () => {
    state.catalogAudience = node.dataset.catalogAudience;
    renderCatalog();
  }));
  view.querySelectorAll("[data-catalog-category]").forEach((node) => node.addEventListener("click", () => {
    state.catalogCategory = node.dataset.catalogCategory || "all";
    renderCatalog();
  }));
  view.querySelector("[data-catalog-query]")?.addEventListener("input", (event) => {
    const cursor = event.target.selectionStart || 0;
    state.catalogQuery = event.target.value;
    renderCatalog();
    requestAnimationFrame(() => {
      const input = view.querySelector("[data-catalog-query]");
      input?.focus();
      input?.setSelectionRange(cursor, cursor);
    });
  });
  view.querySelectorAll("[data-open-catalog-service]").forEach((node) => {
    node.addEventListener("click", () => showCatalogServiceViewer(node.dataset.openCatalogService));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") showCatalogServiceViewer(node.dataset.openCatalogService);
    });
  });
  view.querySelector("[data-add-catalog]")?.addEventListener("click", addCatalogItem);
  view.querySelector("[data-manage-service-categories]")?.addEventListener("click", showServiceCategoryManager);
  view.querySelector("[data-service-sort]")?.addEventListener("change", (event) => {
    state.serviceSort = event.currentTarget.value;
    renderServices();
  });
  view.querySelector("[data-service-category-filter]")?.addEventListener("change", (event) => {
    state.serviceCategoryFilter = event.currentTarget.value;
    renderServices();
  });
  view.querySelectorAll("[data-select-service]").forEach((node) => node.addEventListener("change", () => toggleServiceSelection(node.dataset.selectService, node.checked)));
  view.querySelector("[data-clear-service-selection]")?.addEventListener("click", () => {
    state.selectedServiceIds.clear();
    renderServices();
  });
  view.querySelector("[data-bulk-apply-price]")?.addEventListener("click", bulkUpdateServicePrice);
  view.querySelector("[data-bulk-apply-category]")?.addEventListener("click", bulkUpdateServiceCategory);
  view.querySelector("[data-bulk-apply-gender]")?.addEventListener("click", bulkUpdateServiceGender);
  view.querySelector("[data-bulk-copy-angles]")?.addEventListener("click", bulkCopyServiceAngles);
  view.querySelectorAll("[data-toggle-service-popular]").forEach((node) => node.addEventListener("click", () => toggleServicePopular(node.dataset.toggleServicePopular)));
  view.querySelectorAll("[data-move-service]").forEach((node) => node.addEventListener("click", () => {
    const [itemId, direction] = node.dataset.moveService.split(":");
    moveService(itemId, direction);
  }));
  view.querySelectorAll("[data-open-catalog], [data-open-catalog-action]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button") && !node.dataset.openCatalogAction) return;
      if (event.target.closest("details") && !node.dataset.openCatalogAction) return;
      if (event.target.closest("label, input, select") && !node.dataset.openCatalogAction) return;
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
  view.querySelectorAll("[data-view-angle-reference]").forEach((node) => node.addEventListener("click", () => {
    const [itemId, angleId] = node.dataset.viewAngleReference.split(":");
    showAngleReferencePreview(itemId, angleId);
  }));
  view.querySelectorAll("[data-copy-service-prompt]").forEach((node) => node.addEventListener("click", async () => {
    const copied = await copyText(servicePrompt(catalogItemById(node.dataset.copyServicePrompt)));
    notify(copied ? "Промпт скопирован" : "Не удалось скопировать промпт.");
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
        menu.classList.remove("menu-up", "menu-fixed");
        clearMenuPosition(menu);
        menu.closest(".list-card, .class-card, .student-card, .service-card")?.classList.remove("menu-host-open");
        return;
      }
      menus.forEach((other) => {
        if (other !== menu) other.open = false;
      });
      menu.closest(".list-card, .class-card, .student-card, .service-card")?.classList.add("menu-host-open");
      const panel = menu.querySelector(".menu-panel");
      const summary = menu.querySelector("summary");
      const panelHeight = panel?.offsetHeight || 190;
      const navReserve = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
      const summaryRect = summary?.getBoundingClientRect();
      const freeBelow = summaryRect ? window.innerHeight - summaryRect.bottom - navReserve - 14 : panelHeight;
      const freeAbove = summaryRect ? summaryRect.top - 14 : 0;
      if (freeBelow < Math.min(panelHeight, 260) && freeAbove < Math.min(panelHeight, 220)) {
        positionMenuPanel(menu, panel, summaryRect, navReserve);
        return;
      }
      clearMenuPosition(menu);
      menu.classList.toggle("menu-up", freeBelow < panelHeight && freeAbove > freeBelow);
    });
  });
}

function openClassStudents(classId) {
  const klass = classById(classId);
  if (!klass) return notify("Группа не найдена.");
  state.projectId = klass.projectId;
  state.classId = klass.id;
  state.studentFormClassId = null;
  state.preserveScroll = true;
  renderClasses();
}

function positionMenuPanel(menu, panel, summaryRect, navReserve) {
  if (!panel || !summaryRect) return;
  menu.classList.remove("menu-up");
  menu.classList.add("menu-fixed");
  const margin = 12;
  const panelWidth = Math.min(Math.max(panel.offsetWidth || 190, 180), window.innerWidth - margin * 2);
  const maxHeight = Math.max(180, window.innerHeight - navReserve - margin * 2);
  const left = Math.min(window.innerWidth - panelWidth - margin, Math.max(margin, summaryRect.right - panelWidth));
  const preferredTop = summaryRect.bottom + 8;
  const top = Math.min(Math.max(margin, preferredTop), Math.max(margin, window.innerHeight - navReserve - maxHeight - margin));
  menu.style.setProperty("--menu-left", `${left}px`);
  menu.style.setProperty("--menu-top", `${top}px`);
  menu.style.setProperty("--menu-width", `${panelWidth}px`);
  menu.style.setProperty("--menu-max-height", `${maxHeight}px`);
}

function clearMenuPosition(menu) {
  ["--menu-left", "--menu-top", "--menu-width", "--menu-max-height"].forEach((prop) => menu.style.removeProperty(prop));
}

async function addProject(targetRoute = "home") {
  const name = prompt("Название проекта");
  if (!name) return;
  const projectId = uid("project");
  await put("projects", stampCreated({ id: projectId, name: name.trim(), templateId: state.data.templates[0]?.id }));
  await refreshData();
  navigate(targetRoute === "classes" ? "classes" : "home", { projectId });
}

async function addClass(projectId) {
  if (!projectId) return notify("Сначала создайте проект.");
  const name = prompt("Название группы");
  if (!name) return;
  const orderIndex = nextClassOrderIndex(projectId);
  await put("classes", stampCreated({ id: uid("class"), projectId, name: name.trim(), orderIndex }));
  await refreshData();
  navigate("classes", { projectId });
}

async function updateProjectClassSort(projectId, sortMode) {
  const project = projectById(projectId);
  if (!project || !CLASS_SORT_MODES[sortMode]) return;
  await put("projects", stampUpdated({ ...project, classSort: sortMode }));
  await refreshData();
  state.preserveScroll = true;
  renderClasses();
}

async function moveClass(payload) {
  const [classId, direction] = String(payload || "").split(":");
  const klass = classById(classId);
  const project = projectById(klass?.projectId);
  if (!klass || !project) return;
  const classes = manualOrderedClasses(klass.projectId);
  const index = classes.findIndex((item) => item.id === klass.id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= classes.length) return;
  const reordered = [...classes];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  for (let orderIndex = 0; orderIndex < reordered.length; orderIndex += 1) {
    await put("classes", stampUpdated({ ...reordered[orderIndex], orderIndex }));
  }
  if (classSortMode(project) !== "manual") await put("projects", stampUpdated({ ...project, classSort: "manual" }));
  await refreshData();
  state.preserveScroll = true;
  renderClasses();
}

async function setClassColor(payload) {
  const [classId, color] = String(payload || "").split(":");
  const klass = classById(classId);
  if (!klass || !CLASS_COLOR_OPTIONS.some((option) => option.id === color)) return;
  await put("classes", stampUpdated({ ...klass, color }));
  await refreshData();
  state.preserveScroll = true;
  renderClasses();
}

function showStudentForm(classId) {
  const klass = classById(classId);
  if (!klass) return notify("Группа не найдена.");
  state.projectId = klass.projectId;
  state.classId = classId;
  state.studentFormClassId = classId;
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
    state.studentFormClassId = null;
    state.classId = null;
    navigate("student", { studentId: student.id });
    return;
  }
  await refreshData();
  notify("Ученик сохранен.");
  state.studentFormClassId = form.dataset.studentForm;
  renderClasses();
  requestAnimationFrame(() => view.querySelector("[data-student-form] input[name='fio']")?.focus());
}

async function addStudent({ classId, fio, catalogId = "", catalogIds = [], paymentStatus = "unpaid", orderStatus = "auto" }) {
  if (!classId) return null;
  if (!String(fio || "").trim()) {
    notify("Введите ФИО ученика.");
    return null;
  }
  const { firstName, lastName } = splitFullName(fio);
  const selectedCatalogIds = normalizeCatalogIds(catalogIds.length ? catalogIds : [catalogId || state.data.catalog[0]?.id || ""]);
  const selectedCatalogId = selectedCatalogIds[0] || "";
  const id = uid("student");
  const manualStatus = STUDENT_MANUAL_STATUS_KEYS.includes(orderStatus) ? orderStatus : "";
  const student = stampCreated({ id, classId, firstName, lastName, qrId: id, catalogId: selectedCatalogId, catalogIds: selectedCatalogIds, paymentStatus, orderStatus: manualStatus, status: manualStatus });
  await put("students", student);
  await put("orders", stampCreated({ id: `order_${id}`, studentId: id, catalogId: selectedCatalogId, catalogIds: selectedCatalogIds, status: manualStatus, items: orderItemsFromCatalogs(selectedCatalogIds) }));
  return student;
}

async function editStudent(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  const fio = prompt("ФИО ученика", `${student.lastName} ${student.firstName}`.trim());
  if (!fio) return;
  const { firstName, lastName } = splitFullName(fio);
  await put("students", stampUpdated({ ...student, firstName, lastName }));
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
  for (const doc of state.data.documents.filter((item) => item.projectId === projectId)) await del("documents", doc.id);
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
  await put("projects", stampUpdated({ ...project, name: name.trim() }));
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
  for (const doc of state.data.documents.filter((item) => item.groupId === classId)) await del("documents", doc.id);
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
  await put("classes", stampUpdated({ ...klass, name: name.trim() }));
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
  await put("students", stampUpdated({ ...student, catalogId: selectedCatalogIds[0], catalogIds: selectedCatalogIds }));
  await put("orders", stampUpdated({ ...order, catalogId: selectedCatalogIds[0], catalogIds: selectedCatalogIds, items: nextItems }));
  await refreshData();
  notify("Услуги и чеклист ученика обновлены.");
  state.preserveScroll = true;
  renderStudent();
}

async function addCatalogItem() {
  showCatalogEditor();
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
    status: "",
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
  const currentStatus = manualAlbumClassStatus(klass);
  const status = normalizeAlbumClassStatus(prompt("Ручной статус: auto, layout, print_ready, printed или delivered", currentStatus || "auto"), currentStatus);
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
    status: "",
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
  const status = normalizeAlbumStudentStatus(prompt("Статус: auto, not_shot, shot, processed или ready", student.status || "auto"), student.status);
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
  showCatalogEditor(itemId);
}

function showCatalogEditor(itemId = "") {
  const item = catalogItemById(itemId);
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop service-editor-backdrop";
  panel.innerHTML = `
    <form class="qr-panel service-editor-panel" data-service-editor>
      <div class="card-header">
        <div>
          <h2 class="card-title">${item ? "Редактировать услугу" : "Новая услуга"}</h2>
          <p class="muted">Достаточно названия. Остальное можно заполнить позже.</p>
        </div>
        <button class="icon-button" data-close-service-editor type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      <label class="field-label"><span>Название услуги</span><input class="input" name="title" required placeholder="Например: Пират, Принцесса, Интервью" value="${escapeAttr(serviceName(item))}" /></label>
      <div class="form-grid">
        <label class="field-label"><span>Цена</span><input class="input" name="price" inputmode="decimal" placeholder="Например: 500" value="${escapeAttr(item?.price || "")}" /></label>
        <label class="field-label"><span>Для кого услуга</span><select class="select" name="gender">
          <option value="unisex" ${serviceGender(item) === "unisex" ? "selected" : ""}>Для всех</option>
          <option value="boys" ${serviceGender(item) === "boys" ? "selected" : ""}>Для мальчиков</option>
          <option value="girls" ${serviceGender(item) === "girls" ? "selected" : ""}>Для девочек</option>
        </select></label>
      </div>
      <div class="form-grid">
        <label class="field-label"><span>Категория</span><input class="input" name="category" list="service-editor-category-options" placeholder="Мультики, Военные, Спорт" value="${escapeAttr(serviceCategory(item))}" /></label>
        <label class="checkbox-row service-editor-check"><input type="checkbox" name="popular" ${isServicePopular(item) ? "checked" : ""} /><span>Показывать в популярных</span></label>
      </div>
      <datalist id="service-editor-category-options">
        ${serviceCategoryOptions().map((category) => `<option value="${escapeAttr(category)}"></option>`).join("")}
      </datalist>
      <label class="field-label"><span>Короткое описание</span><textarea class="input textarea" name="shortDescription" placeholder="Коротко для карточки каталога">${escapeHtml(serviceShortDescription(item))}</textarea></label>
      <label class="field-label"><span>Полное описание</span><textarea class="input textarea" name="description" placeholder="Подробное описание для просмотра услуги">${escapeHtml(serviceDescription(item))}</textarea></label>
      <div class="service-editor-media-grid">
        <label class="field-label"><span>Превью фото</span><input class="input" name="preview" type="file" accept="image/*" /></label>
        <label class="field-label"><span>Превью видео</span><input class="input" name="previewVideo" type="file" accept="video/*" /></label>
      </div>
      <div class="service-form-media-grid">
        ${servicePreviewImageDataUrl(item) ? `<img class="service-form-preview" src="${servicePreviewImageDataUrl(item)}" alt="${escapeAttr(serviceName(item))}" />` : '<div class="service-form-preview empty">Нет фото</div>'}
        ${servicePreviewVideoDataUrl(item) ? `<video class="service-form-preview" src="${servicePreviewVideoDataUrl(item)}" controls playsinline></video>` : '<div class="service-form-preview empty">Нет видео</div>'}
      </div>
      <label class="field-label"><span>Prompt / инструкция</span><textarea class="input textarea" name="prompt" placeholder="Введите промпт для нейросети, текст сценария или вопросы для интервью">${escapeHtml(servicePrompt(item))}</textarea></label>
      <div class="toolbar">
        <button class="primary-button" data-save-service-editor type="submit">Сохранить</button>
        <button class="secondary-button" data-skip-service-editor type="button">${item ? "Сохранить только название" : "Пропустить и создать"}</button>
        <button class="secondary-button" data-close-service-editor type="button">Отмена</button>
      </div>
    </form>
  `;
  const close = () => panel.remove();
  panel.querySelectorAll("[data-close-service-editor]").forEach((node) => node.addEventListener("click", close));
  panel.querySelector("[data-skip-service-editor]")?.addEventListener("click", () => saveCatalogEditor(panel.querySelector("[data-service-editor]"), item, true, close));
  panel.querySelector("[data-service-editor]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCatalogEditor(event.currentTarget, item, false, close);
  });
  document.body.append(panel);
  injectIcons();
}

async function saveCatalogEditor(form, item, allowOnlyTitle, close) {
  const fields = form.elements;
  const title = fields.title.value.trim();
  if (!title) return notify("Введите название услуги.");
  const previewFile = fields.preview.files?.[0];
  const previewVideoFile = fields.previewVideo.files?.[0];
  const id = item?.id || uid("catalog");
  const previewDataUrl = previewFile ? await fileToOptimizedImageDataUrl(previewFile, { maxSize: 1600, quality: 0.84 }) : servicePreviewImageDataUrl(item);
  const previewVideoDataUrl = previewVideoFile ? await fileToDataUrl(previewVideoFile) : servicePreviewVideoDataUrl(item);
  const next = {
    ...(item || {}),
    id,
    title,
    name: title,
    price: allowOnlyTitle ? (item?.price || "") : normalizeServicePriceInput(fields.price.value),
    shortDescription: allowOnlyTitle ? serviceShortDescription(item) : fields.shortDescription.value.trim(),
    description: allowOnlyTitle ? serviceDescription(item) : fields.description.value.trim(),
    gender: allowOnlyTitle ? serviceGender(item) : normalizeServiceGender(fields.gender.value),
    category: allowOnlyTitle ? serviceCategory(item) : normalizeServiceCategory(fields.category.value),
    popular: allowOnlyTitle ? isServicePopular(item) : Boolean(fields.popular.checked),
    previewDataUrl,
    previewImageId: previewDataUrl ? (item?.previewImageId || `${id}_preview_image`) : "",
    previewName: previewFile?.name || item?.previewName || "",
    previewVideoDataUrl,
    previewVideoId: previewVideoDataUrl ? (item?.previewVideoId || `${id}_preview_video`) : "",
    previewVideoName: previewVideoFile?.name || item?.previewVideoName || "",
    prompt: allowOnlyTitle ? servicePrompt(item) : fields.prompt.value.trim(),
    mediaKind: item?.mediaKind || "both",
    orderInfo: item?.orderInfo || "",
    requirements: item?.requirements || "",
    angles: item?.angles || [],
    orderIndex: Number.isFinite(Number(item?.orderIndex)) ? Number(item.orderIndex) : nextServiceOrderIndex(),
    createdAt: item?.createdAt || now(),
    updatedAt: now()
  };
  await put("catalog", item ? stampUpdated(next) : stampCreated(next));
  await refreshData();
  close();
  notify(item ? "Услуга сохранена." : "Услуга создана.");
  navigate("serviceDetail", { catalogId: next.id });
}

async function duplicateCatalogItem(itemId) {
  const item = catalogItemById(itemId);
  if (!item) return;
  const copyId = uid("catalog");
  const copy = {
    ...item,
    id: copyId,
    title: `${serviceName(item)} копия`,
    name: `${serviceName(item)} копия`,
    previewImageId: servicePreviewImageDataUrl(item) ? `${copyId}_preview_image` : "",
    previewVideoId: servicePreviewVideoDataUrl(item) ? `${copyId}_preview_video` : "",
    popular: false,
    orderIndex: nextServiceOrderIndex(),
    angles: (item.angles || []).map((angle) => ({ ...angle })),
    createdAt: now(),
    updatedAt: now()
  };
  await put("catalog", stampCreated(copy));
  await refreshData();
  notify("Услуга продублирована.");
  renderServices();
}

async function deleteCatalogItem(itemId) {
  if (!confirm("Удалить услугу из каталога?")) return;
  await del("catalog", itemId);
  state.selectedServiceIds.delete(itemId);
  await refreshData();
  renderServices();
}

function pruneSelectedServices() {
  const valid = new Set(state.data.catalog.map((item) => item.id));
  Array.from(state.selectedServiceIds).forEach((id) => {
    if (!valid.has(id)) state.selectedServiceIds.delete(id);
  });
}

function selectedServiceItems() {
  return state.data.catalog.filter((item) => state.selectedServiceIds.has(item.id));
}

function toggleServiceSelection(itemId, checked) {
  if (checked) state.selectedServiceIds.add(itemId);
  else state.selectedServiceIds.delete(itemId);
  renderServices();
}

async function toggleServicePopular(itemId) {
  const item = catalogItemById(itemId);
  if (!item) return;
  await put("catalog", stampUpdated({ ...item, popular: !isServicePopular(item) }));
  await refreshData();
  renderServices();
}

async function moveService(itemId, direction) {
  const items = manualOrderedServices();
  const currentIndex = items.findIndex((item) => item.id === itemId);
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) return;
  const reordered = [...items];
  const moving = reordered[currentIndex];
  reordered[currentIndex] = reordered[nextIndex];
  reordered[nextIndex] = moving;
  for (const [index, item] of reordered.entries()) {
    await put("catalog", stampUpdated({ ...item, orderIndex: index }));
  }
  await refreshData();
  renderServices();
}

async function bulkUpdateServicePrice() {
  const priceInput = view.querySelector("[data-bulk-price]");
  const price = normalizeServicePriceInput(priceInput?.value || "");
  if (!price) return notify("Введите цену для выбранных услуг.");
  const items = selectedServiceItems();
  if (!items.length) return notify("Выберите услуги.");
  await updateSelectedServices((item) => stampUpdated({ ...item, price }));
  notify(`Цена применена: ${items.length} услуг.`);
}

async function bulkUpdateServiceCategory() {
  const category = normalizeServiceCategory(view.querySelector("[data-bulk-category]")?.value || "");
  const items = selectedServiceItems();
  if (!items.length) return notify("Выберите услуги.");
  await updateSelectedServices((item) => stampUpdated({ ...item, category }));
  notify(category ? `Категория "${category}" применена.` : "Категория очищена.");
}

async function bulkUpdateServiceGender() {
  const gender = normalizeServiceGender(view.querySelector("[data-bulk-gender]")?.value || "unisex");
  const items = selectedServiceItems();
  if (!items.length) return notify("Выберите услуги.");
  await updateSelectedServices((item) => stampUpdated({ ...item, gender }));
  notify(`Аудитория применена: ${serviceGenderLabel(gender)}.`);
}

async function bulkCopyServiceAngles() {
  const sourceId = view.querySelector("[data-bulk-angle-source]")?.value || "";
  const source = catalogItemById(sourceId);
  const items = selectedServiceItems();
  if (!source) return notify("Выберите услугу-источник.");
  if (!items.length) return notify("Выберите услуги.");
  const sourceAngles = (source.angles || []).map((angle) => ({ ...angle }));
  await updateSelectedServices((item) => stampUpdated({
    ...item,
    angles: sourceAngles.map((angle) => ({ ...angle, serviceId: item.id }))
  }));
  notify(`Ракурсы скопированы: ${items.length} услуг.`);
}

async function updateSelectedServices(updater) {
  const items = selectedServiceItems();
  for (const item of items) await put("catalog", updater(item));
  await refreshData();
  renderServices();
}

async function addCatalogAngle(itemId) {
  showAngleEditor(itemId);
}

async function editCatalogAngle(itemId, angleId) {
  showAngleEditor(itemId, angleId);
}

function showAngleEditor(itemId, angleId = "") {
  const item = catalogItemById(itemId);
  const angle = (item?.angles || []).find((entry) => entry.id === angleId);
  if (!item) return;
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop service-editor-backdrop";
  panel.innerHTML = `
    <form class="qr-panel service-editor-panel" data-angle-editor>
      <div class="card-header">
        <div>
          <h2 class="card-title">${angle ? "Редактировать ракурс" : "Новый ракурс"}</h2>
          <p class="muted">Фото и видео-референсы можно добавить позже.</p>
        </div>
        <button class="icon-button" data-close-angle-editor type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      <label class="field-label"><span>Название ракурса</span><input class="input" name="name" required placeholder="Портрет, полный рост, бок, видео, интервью" value="${escapeAttr(angle?.name || "")}" /></label>
      <label class="field-label"><span>Описание ракурса</span><textarea class="input textarea" name="details" placeholder="Описание ракурса, сценарий или короткая инструкция">${escapeHtml(angle?.details || "")}</textarea></label>
      <label class="field-label"><span>Референс изображения</span><input class="input" name="imageReference" type="file" accept="image/*" /></label>
      <label class="field-label"><span>Референс видео</span><input class="input" name="videoReference" type="file" accept="video/*" /></label>
      <div class="service-reference-summary">
        ${angle?.refDataUrl ? '<span class="status-pill paid">Фото есть</span>' : '<span class="muted">Фото не добавлено</span>'}
        ${angle?.videoRefDataUrl ? '<span class="status-pill in-progress">Видео есть</span>' : '<span class="muted">Видео не добавлено</span>'}
      </div>
      <div class="toolbar">
        <button class="primary-button" type="submit">Сохранить</button>
        <button class="secondary-button" data-skip-angle-editor type="button">Пропустить</button>
        <button class="secondary-button" data-close-angle-editor type="button">Отмена</button>
      </div>
    </form>
  `;
  const close = () => panel.remove();
  panel.querySelectorAll("[data-close-angle-editor]").forEach((node) => node.addEventListener("click", close));
  panel.querySelector("[data-skip-angle-editor]")?.addEventListener("click", () => saveAngleEditor(panel.querySelector("[data-angle-editor]"), item, angle, true, close));
  panel.querySelector("[data-angle-editor]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveAngleEditor(event.currentTarget, item, angle, false, close);
  });
  document.body.append(panel);
  injectIcons();
}

async function saveAngleEditor(form, item, angle, allowOnlyName, close) {
  const fields = form.elements;
  const name = fields.name.value.trim();
  if (!name) return notify("Введите название ракурса.");
  const imageFile = fields.imageReference.files?.[0];
  const videoFile = fields.videoReference.files?.[0];
  const refDataUrl = imageFile ? await fileToOptimizedImageDataUrl(imageFile, { maxSize: 1600, quality: 0.84 }) : angle?.refDataUrl || "";
  const videoRefDataUrl = videoFile ? await fileToDataUrl(videoFile) : angle?.videoRefDataUrl || "";
  const baseId = angle?.id || uniqueAngleId(item, normalizeOrderType(name));
  const nextAngle = {
    ...(angle || {}),
    id: baseId,
    serviceId: item.id,
    name,
    details: allowOnlyName ? (angle?.details || "") : fields.details.value.trim(),
    description: allowOnlyName ? (angle?.description || "") : fields.details.value.trim(),
    refDataUrl,
    refName: imageFile?.name || angle?.refName || "",
    imageReferenceId: refDataUrl ? `${baseId}_image` : "",
    videoRefDataUrl,
    videoRefName: videoFile?.name || angle?.videoRefName || "",
    videoReferenceId: videoRefDataUrl ? `${baseId}_video` : "",
    createdAt: angle?.createdAt || now(),
    updatedAt: now()
  };
  const angles = angle
    ? (item.angles || []).map((entry) => entry.id === angle.id ? nextAngle : entry)
    : [...(item.angles || []), nextAngle];
  await put("catalog", stampUpdated({ ...item, angles }));
  await refreshData();
  close();
  notify(angle ? "Ракурс сохранен." : "Ракурс добавлен.");
  renderServiceDetail();
}

async function deleteCatalogAngle(itemId, angleId) {
  const item = catalogItemById(itemId);
  if (!item || !confirm("Удалить ракурс?")) return;
  await put("catalog", stampUpdated({ ...item, angles: (item.angles || []).filter((entry) => entry.id !== angleId) }));
  await refreshData();
  renderServiceDetail();
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

function showAngleReferencePreview(itemId, angleId) {
  const item = catalogItemById(itemId);
  const angle = (item?.angles || []).find((entry) => entry.id === angleId);
  if (!angle) return;
  if (!angle.refDataUrl && !angle.videoRefDataUrl) return notify("Референс не добавлен.");
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop service-reference-backdrop";
  panel.innerHTML = `
    <section class="qr-panel service-reference-panel" role="dialog" aria-modal="true" aria-label="Референс ракурса">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHtml(angle.name)}</h2>
          <p class="muted">${escapeHtml(serviceName(item))}</p>
        </div>
        <button class="icon-button" data-close-reference-preview type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      ${angle.refDataUrl ? `<img class="reference-preview-media" src="${angle.refDataUrl}" alt="${escapeAttr(angle.name)}" />` : ""}
      ${angle.videoRefDataUrl ? `<video class="reference-preview-media" src="${angle.videoRefDataUrl}" controls playsinline></video>` : ""}
    </section>
  `;
  panel.querySelector("[data-close-reference-preview]")?.addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (event) => {
    if (event.target === panel) panel.remove();
  });
  document.body.append(panel);
  injectIcons();
}

function showMediaPreview(mediaId) {
  const media = mediaById(mediaId);
  if (!media?.blob) return notify("Файл не найден.");
  const url = URL.createObjectURL(media.blob);
  showInlineMediaPreview({
    url,
    title: media.fileName || "Медиа",
    isVideo: media.type === "video",
    revokeOnClose: true
  });
}

function showInlineMediaPreview({ url, title = "Просмотр", isVideo = false, revokeOnClose = false }) {
  if (!url) return;
  document.querySelector(".inline-media-backdrop")?.remove();
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop inline-media-backdrop";
  panel.innerHTML = `
    <section class="qr-panel service-reference-panel inline-media-panel" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHtml(title)}</h2>
        </div>
        <button class="icon-button" data-close-inline-media type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      ${isVideo ? `<video class="reference-preview-media" src="${escapeAttr(url)}" controls playsinline></video>` : `<img class="reference-preview-media" src="${escapeAttr(url)}" alt="${escapeAttr(title)}" />`}
    </section>
  `;
  const close = () => {
    if (revokeOnClose) URL.revokeObjectURL(url);
    panel.remove();
  };
  panel.querySelector("[data-close-inline-media]")?.addEventListener("click", close);
  panel.addEventListener("click", (event) => {
    if (event.target === panel) close();
  });
  document.body.append(panel);
  injectIcons();
}

function documentsSection(ownerType, ownerId) {
  const docs = documentsForOwner(ownerType, ownerId);
  const titleText = ownerType === "project" ? "Документы проекта" : "Документы группы";
  return `
    <section class="panel document-section">
      <div class="card-header">
        <div>
          <h2 class="card-title">${titleText}</h2>
          <p class="muted">${docs.length ? `${docs.length} ${pluralizeRu(docs.length, "файл", "файла", "файлов")}` : "PDF, DOC, DOCX, JPG, PNG, WEBP"}</p>
        </div>
        <button class="primary-button compact" data-upload-document="${ownerType}:${ownerId}" type="button"><span data-icon="plus"></span>Файл</button>
      </div>
      <div class="document-list">
        ${docs.map(documentCard).join("") || '<p class="muted">Документы появятся здесь.</p>'}
      </div>
    </section>
  `;
}

function documentCard(doc) {
  return `
    <article class="document-card">
      <div class="document-icon">${escapeHtml(documentExtension(doc).toUpperCase() || "FILE")}</div>
      <div class="document-copy">
        <strong>${escapeHtml(doc.fileName || doc.name || "Документ")}</strong>
        <span class="muted">${escapeHtml(formatDocumentMeta(doc))}</span>
      </div>
      <div class="document-actions">
        <button class="secondary-button compact" data-open-document="${doc.id}" type="button">Открыть</button>
        <button class="secondary-button compact" data-download-document="${doc.id}" type="button">Скачать</button>
        <button class="danger-button compact" data-delete-document="${doc.id}" type="button">Удалить</button>
      </div>
    </article>
  `;
}

function documentsForOwner(ownerType, ownerId) {
  return (state.data.documents || [])
    .filter((doc) => documentOwnerMatches(doc, ownerType, ownerId))
    .sort((a, b) => String(b.addedAt || b.createdAt || "").localeCompare(String(a.addedAt || a.createdAt || "")));
}

function documentOwnerMatches(doc, ownerType, ownerId) {
  if (!doc || !ownerId) return false;
  if (ownerType === "project") return doc.ownerType === "project" && doc.projectId === ownerId && !doc.groupId;
  if (ownerType === "group") return ["group", "class"].includes(doc.ownerType) && doc.groupId === ownerId;
  return doc.ownerType === ownerType && (doc.ownerId === ownerId || doc.projectId === ownerId || doc.groupId === ownerId);
}

function selectDocumentFiles(payload) {
  const [ownerType, ownerId] = String(payload || "").split(":");
  if (!documentInput) return notify("Загрузка документов недоступна.");
  if (!documentTargetExists(ownerType, ownerId)) return notify("Раздел документов не найден.");
  state.currentDocumentTarget = { ownerType, ownerId };
  documentInput.value = "";
  documentInput.click();
}

async function handleDocumentInput(event) {
  const files = Array.from(event.target.files || []);
  const target = state.currentDocumentTarget;
  event.target.value = "";
  state.currentDocumentTarget = null;
  if (!files.length || !target) return;
  let saved = 0;
  let skipped = 0;
  for (const file of files) {
    if (!fileLooksDocument(file)) {
      skipped += 1;
      continue;
    }
    const record = await createDocumentRecord(file, target);
    await put("documents", record);
    saved += 1;
  }
  await refreshData();
  state.preserveScroll = true;
  notify(saved ? `Документы сохранены: ${saved}${skipped ? `, пропущено: ${skipped}` : ""}.` : "Поддерживаются только PDF, DOC, DOCX, JPG, PNG и WEBP.");
  render();
}

async function createDocumentRecord(file, target) {
  const time = now();
  const operatorId = currentOperatorIdForAction();
  const ids = documentOwnerIds(target.ownerType, target.ownerId);
  const fileName = safeFileName(file.name || `document.${documentExtensionFromFile(file) || "pdf"}`);
  const record = {
    id: uid("document"),
    ownerType: target.ownerType,
    ownerId: target.ownerId,
    projectId: ids.projectId,
    groupId: ids.groupId,
    fileName,
    originalFileName: file.name || fileName,
    mimeType: file.type || documentMimeType(fileName),
    size: file.size || 0,
    addedAt: time,
    addedBy: operatorId,
    createdAt: time,
    createdBy: operatorId,
    updatedAt: time,
    updatedBy: operatorId,
    storageMode: "indexeddb",
    blob: file
  };
  return persistDocumentFile(record, file);
}

async function persistDocumentFile(record, file) {
  const adapter = window.VakhaStudio?.documents;
  const desktopPath = desktopDocumentPath(record);
  if (adapter?.save) {
    try {
      const result = await adapter.save({ ...record, desktopPath }, file);
      return {
        ...record,
        blob: result?.keepIndexedDbBlob ? file : undefined,
        path: result?.path || desktopPath,
        desktopPath,
        storageMode: "filesystem"
      };
    } catch {
      notify("Desktop-хранилище недоступно, документ сохранен в IndexedDB.");
    }
  }
  return { ...record, desktopPath };
}

async function showDocumentPreview(documentId) {
  const doc = documentById(documentId);
  if (!doc) return notify("Документ не найден.");
  const blob = await documentBlob(doc);
  const preview = documentPreviewKind(doc);
  const url = blob && preview ? URL.createObjectURL(blob) : "";
  document.querySelector(".document-preview-backdrop")?.remove();
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop document-preview-backdrop";
  panel.innerHTML = `
    <section class="qr-panel document-preview-panel" role="dialog" aria-modal="true" aria-label="${escapeAttr(doc.fileName || "Документ")}">
      <div class="card-header">
        <div>
          <h2 class="card-title">${escapeHtml(doc.fileName || "Документ")}</h2>
          <p class="muted">${escapeHtml(formatDocumentMeta(doc))}</p>
        </div>
        <button class="icon-button" data-close-document-preview type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      ${documentPreviewHtml({ doc, preview, url, hasBlob: Boolean(blob) })}
      <div class="toolbar">
        <button class="secondary-button" data-download-document="${doc.id}" type="button">Скачать</button>
        <button class="danger-button" data-delete-document="${doc.id}" type="button">Удалить</button>
      </div>
    </section>
  `;
  const close = () => {
    if (url) URL.revokeObjectURL(url);
    panel.remove();
  };
  panel.addEventListener("click", (event) => {
    if (event.target === panel || event.target.closest("[data-close-document-preview]")) close();
  });
  panel.querySelector("[data-download-document]")?.addEventListener("click", () => downloadDocument(doc.id));
  panel.querySelector("[data-delete-document]")?.addEventListener("click", async () => {
    await deleteDocument(doc.id);
    close();
  });
  document.body.append(panel);
  injectIcons();
}

function documentPreviewHtml({ doc, preview, url, hasBlob }) {
  if (preview === "image" && url) return `<img class="document-preview-media" src="${escapeAttr(url)}" alt="${escapeAttr(doc.fileName)}" />`;
  if (preview === "pdf" && url) return `<iframe class="document-preview-frame" src="${escapeAttr(url)}" title="${escapeAttr(doc.fileName)}"></iframe>`;
  const message = hasBlob
    ? "Для этого формата доступно скачивание, встроенный preview не поддерживается."
    : "Файл хранится во внешнем filesystem. Preview станет доступен, когда desktop-адаптер вернет файл приложению.";
  return `<div class="document-preview-empty"><strong>${escapeHtml(documentExtension(doc).toUpperCase() || "FILE")}</strong><span>${escapeHtml(message)}</span></div>`;
}

async function downloadDocument(documentId) {
  const doc = documentById(documentId);
  if (!doc) return notify("Документ не найден.");
  const blob = await documentBlob(doc);
  if (!blob) return notify("Файл недоступен для скачивания.");
  downloadBlob(blob, doc.fileName || "document");
}

async function deleteDocument(documentId) {
  const doc = documentById(documentId);
  if (!doc) return;
  if (!confirm(`Удалить документ "${doc.fileName || "Документ"}"?`)) return;
  const adapter = window.VakhaStudio?.documents;
  if (adapter?.delete && doc.storageMode === "filesystem") {
    await adapter.delete(doc).catch(() => {});
  }
  await del("documents", documentId);
  await refreshData();
  document.querySelector(".document-preview-backdrop")?.remove();
  state.preserveScroll = true;
  notify("Документ удален.");
  render();
}

function documentById(documentId) {
  return (state.data.documents || []).find((doc) => doc.id === documentId);
}

async function documentBlob(doc) {
  if (doc?.blob) return doc.blob;
  const adapter = window.VakhaStudio?.documents;
  if (adapter?.read) {
    try {
      const result = await adapter.read(doc);
      if (result instanceof Blob) return result;
      if (result instanceof ArrayBuffer || ArrayBuffer.isView(result)) return new Blob([result], { type: doc.mimeType || documentMimeType(doc.fileName) });
    } catch {
      return null;
    }
  }
  return null;
}

function documentTargetExists(ownerType, ownerId) {
  if (ownerType === "project") return Boolean(projectById(ownerId));
  if (ownerType === "group") return Boolean(classById(ownerId));
  return false;
}

function documentOwnerIds(ownerType, ownerId) {
  if (ownerType === "project") return { projectId: ownerId, groupId: "" };
  if (ownerType === "group") {
    const klass = classById(ownerId);
    return { projectId: klass?.projectId || "", groupId: ownerId };
  }
  return { projectId: "", groupId: "" };
}

function desktopDocumentPath(doc) {
  const project = projectById(doc.projectId);
  const group = classById(doc.groupId);
  const projectName = safePath(project?.name || doc.projectId || "Project");
  const prefix = group ? `${safePath(group.name)}_` : "";
  return `/VakhaStudio/Projects/${projectName}/Documents/${prefix}${safeFileName(doc.fileName || "document")}`;
}

function fileLooksDocument(file) {
  const ext = documentExtensionFromFile(file);
  return DOCUMENT_ACCEPTED_EXTENSIONS.includes(ext) || DOCUMENT_ACCEPTED_TYPES.includes(file?.type || "");
}

function documentPreviewKind(doc) {
  const ext = documentExtension(doc);
  const mime = doc.mimeType || documentMimeType(doc.fileName);
  if (["jpg", "jpeg", "png", "webp"].includes(ext) || mime.startsWith("image/")) return "image";
  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  return "";
}

function documentMimeType(fileName) {
  const ext = String(fileName || "").split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "application/pdf";
  if (ext === "doc") return "application/msword";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function documentExtension(doc) {
  return String(doc?.fileName || doc?.originalFileName || "").split(".").pop()?.toLowerCase() || "";
}

function documentExtensionFromFile(file) {
  return String(file?.name || "").split(".").pop()?.toLowerCase() || "";
}

function formatDocumentMeta(doc) {
  const date = formatActivityDate(doc.addedAt || doc.createdAt);
  const size = formatFileSize(doc.size);
  const author = operatorDisplayName(doc.addedBy || doc.createdBy);
  return [date, size, author].filter(Boolean).join(" · ");
}

function formatFileSize(size) {
  const bytes = Number(size || 0);
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} МБ`;
}

function studentReferenceEntries(studentId, taskType = "") {
  const student = studentById(studentId);
  const order = orderByStudent(studentId);
  if (!student || !order) return [];
  return (order.items || [])
    .filter((item) => !taskType || item.type === taskType)
    .map((item) => {
      const angle = catalogAngleForStudent(studentId, item.type);
      const parsed = parseServiceTaskType(item.type);
      const catalog = parsed ? catalogItemById(parsed.catalogId) : catalogItemById(student.catalogId || order.catalogId);
      return angle ? { item, angle, catalog } : null;
    })
    .filter((entry) => entry && (entry.angle.refDataUrl || entry.angle.videoRefDataUrl));
}

function showStudentReferences(studentId, taskType = "") {
  const student = studentById(studentId);
  if (!student) return;
  const entries = studentReferenceEntries(studentId, taskType);
  if (!entries.length) return notify("Для этого ученика референсы не добавлены.");
  document.querySelector(".student-reference-backdrop")?.remove();
  const name = `${student.lastName} ${student.firstName}`.trim() || "Ученик";
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop student-reference-backdrop";
  panel.innerHTML = `
    <section class="qr-panel student-reference-panel" role="dialog" aria-modal="true" aria-label="Референсы ученика">
      <div class="card-header">
        <div>
          <h2 class="card-title">Референсы</h2>
          <p class="muted">${escapeHtml(name)}</p>
        </div>
        <button class="icon-button" data-close-student-references type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      <div class="student-reference-list">
        ${entries.map(studentReferenceCard).join("")}
      </div>
    </section>
  `;
  panel.querySelector("[data-close-student-references]")?.addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (event) => {
    if (event.target === panel) panel.remove();
  });
  document.body.append(panel);
  injectIcons();
}

function studentReferenceCard(entry) {
  const { angle, catalog, item } = entry;
  const media = angle.refDataUrl
    ? `<img class="reference-preview-media" src="${angle.refDataUrl}" alt="${escapeAttr(angle.name)}" />`
    : `<video class="reference-preview-media" src="${angle.videoRefDataUrl}" controls playsinline></video>`;
  return `
    <article class="student-reference-card">
      <div>
        <strong>${escapeHtml(orderItemLabel(item))}</strong>
        <p class="muted">${escapeHtml(serviceName(catalog) || "Услуга")}</p>
      </div>
      ${media}
      ${angle.details ? `<p class="muted">${escapeHtml(angle.details)}</p>` : ""}
    </article>
  `;
}

async function generateReferenceSet(itemId) {
  const item = catalogItemById(itemId);
  if (!item) return;
  const subject = prompt("Кого сделать в референсах?", "человек, современный нейтральный образ, студийный свет");
  if (!subject?.trim()) return;
  const cleanSubject = subject.trim();
  const promptText = buildReferenceAiPrompt(cleanSubject);
  const nextAngles = mergeReferenceAngles(item.angles || [], cleanSubject);
  await put("catalog", stampUpdated({
    ...item,
    angles: nextAngles,
    orderInfo: item.orderInfo || "Набор референсов для портретной съемки.",
    requirements: item.requirements || "Одинаковый свет, чистый фон, спокойная поза, без лишних предметов в кадре."
  }));
  const copied = await copyText(promptText);
  if (!copied) prompt("Скопируйте промпт для ChatGPT / генератора изображений", promptText);
  await refreshData();
  notify(copied ? "AI-референсы добавлены. Промпт для генерации скопирован." : "AI-референсы добавлены. Промпт показан для копирования.");
  state.catalogId = item.id;
  renderServiceDetail();
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
  state.currentCapture = { studentId: state.studentId, type, orderType, source: "capture" };
  mediaInput.accept = type === "video" ? "video/*" : "image/*";
  mediaInput.capture = "environment";
  mediaInput.value = "";
  mediaInput.click();
}

function importMediaFromDevice(orderType) {
  state.currentCapture = { studentId: state.studentId, type: "photo", orderType, source: "device_import" };
  mediaInput.accept = "image/*,video/*";
  mediaInput.removeAttribute("capture");
  mediaInput.value = "";
  mediaInput.click();
}

function showMontagePanel(studentId, selectedServiceId = "", selectedMediaId = "") {
  const student = studentById(studentId);
  if (!student) return notify("Ученик не найден.");
  const klass = classById(student.classId);
  const project = projectById(klass?.projectId);
  const services = selectedCatalogIdsForStudent(student).map(catalogItemById).filter(Boolean);
  const service = services.find((item) => item.id === selectedServiceId) || services[0];
  const photos = mediaByStudent(student.id).filter((item) => item.type === "photo" || item.type === "image");
  const source = photos.find((item) => item.id === selectedMediaId)
    || photos.find((item) => item.orderType === "portrait")
    || photos[0];
  const reference = service ? montageReferenceForService(service) : null;
  const promptText = service ? servicePrompt(service) : "";
  const works = service ? finalWorksForStudent(student.id).filter((work) => work.serviceId === service.id) : [];
  const sourceUrl = source?.blob ? URL.createObjectURL(source.blob) : "";
  const referenceUrl = reference?.url || "";
  document.querySelector(".montage-backdrop")?.remove();
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop montage-backdrop";
  panel.innerHTML = `
    <section class="qr-panel montage-panel" role="dialog" aria-modal="true" aria-label="Монтаж">
      <div class="card-header">
        <div>
          <h2 class="card-title">Монтаж</h2>
          <p class="muted">${escapeHtml(`${student.lastName} ${student.firstName}`.trim())} · ${escapeHtml(project?.name || "Проект")} · ${escapeHtml(klass?.name || "Группа")}</p>
        </div>
        <button class="icon-button" data-close-montage type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      <div class="grid">
        ${services.length > 1 ? `<label class="field-label"><span>Услуга</span><select class="select" data-montage-service>${services.map((item) => `<option value="${item.id}" ${item.id === service?.id ? "selected" : ""}>${escapeHtml(serviceName(item))}</option>`).join("")}</select></label>` : `<div class="detail-stat"><span>Услуга</span><strong>${escapeHtml(service ? serviceName(service) : "Услуги не выбраны")}</strong></div>`}
        <div class="montage-grid">
          <article class="panel grid">
            <div class="card-header"><h3 class="card-title">Фото ребёнка</h3></div>
            ${sourceUrl ? `<img class="montage-preview" src="${sourceUrl}" alt="${escapeAttr(source.fileName)}" />` : '<div class="empty">Фото ученика не найдено</div>'}
            ${photos.length > 1 ? `<select class="select" data-montage-source>${photos.map((item) => `<option value="${item.id}" ${item.id === source?.id ? "selected" : ""}>${escapeHtml(item.fileName || item.id)}</option>`).join("")}</select>` : ""}
            <div class="toolbar">
              ${sourceUrl ? `<button class="secondary-button compact" data-preview-url="${escapeAttr(sourceUrl)}" data-preview-title="${escapeAttr(source.fileName || "Фото ребёнка")}" type="button">Открыть</button><button class="secondary-button compact" data-download-media="${source.id}" type="button">Скачать</button>` : ""}
            </div>
          </article>
          <article class="panel grid">
            <div class="card-header"><h3 class="card-title">Референс услуги</h3>${reference?.isVideo ? '<span class="status-pill in-progress">Видео</span>' : ""}</div>
            ${referenceUrl ? (reference.isVideo ? `<video class="montage-preview" src="${referenceUrl}" controls playsinline></video>` : `<img class="montage-preview" src="${referenceUrl}" alt="${escapeAttr(reference.name || serviceName(service))}" />`) : '<div class="empty">Референс не добавлен</div>'}
            <div class="toolbar">
              ${referenceUrl ? `<button class="secondary-button compact" data-preview-url="${escapeAttr(referenceUrl)}" data-preview-title="${escapeAttr(reference.name || serviceName(service) || "Референс")}" data-preview-video="${reference.isVideo ? "true" : "false"}" type="button">Открыть</button><button class="secondary-button compact" data-download-url="${escapeAttr(referenceUrl)}" data-download-name="${escapeAttr(reference.name || "reference")}" type="button">Скачать</button>` : ""}
            </div>
          </article>
        </div>
        <div class="montage-grid montage-secondary-grid">
          <article class="panel grid">
            <div class="card-header"><h3 class="card-title">Prompt</h3>${promptText ? `<button class="secondary-button compact" data-copy-montage-prompt type="button">Скопировать</button>` : ""}</div>
            ${promptText ? `<div class="prompt-box montage-prompt-box">${escapeHtml(promptText)}</div>` : '<p class="muted">Промпт не добавлен.</p>'}
          </article>
          <article class="panel grid">
            <div class="card-header"><h3 class="card-title">Результат</h3><span class="muted">${works.length ? `Готовых работ: ${works.length}` : "Пока нет"}</span></div>
            <div class="toolbar">
              <button class="primary-button" data-add-final-work type="button"><span data-icon="plus"></span>Добавить результат</button>
              ${works.length ? `<button class="secondary-button" data-export-final-works="student:${student.id}" type="button">Экспорт для печати</button>` : ""}
            </div>
          </article>
        </div>
      </div>
    </section>
  `;
  const close = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    panel.remove();
  };
  panel.addEventListener("click", (event) => {
    if (event.target === panel || event.target.closest("[data-close-montage]")) close();
  });
  panel.querySelector("[data-montage-service]")?.addEventListener("change", (event) => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    panel.remove();
    showMontagePanel(student.id, event.currentTarget.value, source?.id || "");
  });
  panel.querySelector("[data-montage-source]")?.addEventListener("change", (event) => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    panel.remove();
    showMontagePanel(student.id, service?.id || "", event.currentTarget.value);
  });
  panel.querySelector("[data-copy-montage-prompt]")?.addEventListener("click", async () => {
    await copyText(promptText);
    notify("Промпт скопирован");
  });
  panel.querySelector("[data-add-final-work]")?.addEventListener("click", () => {
    if (!service) return notify("Выберите услугу для монтажа.");
    state.currentFinalWork = { studentId: student.id, serviceId: service.id, sourceMediaId: source?.id || "", referenceMediaId: reference?.id || "" };
    finalWorkInput.value = "";
    finalWorkInput.click();
  });
  panel.querySelectorAll("[data-preview-url]").forEach((node) => node.addEventListener("click", () => {
    showInlineMediaPreview({
      url: node.dataset.previewUrl,
      title: node.dataset.previewTitle || "Просмотр",
      isVideo: node.dataset.previewVideo === "true"
    });
  }));
  panel.querySelectorAll("[data-download-media]").forEach((node) => node.addEventListener("click", () => downloadMediaRecord(node.dataset.downloadMedia)));
  panel.querySelectorAll("[data-download-url]").forEach((node) => node.addEventListener("click", () => {
    downloadUrl(node.dataset.downloadUrl, node.dataset.downloadName || "reference");
  }));
  panel.querySelectorAll("[data-export-final-works]").forEach((node) => node.addEventListener("click", () => exportFinalWorksFromDataset(node.dataset.exportFinalWorks)));
  document.body.append(panel);
  injectIcons();
}

async function handleFinalWorkInput(event) {
  const file = event.target.files?.[0];
  const target = state.currentFinalWork;
  event.target.value = "";
  if (!file || !target) return;
  if (!fileLooksImage(file)) return notify("Выберите изображение результата.");
  const student = studentById(target.studentId);
  const service = catalogItemById(target.serviceId);
  const klass = classById(student?.classId);
  if (!student || !service || !klass) return notify("Не удалось сохранить результат.");
  const existing = finalWorksForStudent(student.id).filter((work) => work.serviceId === service.id);
  let replaceWork = null;
  if (existing.length) {
    const answer = prompt("По этой услуге уже есть готовая работа.\n1 - заменить результат\n2 - добавить ещё один вариант\n3 - отменить", "2");
    if (answer === "3" || answer === null) return;
    if (answer === "1") replaceWork = existing[existing.length - 1];
    if (answer !== "1" && answer !== "2") return notify("Действие отменено.");
  }
  const mediaId = uid("media");
  const ext = extensionFor(file, "photo");
  const fileName = safeFileName(`${klass.name}_${student.lastName}_${student.firstName}_${serviceName(service)}_final.${ext}`);
  await put("media", {
    id: mediaId,
    studentId: student.id,
    type: "final_work",
    fileName,
    orderType: "final_work",
    serviceId: service.id,
    createdBy: currentOperatorIdForAction(),
    createdAt: now(),
    blob: file
  });
  if (replaceWork) {
    const updatedWork = {
      ...replaceWork,
      sourceMediaId: target.sourceMediaId || replaceWork.sourceMediaId,
      referenceMediaId: target.referenceMediaId || replaceWork.referenceMediaId,
      resultMediaId: mediaId,
      status: "ready"
    };
    updatedWork.printQrPayload = finalWorkCompactQrPayload(updatedWork);
    await put("finalWorks", stampUpdated(updatedWork));
  } else {
    const work = createFinalWorkRecord({
      projectId: klass.projectId,
      groupId: klass.id,
      studentId: student.id,
      serviceId: service.id,
      sourceMediaId: target.sourceMediaId,
      referenceMediaId: target.referenceMediaId,
      resultMediaId: mediaId
    });
    await put("finalWorks", work);
  }
  state.currentFinalWork = null;
  await refreshData();
  await markStudentOrderReadyAfterFinalWork(student.id);
  await refreshData();
  notify("Готовая работа сохранена.");
  document.querySelector(".montage-backdrop")?.remove();
  showMontagePanel(student.id, service.id, target.sourceMediaId);
}

function montageReferenceForService(service) {
  const imageUrl = String(service?.previewImage || servicePreviewImageDataUrl(service) || "").trim();
  if (imageUrl) return { id: servicePreviewImageId(service), url: imageUrl, name: `${serviceName(service)}_preview`, isVideo: false };
  const angle = (service?.angles || []).find((item) => item.refDataUrl) || (service?.angles || [])[0];
  if (angle?.refDataUrl) return { id: angle.id, url: angle.refDataUrl, name: angle.refName || angle.name || "reference", isVideo: false };
  const videoUrl = String(service?.previewVideo || servicePreviewVideoDataUrl(service) || angle?.videoRefDataUrl || "").trim();
  if (videoUrl) return { id: servicePreviewVideoId(service) || angle?.id || "", url: videoUrl, name: angle?.videoRefName || "reference-video", isVideo: true };
  return null;
}

function createFinalWorkRecord(input) {
  const id = uid("final");
  return stampCreated({
    id,
    projectId: input.projectId,
    groupId: input.groupId,
    studentId: input.studentId,
    serviceId: input.serviceId,
    sourceMediaId: input.sourceMediaId || "",
    referenceMediaId: input.referenceMediaId || "",
    resultMediaId: input.resultMediaId,
    printQrPayload: finalWorkCompactQrPayload({ id }),
    status: "ready"
  });
}

function finalWorksForStudent(studentId) {
  return state.data.finalWorks.filter((work) => work.studentId === studentId);
}

function finalWorkStatsForStudent(studentId) {
  const works = finalWorksForStudent(studentId);
  return { total: works.length, printed: works.filter((work) => work.status === "printed" || work.status === "delivered").length };
}

function finalWorkPrintSettings() {
  const saved = state.data.settings.find((item) => item.id === SETTING_IDS.finalWorkPrint) || {};
  return {
    id: SETTING_IDS.finalWorkPrint,
    qrEnabled: saved.qrEnabled !== false,
    qrPosition: ["bottom-right", "bottom-left", "top-right", "top-left"].includes(saved.qrPosition) ? saved.qrPosition : "bottom-right",
    qrSize: ["small", "medium", "large"].includes(saved.qrSize) ? saved.qrSize : "small",
    qrMargin: ["5px", "10px", "20px"].includes(saved.qrMargin) ? saved.qrMargin : "10px"
  };
}

async function saveFinalPrintSettingsFromView() {
  await put("settings", {
    id: SETTING_IDS.finalWorkPrint,
    qrEnabled: Boolean(view.querySelector("[data-final-print-qr-enabled]")?.checked),
    qrPosition: view.querySelector("[data-final-print-qr-position]")?.value || "bottom-right",
    qrSize: view.querySelector("[data-final-print-qr-size]")?.value || "small",
    qrMargin: view.querySelector("[data-final-print-qr-margin]")?.value || "10px"
  });
  await refreshData();
  notify("Настройки печати сохранены.");
  showSettingsDetail("finalPrint");
}

async function exportFinalWorksFromDataset(datasetValue) {
  const [scope, id] = String(datasetValue || "").split(":");
  const printWindow = window.open("", "_blank");
  if (!printWindow) return notify("Разрешите открытие нового окна для печати.");
  printWindow.document.write("<p>Готовлю печать...</p>");
  const works = finalWorksForScope(scope, id);
  if (!works.length) {
    printWindow.document.body.textContent = "Готовые работы не найдены.";
    return notify("Готовые работы не найдены.");
  }
  const filter = prompt("Фильтр печати:\n1 - все готовые\n2 - только не напечатанные\n3 - только по услуге", "2");
  if (filter === null) return printWindow.close();
  let selected = works;
  if (filter === "2") selected = selected.filter((work) => work.status !== "printed" && work.status !== "delivered");
  if (filter === "3") {
    const serviceId = chooseFinalWorkServiceId(selected);
    if (!serviceId) return printWindow.close();
    selected = selected.filter((work) => work.serviceId === serviceId);
  }
  if (!selected.length) {
    printWindow.document.body.textContent = "Нет готовых работ по выбранному фильтру.";
    return notify("Нет готовых работ по выбранному фильтру.");
  }
  const pages = [];
  for (const work of selected) {
    const media = mediaById(work.resultMediaId);
    if (!media?.blob) continue;
    const imageUrl = await finalWorkPrintImageUrl(work, media);
    pages.push(`<section class="print-page"><img src="${imageUrl}" alt="" /></section>`);
  }
  printWindow.document.open();
  printWindow.document.write(finalWorksPrintHtml(pages.join(""), selected.map((work) => work.id)));
  printWindow.document.close();
}

function finalWorksForScope(scope, id) {
  if (scope === "student") return state.data.finalWorks.filter((work) => work.studentId === id);
  if (scope === "class") return state.data.finalWorks.filter((work) => work.groupId === id);
  if (scope === "project") return state.data.finalWorks.filter((work) => work.projectId === id);
  return [];
}

function chooseFinalWorkServiceId(works) {
  const ids = Array.from(new Set(works.map((work) => work.serviceId).filter(Boolean)));
  if (!ids.length) return "";
  const labels = ids.map((id, index) => `${index + 1}. ${serviceName(catalogItemById(id)) || id}`).join("\n");
  const answer = Number.parseInt(prompt(`Выберите услугу номером:\n${labels}`, "1") || "", 10);
  return ids[answer - 1] || "";
}

async function finalWorkPrintImageUrl(work, media) {
  const settings = finalWorkPrintSettings();
  if (!settings.qrEnabled) return URL.createObjectURL(media.blob);
  const image = await loadImageFromBlob(media.blob);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(image.src);
  const qrImage = await loadImageFromSvg(createQrSvg(finalWorkCompactQrPayload(work), 4));
  const size = finalWorkQrPixelSize(settings.qrSize, canvas.width, canvas.height);
  const margin = Number.parseInt(settings.qrMargin, 10) || 10;
  const x = settings.qrPosition.endsWith("right") ? canvas.width - size - margin : margin;
  const y = settings.qrPosition.startsWith("bottom") ? canvas.height - size - margin : margin;
  context.drawImage(qrImage, x, y, size, size);
  URL.revokeObjectURL(qrImage.src);
  const blob = await canvasToBlob(canvas, media.blob.type || "image/png", 0.95);
  return URL.createObjectURL(blob);
}

const FINAL_WORK_PRINT_QR_PREFIX = "VSF1:";

function finalWorkCompactQrPayload(work) {
  return `${FINAL_WORK_PRINT_QR_PREFIX}${base64UrlEncode(work.id || "")}`;
}

function finalWorkIdFromCompactPrintQr(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith(FINAL_WORK_PRINT_QR_PREFIX)) return "";
  const token = raw.slice(FINAL_WORK_PRINT_QR_PREFIX.length).trim();
  const decoded = base64UrlDecode(token);
  if (String(decoded || "").startsWith("final_")) return decoded;
  return token.startsWith("final_") ? token : "";
}

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  try {
    const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function finalWorkQrPixelSize(size, width, height) {
  const base = Math.min(width, height);
  const ratio = size === "large" ? 0.14 : size === "medium" ? 0.1 : 0.07;
  return Math.max(72, Math.round(base * ratio));
}

function finalWorksPrintHtml(pagesHtml, ids) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Печать готовых работ</title><style>
    @page{size:A4;margin:0}
    body{margin:0;background:#fff}
    .print-actions{position:fixed;z-index:10;top:12px;left:12px;display:flex;gap:8px;font-family:Arial,sans-serif}
    .print-actions button{border:0;border-radius:8px;padding:10px 14px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer}
    .print-actions button.secondary{background:#111827}
    .print-page{page-break-after:always;width:100vw;height:100vh;display:grid;place-items:center;background:#fff}
    .print-page img{max-width:100%;max-height:100vh;object-fit:contain}
    @media print{.print-actions{display:none}}
  </style></head><body>
    <div class="print-actions"><button onclick="window.print()">Печать</button><button class="secondary" onclick="window.opener&&window.opener.markFinalWorksPrintedFromPrintWindow(${escapeAttr(JSON.stringify(ids))})">Отметить как напечатано</button></div>
    ${pagesHtml}
  </body></html>`;
}

async function markFinalWorksPrinted(ids) {
  const set = new Set(ids || []);
  const works = state.data.finalWorks.filter((work) => set.has(work.id));
  for (const work of works) {
    await put("finalWorks", stampUpdated({ ...work, status: "printed" }));
  }
  await refreshData();
  notify("Готовые работы отмечены как напечатанные.");
  render();
}

async function markFinalWorksPrintedForStudent(studentId) {
  const works = state.data.finalWorks.filter((work) => work.studentId === studentId && work.status !== "printed" && work.status !== "delivered");
  if (!works.length) return notify("Нет готовых работ для отметки печати.");
  if (!confirm(`Отметить как напечатанные: ${works.length}?`)) return;
  await markFinalWorksPrinted(works.map((work) => work.id));
}

async function markFinalWorksPrintedForClass(classId) {
  const works = state.data.finalWorks.filter((work) => work.groupId === classId && work.status !== "printed" && work.status !== "delivered");
  if (!works.length) return notify("В группе нет готовых работ для отметки печати.");
  if (!confirm(`Отметить как напечатанные все готовые работы группы: ${works.length}?`)) return;
  await markFinalWorksPrinted(works.map((work) => work.id));
}

async function markStudentOrderReadyAfterFinalWork(studentId) {
  const student = studentById(studentId);
  if (!student) return;
  const order = orderByStudent(studentId);
  const manualStatus = manualStudentStatus(student);
  if (!manualStatus && (order.status || student.orderStatus || student.status)) {
    await put("orders", stampUpdated({ ...order, status: "" }));
    await put("students", stampUpdated({ ...student, orderStatus: "", status: "" }));
  }
}

window.markFinalWorksPrintedFromPrintWindow = markFinalWorksPrinted;

function mediaById(id) {
  return state.data.media.find((item) => item.id === id);
}

function downloadMediaRecord(mediaId) {
  const media = mediaById(mediaId);
  if (media?.blob) downloadBlob(media.blob, media.fileName || "media");
}

function downloadUrl(url, fileName) {
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(fileName || "download");
  link.click();
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(blob);
  });
}

function loadImageFromSvg(svg) {
  return loadImageFromBlob(new Blob([svg], { type: "image/svg+xml" }));
}

function canvasToBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
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
  const operatorId = currentOperatorIdForAction();
  const mediaRecord = {
    id,
    studentId: student.id,
    type,
    fileName,
    orderType: state.currentCapture.orderType,
    createdBy: operatorId,
    importedBy: state.currentCapture.source === "device_import" ? operatorId : undefined,
    capturedBy: state.currentCapture.source === "capture" ? operatorId : undefined,
    createdAt: now(),
    blob: file
  };
  if (mediaRecord.importedBy) mediaRecord.importedAt = mediaRecord.createdAt;
  await put("media", mediaRecord);
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
    createdBy: currentOperatorIdForAction(),
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
      : { portraitMediaId: media.id };
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
  const refDataUrl = await fileToOptimizedImageDataUrl(file, { maxSize: 1600, quality: 0.84 });
  const angles = (item.angles || []).map((angle) => angle.id === angleId ? { ...angle, refDataUrl, refName: file.name } : angle);
  await put("catalog", stampUpdated({ ...item, angles }));
  state.currentReference = null;
  event.target.value = "";
  await refreshData();
  notify("Референс сохранен.");
  if (state.route === "serviceDetail") renderServiceDetail();
  else renderServices();
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
  if (task.kind === "watermarkLogo") {
    await saveWatermarkLogo(file);
    return;
  }
  if (task.kind === "catalog") {
    const item = catalogItemById(task.itemId);
    if (!item) return;
    const previewDataUrl = await fileToOptimizedImageDataUrl(file, { maxSize: 1600, quality: 0.84 });
    await put("catalog", stampUpdated({ ...item, previewDataUrl, previewImageId: item.previewImageId || `${item.id}_preview_image`, previewName: file.name || "preview" }));
    await refreshData();
    notify("Превью услуги сохранено.");
    if (state.route === "serviceDetail") renderServiceDetail();
    else renderServices();
  }
}

async function attachFileToOrder(studentId, type, fileId) {
  const order = orderByStudent(studentId);
  let item = order.items.find((entry) => entry.type === type) || order.items[0];
  if (!item) {
    item = { type, status: "pending", fileIds: [] };
    order.items = [item];
  }
  const operatorId = currentOperatorIdForAction();
  item.fileIds = Array.from(new Set([...item.fileIds, fileId]));
  item.status = "done";
  item.updatedBy = operatorId;
  item.completedBy = operatorId;
  item.completedAt = now();
  await saveOrderWithAutoStatus(studentId, order);
}

async function markTaskDone(studentId, type) {
  if (!type) return;
  const order = orderByStudent(studentId);
  const item = order.items.find((entry) => entry.type === type);
  if (item) {
    const operatorId = currentOperatorIdForAction();
    item.status = "done";
    item.updatedBy = operatorId;
    item.completedBy = operatorId;
    item.completedAt = now();
  }
  await saveOrderWithAutoStatus(studentId, order);
  await refreshData();
  state.preserveScroll = true;
  renderStudent();
}

async function toggleTask(studentId, type) {
  const order = orderByStudent(studentId);
  const item = order.items.find((entry) => entry.type === type);
  if (item) {
    const operatorId = currentOperatorIdForAction();
    item.status = item.status === "done" ? "pending" : "done";
    item.updatedBy = operatorId;
    if (item.status === "done") {
      item.completedBy = operatorId;
      item.completedAt = now();
    }
  }
  await saveOrderWithAutoStatus(studentId, order);
  await refreshData();
  state.preserveScroll = true;
  renderStudent();
}

async function updatePayment(studentId, paymentStatus) {
  const student = studentById(studentId);
  await put("students", stampUpdated({ ...student, paymentStatus }));
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
  order.status = "";
  const student = studentById(studentId);
  if (student) await put("students", stampUpdated({ ...student, orderStatus: "", status: "" }));
  await put("orders", stampUpdated(order));
  await refreshData();
  state.preserveScroll = true;
  renderStudent();
}

async function saveOrderWithAutoStatus(studentId, order) {
  const student = studentById(studentId);
  const manualStatus = student ? manualStudentStatus(student) : "";
  await put("orders", stampUpdated({ ...order, status: manualStatus }));
  if (student) await put("students", stampUpdated({ ...student, orderStatus: manualStatus, status: manualStatus }));
}

async function updateOrderStatus(studentId, orderStatus) {
  const student = studentById(studentId);
  if (!student) return;
  const manualStatus = STUDENT_MANUAL_STATUS_KEYS.includes(orderStatus) ? orderStatus : "";
  const order = orderByStudent(studentId);
  await put("students", stampUpdated({ ...student, orderStatus: manualStatus, status: manualStatus }));
  await put("orders", stampUpdated({ ...order, status: manualStatus }));
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
    await put("orders", stampUpdated({ ...order, items: mergeOrderItems(order.items || [], uniqueRows.map((row) => row.type), labels) }));
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
    await put("orders", stampUpdated({ ...order, catalogId: itemId, catalogIds: [itemId], items: orderItemsFromCatalogs([itemId], order.items || []) }));
  }
  for (const student of state.data.students) {
    await put("students", stampUpdated({ ...student, catalogId: itemId, catalogIds: [itemId] }));
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
  state.studentFormClassId = null;
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
  const printPayload = parseFinalWorkPrintQr(value);
  if (printPayload) {
    showFinalWorkPrintQrPanel(printPayload);
    return;
  }
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
  const student = stampCreated({
    id: qrId,
    classId,
    firstName,
    lastName,
    qrId,
    catalogId: selectedCatalogId,
    catalogIds: selectedCatalogIds,
    paymentStatus: "unpaid",
    orderStatus: "",
    status: ""
  });
  await put("students", student);
  await put("orders", stampCreated({
    id: `order_${qrId}`,
    studentId: qrId,
    catalogId: selectedCatalogId,
    catalogIds: selectedCatalogIds,
    status: "",
    items: orderItemsFromCatalogs(selectedCatalogIds)
  }));
  await refreshData();
  notify("Ученик создан из QR.");
  navigate("student", { studentId: qrId });
}

async function ensureQrFallbackClass() {
  const existing = state.classId || state.data.classes.find((klass) => klass.projectId === state.projectId)?.id || state.data.classes[0]?.id;
  if (existing) return existing;
  const projectId = uid("project");
  const classId = uid("class");
  await put("projects", stampCreated({ id: projectId, name: "QR импорт", templateId: state.data.templates[0]?.id }));
  await put("classes", stampCreated({ id: classId, projectId, name: "Без группы" }));
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
  const files = Array.from(event.target.files || []);
  event.target.value = "";
  await startQrSeparatedImport(files);
}

async function importShootEntries(entries) {
  const files = [];
  const errors = [];
  for (const entry of entries.sort(sortZipEntries)) {
    if (isIgnoredZipEntry(entry)) continue;
    if (isHeicZipEntry(entry)) {
      errors.push(`${entry.path}: HEIC/HEIF пропущен`);
      continue;
    }
    if (!isSupportedImageZipEntry(entry)) continue;
    files.push(zipEntryToFile(entry, "photo"));
  }
  return startQrSeparatedImport(files, errors);
}

async function importShotForStudent(student, file, meta = {}) {
  const klass = classById(student.classId);
  const orderType = nextImportOrderType(student.id);
  const ext = extensionFor(file, "photo");
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const fileName = safeFileName(`${klass?.name || "class"}_${student.lastName}_${student.firstName}_${orderType}_${baseName}.${ext}`);
  const id = uid("media");
  const operatorId = currentOperatorIdForAction();
  await put("media", {
    id,
    studentId: student.id,
    type: "photo",
    fileName,
    orderType,
    originalFileName: meta.originalFileName || file.name,
    importSessionId: meta.importSessionId || "",
    orderIndex: Number.isFinite(meta.orderIndex) ? meta.orderIndex : null,
    source: meta.source || "",
    createdBy: operatorId,
    importedBy: operatorId,
    importedAt: now(),
    createdAt: now(),
    blob: file
  });
  await attachFileToOrder(student.id, orderType, id);
}

async function startQrSeparatedImport(rawFiles, initialErrors = []) {
  const prepared = prepareImportFiles(rawFiles, initialErrors);
  if (!prepared.files.length) {
    notify(prepared.errors.length ? `Нет подходящих изображений. ${prepared.errors[0]}` : "Нет изображений для импорта.");
    return null;
  }
  const draft = await processQrSeparatedImport(prepared.files, prepared.errors);
  state.currentImportDraft = draft;
  showImportDraftPanel(draft);
  return draft;
}

function prepareImportFiles(rawFiles, initialErrors = []) {
  const errors = [...initialErrors];
  const files = [];
  Array.from(rawFiles || []).forEach((file) => {
    const name = file.webkitRelativePath || file.name || "";
    if (isIgnoredImportPath(name)) return;
    if (fileLooksHeic(file)) {
      errors.push(`${name || file.name}: HEIC/HEIF пропущен`);
      return;
    }
    if (!fileLooksSupportedImage(file)) return;
    files.push(file);
  });
  return { files, errors };
}

async function processQrSeparatedImport(files, initialErrors = []) {
  const importSessionId = uid("import");
  const sortedFiles = await sortFilesByCaptureOrder(files);
  devImportDebug("qr-import files", { total: files.length, order: sortedFiles.map((file) => file.webkitRelativePath || file.name) });
  const byStudent = new Map();
  const unassigned = [];
  const qrMarkers = [];
  const unknownQr = [];
  const unknownGroups = [];
  const errors = [...initialErrors];
  let currentStudentId = "";
  let currentUnknownGroup = null;
  for (let index = 0; index < sortedFiles.length; index += 1) {
    const file = sortedFiles[index];
    try {
      const qr = await scanQrFromImageFile(file);
      const parsed = qr ? parseStudentQrPayload(qr.rawText) : { studentId: null };
      const resolvedStudent = qr ? resolveStudentFromQr(qr.rawText, parsed) : null;
      if (parsed.studentId || resolvedStudent) {
        const student = resolvedStudent;
        const markerId = parsed.studentId || student?.id || qr.rawText;
        qrMarkers.push({ fileName: file.name, orderIndex: index, studentId: markerId, rawText: qr.rawText, found: Boolean(student) });
        devImportDebug("qr-import marker", { orderIndex: index, fileName: file.name, studentId: markerId, rawText: qr.rawText, found: Boolean(student), matchedStudentId: student?.id || "" });
        currentStudentId = student?.id || "";
        currentUnknownGroup = null;
        if (!student) {
          const marker = { studentId: markerId, rawText: qr.rawText, fileName: file.name, orderIndex: index };
          unknownQr.push(marker);
          currentUnknownGroup = { id: uid("unknown_qr"), marker, photos: [] };
          unknownGroups.push(currentUnknownGroup);
        }
        continue;
      }
      const photo = { file, originalFileName: file.name, orderIndex: index, importSessionId, source: "qr_import" };
      if (currentStudentId) {
        const list = byStudent.get(currentStudentId) || [];
        list.push(photo);
        byStudent.set(currentStudentId, list);
      } else if (currentUnknownGroup) {
        currentUnknownGroup.photos.push(photo);
      } else {
        unassigned.push(photo);
      }
    } catch (error) {
      errors.push(`${file.name}: ${error?.message || "ошибка обработки"}`);
    }
  }
  const foundMarkers = qrMarkers.filter((marker) => marker.found);
  if (foundMarkers.length === 1 && unassigned.length) {
    const onlyStudentId = resolveStudentFromQr(foundMarkers[0].rawText, { studentId: foundMarkers[0].studentId })?.id;
    if (onlyStudentId) {
      const list = byStudent.get(onlyStudentId) || [];
      list.push(...unassigned.splice(0));
      byStudent.set(onlyStudentId, list);
      devImportDebug("qr-import single marker fallback", { studentId: onlyStudentId, movedToStudent: list.length });
    }
  }
  if (foundMarkers.length > 1 && unassigned.length && assignedPhotoCount(byStudent) === 0) {
    const markerStudents = foundMarkers
      .map((marker) => resolveStudentFromQr(marker.rawText, { studentId: marker.studentId }))
      .filter(Boolean);
    if (markerStudents.length === foundMarkers.length) {
      distributeUnassignedAcrossMarkers(unassigned, markerStudents, byStudent);
      devImportDebug("qr-import multi marker fallback", { markers: markerStudents.length, assigned: assignedPhotoCount(byStudent) });
    }
  }
  if (!foundMarkers.length && qrMarkers.length === 1 && state.data.students.length === 1) {
    const onlyStudentId = state.data.students[0].id;
    const photos = [
      ...unassigned.splice(0),
      ...(unknownGroups[0]?.photos.splice(0) || [])
    ];
    if (photos.length) byStudent.set(onlyStudentId, photos);
    qrMarkers[0].found = true;
    qrMarkers[0].autoMatched = true;
    qrMarkers[0].matchedStudentId = onlyStudentId;
    devImportDebug("qr-import one student fallback", { studentId: onlyStudentId });
  }
  if (!foundMarkers.length && unknownGroups.length && unknownGroups.length === state.data.students.length) {
    unknownGroups.forEach((group, index) => {
      const student = state.data.students[index];
      if (!student || !group.photos.length) return;
      const list = byStudent.get(student.id) || [];
      list.push(...group.photos.splice(0));
      byStudent.set(student.id, list);
      group.assignedStudentId = student.id;
    });
    devImportDebug("qr-import ordered unknown marker fallback", { groups: unknownGroups.length });
  }
  const students = Array.from(byStudent.entries()).map(([studentId, photos]) => ({ studentId, student: studentById(studentId), photos }));
  devImportDebug("qr-import draft", {
    total: sortedFiles.length,
    qrMarkers: qrMarkers.length,
    assigned: students.reduce((sum, item) => sum + item.photos.length, 0),
    unassigned: unassigned.length,
    errors: errors.length
  });
  return { id: importSessionId, totalFiles: sortedFiles.length, students, unassigned, unknownGroups, qrMarkers, unknownQr, errors };
}

function assignedPhotoCount(byStudent) {
  return Array.from(byStudent.values()).reduce((sum, photos) => sum + photos.length, 0);
}

function distributeUnassignedAcrossMarkers(unassigned, markerStudents, byStudent) {
  const total = unassigned.length;
  const markers = markerStudents.length;
  markerStudents.forEach((student, index) => {
    const remainingMarkers = markers - index;
    const take = Math.ceil(unassigned.length / remainingMarkers);
    const chunk = unassigned.splice(0, take);
    const list = byStudent.get(student.id) || [];
    list.push(...chunk);
    byStudent.set(student.id, list);
  });
  if (unassigned.length) devImportDebug("qr-import multi marker remainder", { total, left: unassigned.length });
}

async function confirmImportDraft(draft) {
  return withBusy("Сохраняю импорт...", async () => {
    if (!draft) return;
    let saved = 0;
    for (const group of draft.students) {
      const student = group.student || studentById(group.studentId);
      if (!student) continue;
      for (const photo of group.photos) {
        await importShotForStudent(student, photo.file, {
          originalFileName: photo.originalFileName,
          importSessionId: draft.id,
          orderIndex: photo.orderIndex,
          source: "qr_import"
        });
        saved += 1;
      }
    }
    for (const photo of draft.unassigned) {
      await saveUnassignedImportPhoto(photo, draft.id);
      saved += 1;
    }
    await recordOperatorEvent("import", { targetType: "qr_media", targetId: draft.id, count: saved });
    await refreshData();
    closeImportDraftPanel();
    notify(`Импорт подтвержден: сохранено ${saved}, QR ${draft.qrMarkers.length}, не распределено ${draft.unassigned.length}.`);
  });
}

async function saveUnassignedImportPhoto(photo, importSessionId) {
  const ext = extensionFor(photo.file, "photo");
  const fileName = safeFileName(`unassigned_${String(photo.orderIndex + 1).padStart(4, "0")}_${photo.originalFileName || `photo.${ext}`}`);
  await put("media", {
    id: uid("media"),
    studentId: "",
    type: "photo",
    fileName,
    orderType: "unassigned",
    originalFileName: photo.originalFileName || photo.file.name,
    importSessionId,
    orderIndex: photo.orderIndex,
    source: "qr_import",
    unassigned: true,
    createdBy: currentOperatorIdForAction(),
    importedBy: currentOperatorIdForAction(),
    importedAt: now(),
    createdAt: now(),
    blob: photo.file
  });
}

function showImportDraftPanel(draft) {
  document.querySelector(".import-draft-backdrop")?.remove();
  const assigned = draft.students.reduce((sum, item) => sum + item.photos.length, 0);
  const unassignedCount = importDraftUnassignedCount(draft);
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop import-draft-backdrop";
  panel.innerHTML = `
    <section class="qr-panel import-draft-panel" role="dialog" aria-modal="true" aria-label="Проверка импорта">
      <div class="card-header">
        <div>
          <h2 class="card-title">Проверка импорта</h2>
          <p class="muted">Проверьте распределение перед сохранением.</p>
        </div>
        <button class="icon-button" data-cancel-import-draft type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      <div class="stats finance-stats">
        <div class="stat"><strong>${draft.totalFiles}</strong><span class="muted">Всего файлов</span></div>
        <div class="stat"><strong>${draft.qrMarkers.length}</strong><span class="muted">QR найдено</span></div>
        <div class="stat"><strong>${assigned}</strong><span class="muted">Распределено</span></div>
        <div class="stat"><strong>${unassignedCount}</strong><span class="muted">Не распределено</span></div>
      </div>
      <div class="import-draft-list">
        ${draft.students.map((item) => {
          const name = `${item.student?.lastName || ""} ${item.student?.firstName || ""}`.trim() || item.studentId;
          return `<div class="import-draft-row"><strong>${escapeHtml(name)}</strong><span>${item.photos.length} фото</span></div>`;
        }).join("") || '<p class="muted">Фото по ученикам пока не распределены.</p>'}
        ${(draft.unknownGroups || []).filter((group) => group.photos.length).map((group, index) => `
          <div class="import-draft-row warning"><strong>QR-блок ${index + 1}</strong><span>${group.photos.length} фото</span></div>
          ${importDraftAssignControl(group.id)}
        `).join("")}
        ${draft.unassigned.length ? `<div class="import-draft-row warning"><strong>До первого QR</strong><span>${draft.unassigned.length} фото</span></div>` : ""}
        ${draft.unassigned.length ? importDraftAssignControl() : ""}
        ${draft.unknownQr.length ? `<div class="import-draft-errors"><strong>QR найден, ученик не найден</strong>${draft.unknownQr.slice(0, 4).map((item) => `<span>${escapeHtml(item.studentId || item.rawText || item.fileName)}</span>`).join("")}</div>` : ""}
        ${draft.errors.length ? `<div class="import-draft-errors"><strong>Предупреждения</strong>${draft.errors.slice(0, 6).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-cancel-import-draft type="button">Отмена</button>
        <button class="primary-button" data-confirm-import-draft type="button">Подтвердить импорт</button>
      </div>
    </section>
  `;
  panel.querySelectorAll("[data-cancel-import-draft]").forEach((node) => node.addEventListener("click", closeImportDraftPanel));
  panel.querySelectorAll("[data-assign-import-draft]").forEach((node) => {
    node.addEventListener("click", () => {
      const row = node.closest(".import-draft-assign");
      assignDraftUnassignedToStudent(row?.querySelector("[data-import-draft-student]")?.value, node.dataset.assignImportDraft || "");
    });
  });
  panel.querySelector("[data-confirm-import-draft]")?.addEventListener("click", () => confirmImportDraft(state.currentImportDraft));
  document.body.append(panel);
  injectIcons();
}

function importDraftUnassignedCount(draft) {
  return (draft.unassigned || []).length + (draft.unknownGroups || []).reduce((sum, group) => sum + group.photos.length, 0);
}

function importDraftAssignControl(groupId = "") {
  if (!state.data.students.length) return "";
  return `
    <div class="import-draft-assign">
      <select class="select" data-import-draft-student aria-label="Назначить ученику">
        ${state.data.students.map((student) => `<option value="${student.id}">${escapeHtml(`${student.lastName} ${student.firstName}`.trim() || student.id)}</option>`).join("")}
      </select>
      <button class="secondary-button compact" data-assign-import-draft="${escapeAttr(groupId)}" type="button">Назначить фото</button>
    </div>
  `;
}

function assignDraftUnassignedToStudent(studentId, groupId = "") {
  const draft = state.currentImportDraft;
  const student = studentById(studentId);
  if (!draft || !student) return;
  const source = groupId
    ? (draft.unknownGroups || []).find((group) => group.id === groupId)?.photos
    : draft.unassigned;
  if (!source?.length) return;
  const group = draft.students.find((item) => item.studentId === student.id);
  if (group) group.photos.push(...source.splice(0));
  else draft.students.push({ studentId: student.id, student, photos: source.splice(0) });
  showImportDraftPanel(draft);
}

function closeImportDraftPanel() {
  document.querySelector(".import-draft-backdrop")?.remove();
  state.currentImportDraft = null;
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
    createdBy: currentOperatorIdForAction(),
    importedBy: currentOperatorIdForAction(),
    importedAt: now(),
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

function resolveStudentFromQr(rawText, parsed = parseStudentQrPayload(rawText)) {
  const candidates = new Set(qrPayloadCandidates(rawText));
  qrPayloadCandidates(parsed.studentId).forEach((candidate) => candidates.add(candidate));
  if (parsed.classId) candidates.add(normalizeQrToken(parsed.classId));
  if (parsed.projectId) candidates.add(normalizeQrToken(parsed.projectId));
  return state.data.students.find((entry) => {
    const ids = [entry.id, entry.qrId].filter(Boolean).map(normalizeQrToken);
    return ids.some((id) => candidates.has(id));
  }) || null;
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
      studentFormClassId: target.studentFormClassId || null,
      query: target.query,
      filter: target.filter
    });
    return;
  }
  const student = studentById(state.studentId);
  const klass = classById(student?.classId);
  navigate("classes", { projectId: klass?.projectId || state.projectId, classId: null, studentFormClassId: null });
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
  return detectQrFromCanvas(canvas)
    || detectQrFromCanvas(canvas, centerScanArea(canvas.width, canvas.height))
    || detectQrFromCanvas(resizedCanvas(canvas, 1200))
    || detectQrFromCanvas(resizedCanvas(canvas, 1200), centerScanAreaForCanvas(resizedCanvas(canvas, 1200)));
}

async function scanQrFromImageFile(file) {
  const rawText = await detectQrFromImageFile(file);
  return rawText ? { rawText } : null;
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

function centerScanAreaForCanvas(canvas) {
  return centerScanArea(canvas.width, canvas.height);
}

function resizedCanvas(sourceCanvas, maxWidth) {
  if (sourceCanvas.width <= maxWidth) return sourceCanvas;
  const scale = maxWidth / sourceCanvas.width;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sourceCanvas.width * scale);
  canvas.height = Math.round(sourceCanvas.height * scale);
  canvas.getContext("2d", { willReadFrequently: true }).drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  return canvas;
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

function parseFinalWorkPrintQr(value) {
  const finalWorkId = finalWorkIdFromCompactPrintQr(value);
  if (finalWorkId) return { type: "final_work_print", finalWorkId, format: "compact" };
  try {
    const payload = JSON.parse(String(value || "").trim());
    if (payload?.type === "final_work_print" && payload.finalWorkId) return payload;
  } catch {}
  return null;
}

function showFinalWorkPrintQrPanel(payload) {
  const work = findFinalWorkFromPrintPayload(payload);
  if (!work) return notify("Готовая работа не найдена");
  const student = studentById(work.studentId);
  const klass = classById(work.groupId || student?.classId);
  const project = projectById(work.projectId || klass?.projectId);
  const service = catalogItemById(work.serviceId);
  const media = mediaById(work.resultMediaId);
  const mediaUrl = media?.blob ? URL.createObjectURL(media.blob) : "";
  const studentName = `${student?.lastName || ""} ${student?.firstName || ""}`.trim() || "Не найден";
  document.querySelector(".final-work-qr-backdrop")?.remove();
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop final-work-qr-backdrop";
  panel.innerHTML = `
    <section class="qr-panel" role="dialog" aria-modal="true" aria-label="Готовая работа">
      <div class="card-header">
        <div>
          <h2 class="card-title">Печатный QR распознан</h2>
          <p class="muted">Служебный QR готовой фотографии</p>
        </div>
        <button class="icon-button" data-close-final-work-qr type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      ${mediaUrl ? `<img class="montage-preview" src="${mediaUrl}" alt="" />` : '<div class="empty">Preview не найдено</div>'}
      <div class="detail-stats">
        <div class="detail-stat"><span>Школа / проект</span><strong>${escapeHtml(project?.name || "Не найден")}</strong></div>
        <div class="detail-stat"><span>Класс / группа</span><strong>${escapeHtml(klass?.name || "Не найден")}</strong></div>
        <div class="detail-stat"><span>Ученик</span><strong>${escapeHtml(studentName)}</strong></div>
        <div class="detail-stat"><span>Услуга</span><strong>${escapeHtml(serviceName(service) || "Не найдена")}</strong></div>
        <div class="detail-stat"><span>Статус</span><strong>${escapeHtml(finalWorkStatusLabel(work.status))}</strong></div>
      </div>
    </section>
  `;
  const close = () => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    panel.remove();
  };
  panel.addEventListener("click", (event) => {
    if (event.target === panel || event.target.closest("[data-close-final-work-qr]")) close();
  });
  document.body.append(panel);
  injectIcons();
}

function findFinalWorkFromPrintPayload(payload) {
  if (!payload) return null;
  const finalWorkId = typeof payload === "string" ? payload : payload.finalWorkId;
  const byId = state.data.finalWorks.find((item) => item.id === finalWorkId);
  if (byId) return byId;
  if (typeof payload === "string") return null;
  const payloadText = stableFinalWorkPrintPayload(payload);
  const byPayload = state.data.finalWorks.find((item) => stableFinalWorkPrintPayload(item.printQrPayload) === payloadText);
  if (byPayload) return byPayload;
  if (payload.resultMediaId) {
    const byMedia = state.data.finalWorks.find((item) => item.resultMediaId === payload.resultMediaId);
    if (byMedia) return byMedia;
  }
  const studentId = payload.studentId || "";
  const serviceId = payload.serviceId || "";
  if (studentId && serviceId) {
    const matches = state.data.finalWorks.filter((item) => item.studentId === studentId && item.serviceId === serviceId);
    return matches[matches.length - 1] || null;
  }
  if (studentId) {
    const matches = state.data.finalWorks.filter((item) => item.studentId === studentId);
    return matches[matches.length - 1] || null;
  }
  return null;
}

function stableFinalWorkPrintPayload(value) {
  const compactId = finalWorkIdFromCompactPrintQr(value);
  if (compactId) return finalWorkCompactQrPayload({ id: compactId });
  try {
    const payload = typeof value === "string" ? JSON.parse(value) : value;
    if (!payload || payload.type !== "final_work_print") return "";
    if (payload.finalWorkId) return finalWorkCompactQrPayload({ id: payload.finalWorkId });
    return JSON.stringify({
      type: "final_work_print",
      finalWorkId: payload.finalWorkId || "",
      studentId: payload.studentId || "",
      serviceId: payload.serviceId || "",
      resultMediaId: payload.resultMediaId || ""
    });
  } catch {
    return "";
  }
}

function finalWorkStatusLabel(status) {
  return {
    ready: "Готов",
    print_queue: "В очереди печати",
    printed: "Напечатано",
    delivered: "Выдано"
  }[status] || status || "Готов";
}

function parseStudentQrPayload(rawText) {
  const raw = String(rawText || "").trim();
  try {
    const json = JSON.parse(raw);
    if (!json.type || json.type === "student") {
      return {
        studentId: json.studentId || json.qrId || json.id || null,
        classId: json.classId || undefined,
        projectId: json.projectId || undefined
      };
    }
  } catch {}
  const parsed = parseQrPayload(raw);
  return { studentId: parsed || null };
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
  return withBusy("Экспорт ZIP...", async () => {
    if (studentId) {
      const student = studentById(studentId);
      if (student) {
        await put("students", stampExported(student));
        await refreshData();
      }
    }
    const files = studentId ? await buildExportFiles(studentId) : await buildFullExportFiles();
    const blob = createZip(files);
    downloadBlob(blob, `SPF_${studentId ? "student" : "full"}_${new Date().toISOString().slice(0, 10)}.zip`);
    await recordOperatorEvent("export", { targetType: studentId ? "student" : "full", targetId: studentId || "" });
    notify("ZIP экспортирован.");
  });
}

async function exportProject(projectId) {
  return withBusy("Экспорт проекта...", async () => {
    const project = projectById(projectId);
    if (!project) return notify("Выберите проект для экспорта.");
    await put("projects", stampExported(project));
    await refreshData();
    const blob = createZip(await buildTransferExportFiles("project", { projectId }));
    downloadBlob(blob, `${safeFileName(`SPF_project_${project.name}_${new Date().toISOString().slice(0, 10)}`)}.zip`);
    await recordOperatorEvent("export", { targetType: "project", targetId: projectId });
    notify("Проект экспортирован.");
  });
}

async function importProject(file) {
  return importTransferFile(file, "project");
}

async function exportClass(classId) {
  return withBusy("Экспорт группы...", async () => {
    const klass = classById(classId);
    if (!klass) return notify("Выберите класс/группу для экспорта.");
    await put("classes", stampExported(klass));
    await refreshData();
    const blob = createZip(await buildTransferExportFiles("class", { classId }));
    downloadBlob(blob, `${safeFileName(`SPF_class_${klass.name}_${new Date().toISOString().slice(0, 10)}`)}.zip`);
    await recordOperatorEvent("export", { targetType: "class", targetId: classId });
    notify("Класс/группа экспортирован.");
  });
}

async function importClass(file) {
  return importTransferFile(file, "class");
}

async function exportServices() {
  return withBusy("Экспорт услуг...", async () => {
    const blob = createZip(await buildTransferExportFiles("services"));
    downloadBlob(blob, `SPF_services_${new Date().toISOString().slice(0, 10)}.zip`);
    await recordOperatorEvent("export", { targetType: "services" });
    notify("Услуги экспортированы.");
  });
}

async function exportPublicCatalog() {
  return withBusy("Экспорт каталога...", async () => {
    const blob = createZip(await buildPublicCatalogExportFiles());
    downloadBlob(blob, "catalog_export.zip");
    await recordOperatorEvent("export", { targetType: "public_catalog" });
    notify("Каталог экспортирован.");
  });
}

async function importServices(file) {
  return importTransferFile(file, "services");
}

async function exportSettings() {
  return withBusy("Экспорт настроек...", async () => {
    const blob = createZip(await buildTransferExportFiles("settings"));
    downloadBlob(blob, `SPF_settings_${new Date().toISOString().slice(0, 10)}.zip`);
    await recordOperatorEvent("export", { targetType: "settings" });
    notify("Настройки экспортированы.");
  });
}

async function importSettings(file) {
  return importTransferFile(file, "settings");
}

async function exportFullBackup() {
  return withBusy("Экспорт всех данных...", async () => {
    const blob = createZip(await buildTransferExportFiles("full_backup"));
    downloadBlob(blob, `SPF_full_backup_${new Date().toISOString().slice(0, 10)}.zip`);
    await recordOperatorEvent("export", { targetType: "full_backup" });
    notify("Полный ZIP экспортирован.");
  });
}

async function exportWorkConfig() {
  return withBusy("Экспорт рабочей конфигурации...", async () => {
    const blob = createZip(await buildTransferExportFiles("work_config"));
    downloadBlob(blob, `SPF_work_config_${new Date().toISOString().slice(0, 10)}.zip`);
    await recordOperatorEvent("export", { targetType: "work_config" });
    notify("Рабочая конфигурация экспортирована.");
  });
}

async function importFullBackup(file) {
  return importTransferFile(file, "full_backup");
}

async function exportSettingsZip() {
  const blob = createZip([{
    path: "spf-settings.json",
    data: jsonBytes({
      kind: "spf_settings",
      version: 1,
      exportedAt: now(),
      exportedBy: currentOperatorIdForAction({ warn: false }),
      operators: state.data.operators,
      templates: state.data.templates,
      settings: state.data.settings,
      catalog: state.data.catalog
    })
  }]);
  downloadBlob(blob, `SPF_settings_${new Date().toISOString().slice(0, 10)}.zip`);
  notify("Настройки экспортированы.");
}

async function buildTransferExportFiles(exportType, scope = {}) {
  const data = buildTransferData(exportType, scope);
  const mediaFiles = await collectTransferMediaFiles(data);
  const exportData = stripTransferMediaDataUrls(data);
  const manifest = {
    app: TRANSFER_APP_NAME,
    schemaVersion: TRANSFER_SCHEMA_VERSION,
    exportType,
    exportedAt: now(),
    exportedBy: currentOperatorIdForAction({ warn: false }),
    containsMedia: mediaFiles.length > 0
  };
  return [
    { path: "manifest.json", data: jsonBytes(manifest) },
    { path: "data.json", data: jsonBytes(exportData) },
    ...mediaFiles
  ];
}

async function buildPublicCatalogExportFiles() {
  const files = [];
  const services = [];
  const watermark = catalogWatermarkSettings();
  for (const item of publicOrderedServices(state.data.catalog)) {
    const serviceId = item.id || uid("service");
    const fileBase = safePath(serviceId);
    const imageUrl = servicePreviewImageDataUrl(item);
    const videoUrl = servicePreviewVideoDataUrl(item);
    let previewImage = "";
    let previewVideo = "";
    const imageExportUrl = await applyCatalogWatermark(imageUrl, watermark);
    const image = dataUrlToBytes(imageExportUrl);
    if (image) {
      previewImage = `assets/images/${fileBase}.${dataUrlExtension(imageExportUrl)}`;
      files.push({ path: previewImage, data: image.bytes });
    }
    const video = dataUrlToBytes(videoUrl);
    if (video) {
      previewVideo = `assets/videos/${fileBase}.${dataUrlExtension(videoUrl)}`;
      files.push({ path: previewVideo, data: video.bytes });
    }
    services.push({
      id: serviceId,
      name: serviceName(item) || "Услуга",
      price: serviceExportPrice(item),
      shortDescription: serviceShortDescription(item),
      description: serviceDescription(item),
      gender: serviceGender(item),
      category: serviceCategory(item),
      popular: isServicePopular(item),
      previewImage,
      previewVideo
    });
  }
  const catalogData = {
    title: "Каталог услуг",
    exportedAt: now(),
    watermark: publicCatalogWatermarkData(watermark),
    services
  };
  return [
    { path: "index.html", data: new TextEncoder().encode(buildPublicCatalogHtml(catalogData)) },
    { path: "catalog.json", data: jsonBytes(catalogData) },
    { path: "assets/images/", data: new Uint8Array() },
    { path: "assets/videos/", data: new Uint8Array() },
    ...files
  ];
}

function serviceExportPrice(item) {
  const amount = parseMoney(item?.price);
  return amount || undefined;
}

function publicCatalogWatermarkData(watermark) {
  if (!watermark?.enabled) return null;
  if (!watermark.text && !watermark.logoDataUrl) return null;
  return {
    text: watermark.text,
    logoDataUrl: watermark.logoDataUrl,
    opacity: watermark.opacity
  };
}

async function applyCatalogWatermark(imageUrl, watermark) {
  if (!imageUrl || !watermark?.enabled || (!watermark.text && !watermark.logoDataUrl)) return imageUrl;
  try {
    const image = await loadImageFromUrl(imageUrl);
    const logo = watermark.logoDataUrl ? await loadImageFromUrl(watermark.logoDataUrl).catch(() => null) : null;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    if (!canvas.width || !canvas.height) return imageUrl;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    drawCatalogWatermark(context, canvas, watermark, logo);
    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return imageUrl;
  }
}

function drawCatalogWatermark(context, canvas, watermark, logo) {
  const width = canvas.width;
  const height = canvas.height;
  const opacity = normalizeWatermarkOpacity(watermark.opacity);
  const text = watermark.text || "";
  const tileX = Math.max(190, width / 3.6);
  const tileY = Math.max(140, height / 4.2);
  const fontSize = Math.max(26, Math.min(76, width / 12));
  context.save();
  context.globalAlpha = opacity;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `800 ${fontSize}px Arial, sans-serif`;
  for (let y = -tileY; y < height + tileY; y += tileY) {
    for (let x = -tileX; x < width + tileX; x += tileX) {
      context.save();
      context.translate(x + tileX / 2, y + tileY / 2);
      context.rotate(-Math.PI / 8);
      if (logo) {
        const logoWidth = Math.min(width * 0.34, tileX * 0.7, logo.naturalWidth || logo.width);
        const logoHeight = logoWidth * ((logo.naturalHeight || logo.height) / Math.max(1, logo.naturalWidth || logo.width));
        context.drawImage(logo, -logoWidth / 2, -logoHeight / 2 - (text ? fontSize * 0.55 : 0), logoWidth, logoHeight);
      }
      if (text) {
        const textY = logo ? fontSize * 0.8 : 0;
        context.lineWidth = Math.max(3, fontSize / 12);
        context.strokeStyle = "rgba(255,255,255,.88)";
        context.fillStyle = "rgba(17,24,39,.88)";
        context.strokeText(text, 0, textY);
        context.fillText(text, 0, textY);
      }
      context.restore();
    }
  }
  context.restore();
  drawCatalogWatermarkHero(context, canvas, watermark, logo, text);
}

function drawCatalogWatermarkHero(context, canvas, watermark, logo, text) {
  const width = canvas.width;
  const height = canvas.height;
  const opacity = Math.min(0.9, normalizeWatermarkOpacity(watermark.opacity) + 0.12);
  const fontSize = Math.max(34, Math.min(92, width / 9));
  context.save();
  context.translate(width / 2, height / 2);
  context.rotate(-Math.PI / 9);
  context.globalAlpha = opacity;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `900 ${fontSize}px Arial, sans-serif`;
  if (logo) {
    const logoWidth = Math.min(width * 0.42, logo.naturalWidth || logo.width);
    const logoHeight = logoWidth * ((logo.naturalHeight || logo.height) / Math.max(1, logo.naturalWidth || logo.width));
    context.drawImage(logo, -logoWidth / 2, -logoHeight / 2 - (text ? fontSize * 0.55 : 0), logoWidth, logoHeight);
  }
  if (text) {
    const textY = logo ? fontSize * 0.85 : 0;
    context.lineWidth = Math.max(5, fontSize / 10);
    context.strokeStyle = "rgba(255,255,255,.92)";
    context.fillStyle = "rgba(17,24,39,.92)";
    context.strokeText(text, 0, textY);
    context.fillText(text, 0, textY);
  }
  context.restore();
}

function loadImageFromUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = src;
  });
}

function buildPublicCatalogHtml(catalogData) {
  const inlineCatalog = JSON.stringify(catalogData).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Каталог услуг</title>
    <style>
      * { box-sizing: border-box; }
      :root {
        --bg: #f7f3ec;
        --card: #fffaf3;
        --ink: #221b16;
        --muted: #74685f;
        --line: rgba(72, 52, 36, .16);
        --accent: #d46a35;
        --accent-2: #18736f;
        --soft: #efe2d0;
        --shadow: 0 22px 60px rgba(57, 37, 21, .12);
      }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(212, 106, 53, .24), transparent 34rem),
          radial-gradient(circle at 82% 10%, rgba(24, 115, 111, .16), transparent 26rem),
          var(--bg);
        color: var(--ink);
        font-family: "Trebuchet MS", "Segoe UI", sans-serif;
      }
      button, input { font: inherit; }
      button { cursor: pointer; }
      .page {
        width: min(1040px, 100%);
        margin: 0 auto;
        padding: 24px 16px 44px;
      }
      .hero {
        display: grid;
        gap: 12px;
        margin-bottom: 18px;
        padding: 28px;
        border: 1px solid var(--line);
        border-radius: 30px;
        background: rgba(255, 250, 243, .82);
        box-shadow: var(--shadow);
        backdrop-filter: blur(14px);
      }
      .hero h1 {
        margin: 0;
        font-size: clamp(2.15rem, 10vw, 4.6rem);
        line-height: .92;
        letter-spacing: -.055em;
      }
      .hero p {
        margin: 0;
        color: var(--muted);
        font-size: 1rem;
        font-weight: 700;
      }
      .controls {
        display: grid;
        gap: 12px;
        margin-bottom: 22px;
      }
      .search {
        min-height: 54px;
        width: 100%;
        padding: 0 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(255, 250, 243, .9);
        color: var(--ink);
        box-shadow: 0 12px 28px rgba(57, 37, 21, .06);
        outline: none;
        font-weight: 800;
      }
      .filters {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 2px;
      }
      .chip {
        min-height: 42px;
        padding: 0 16px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: rgba(255, 250, 243, .78);
        color: var(--ink);
        font-weight: 900;
        white-space: nowrap;
      }
      .chip.active {
        border-color: rgba(212, 106, 53, .46);
        background: var(--accent);
        color: white;
      }
      .section {
        display: grid;
        gap: 12px;
        margin-top: 24px;
      }
      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .section-title h2 {
        margin: 0;
        font-size: 1.15rem;
      }
      .section-title span {
        display: inline-grid;
        place-items: center;
        min-width: 32px;
        min-height: 32px;
        border-radius: 999px;
        background: var(--soft);
        color: var(--muted);
        font-weight: 900;
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 14px;
      }
      .card {
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(255, 250, 243, .96);
        box-shadow: 0 16px 44px rgba(57, 37, 21, .1);
        text-align: left;
        transition: transform .18s ease, box-shadow .18s ease;
      }
      .card:hover {
        transform: translateY(-3px);
        box-shadow: 0 24px 64px rgba(57, 37, 21, .16);
      }
      .preview {
        width: 100%;
        aspect-ratio: 4 / 3;
        background: linear-gradient(135deg, #efd6b5, #f9efe3);
      }
      .preview img,
      .modal-media img,
      .modal-media video {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .empty-preview {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        color: rgba(34, 27, 22, .38);
        font-size: 4rem;
        font-weight: 900;
      }
      .body {
        display: grid;
        gap: 10px;
        padding: 16px;
      }
      .title-row {
        display: grid;
        gap: 4px;
      }
      .title-row h3 {
        margin: 0;
        font-size: 1.35rem;
        line-height: 1.05;
      }
      .price {
        color: var(--accent-2);
        font-size: 1.08rem;
        font-weight: 950;
      }
      .desc {
        margin: 0;
        color: var(--muted);
        line-height: 1.45;
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }
      .badge {
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--soft);
        color: var(--muted);
        font-size: .8rem;
        font-weight: 900;
      }
      .badge.video {
        background: rgba(24, 115, 111, .13);
        color: var(--accent-2);
      }
      .badge.popular {
        background: #ffedd5;
        color: #9a3412;
      }
      .empty {
        padding: 22px;
        border: 1px dashed var(--line);
        border-radius: 22px;
        color: var(--muted);
        text-align: center;
        font-weight: 800;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 20;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(34, 27, 22, .52);
        backdrop-filter: blur(12px);
      }
      .modal-backdrop.show { display: flex; }
      .modal {
        width: min(780px, 100%);
        max-height: calc(100vh - 36px);
        overflow: auto;
        border-radius: 28px;
        background: #fffaf3;
        box-shadow: 0 34px 90px rgba(0, 0, 0, .28);
      }
      .modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        padding: 18px 18px 0;
      }
      .modal-head h2 {
        margin: 0;
        font-size: 1.7rem;
      }
      .close {
        min-width: 44px;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: white;
        color: var(--ink);
        font-weight: 900;
      }
      .modal-media {
        position: relative;
        overflow: hidden;
        margin: 16px 18px 0;
        aspect-ratio: 16 / 10;
        border-radius: 22px;
        background: #111;
      }
      .fullscreen {
        position: absolute;
        right: 12px;
        bottom: 12px;
        min-height: 38px;
        padding: 0 12px;
        border: 0;
        border-radius: 999px;
        background: rgba(255, 255, 255, .92);
        color: var(--ink);
        font-weight: 900;
      }
      .modal-copy {
        display: grid;
        gap: 12px;
        padding: 18px;
      }
      .modal-copy p {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }
      .back {
        min-height: 48px;
        margin: 0 18px 18px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: white;
        color: var(--ink);
        font-weight: 900;
      }
      @media (max-width: 620px) {
        .page { padding-inline: 12px; }
        .hero { padding: 22px; border-radius: 26px; }
        .cards { grid-template-columns: 1fr; }
        .modal-media { aspect-ratio: 4 / 3; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <h1 id="catalog-title">Каталог услуг</h1>
        <p>Выберите образ или формат съемки, который хочется показать ребенку.</p>
      </section>
      <section class="controls">
        <input class="search" id="search" placeholder="Найти услугу" />
        <div class="filters" id="filters">
          <button class="chip active" data-filter="all" type="button">Все</button>
          <button class="chip" data-filter="boys" type="button">Мальчикам</button>
          <button class="chip" data-filter="girls" type="button">Девочкам</button>
        </div>
        <div class="filters" id="category-filters"></div>
      </section>
      <section id="catalog-feed"></section>
    </main>
    <div class="modal-backdrop" id="modal" aria-hidden="true"></div>
    <script type="application/json" id="catalog-fallback">${inlineCatalog}</script>
    <script>
      var catalog = { title: "Каталог услуг", services: [] };
      var activeFilter = "all";
      var activeCategory = "all";
      var query = "";
      var sections = [
        { gender: "boys", title: "Для мальчиков" },
        { gender: "girls", title: "Для девочек" },
        { gender: "unisex", title: "Для всех" }
      ];

      function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function(char) {
          return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char];
        });
      }

      function normalizeGender(value) {
        return ["boys", "girls", "unisex"].indexOf(value) >= 0 ? value : "unisex";
      }

      function genderLabel(value) {
        var gender = normalizeGender(value);
        if (gender === "boys") return "Мальчикам";
        if (gender === "girls") return "Девочкам";
        return "Для всех";
      }

      function serviceCategory(service) {
        return String(service && service.category ? service.category : "").trim();
      }

      function priceText(price) {
        var amount = Number(price || 0);
        return amount ? amount.toLocaleString("ru-RU") + " ₽" : "Цена не указана";
      }

      function activeSections() {
        if (activeFilter === "boys") return sections.filter(function(section) { return section.gender !== "girls"; });
        if (activeFilter === "girls") return sections.filter(function(section) { return section.gender !== "boys"; });
        return sections;
      }

      function matches(service) {
        var gender = normalizeGender(service.gender);
        if (activeFilter === "boys" && gender === "girls") return false;
        if (activeFilter === "girls" && gender === "boys") return false;
        if (activeCategory === "${SERVICE_UNCATEGORIZED}" && serviceCategory(service)) return false;
        if (activeCategory !== "all" && activeCategory !== "${SERVICE_UNCATEGORIZED}" && serviceCategory(service) !== activeCategory) return false;
        if (!query) return true;
        return [service.name, service.shortDescription, service.description, service.category, service.price].join(" ").toLowerCase().indexOf(query) >= 0;
      }

      function categoryFiltersHtml() {
        var categories = [];
        var hasUncategorized = false;
        (catalog.services || []).forEach(function(service) {
          var category = serviceCategory(service);
          if (!category) {
            hasUncategorized = true;
            return;
          }
          if (categories.indexOf(category) < 0) categories.push(category);
        });
        categories.sort(function(a, b) { return a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" }); });
        if (!categories.length && !hasUncategorized) return "";
        var html = '<button class="chip" data-category-filter="all" type="button">Все категории</button>';
        categories.forEach(function(category) {
          html += '<button class="chip" data-category-filter="' + escapeHtml(category) + '" type="button">' + escapeHtml(category) + '</button>';
        });
        if (hasUncategorized) html += '<button class="chip" data-category-filter="${SERVICE_UNCATEGORIZED}" type="button">Без категории</button>';
        return html;
      }

      function card(service) {
        var preview = service.previewImage
          ? '<img src="' + escapeHtml(service.previewImage) + '" alt="' + escapeHtml(service.name) + '" loading="lazy" />'
          : '<div class="empty-preview">' + escapeHtml((service.name || "У").slice(0, 1)) + '</div>';
        var video = service.previewVideo ? '<span class="badge video">Видео</span>' : "";
        var popular = service.popular ? '<span class="badge popular">Популярное</span>' : "";
        var category = serviceCategory(service) ? '<span class="badge">' + escapeHtml(serviceCategory(service)) + '</span>' : "";
        return '<button class="card" data-service="' + escapeHtml(service.id) + '" type="button">' +
          '<div class="preview">' + preview + '</div>' +
          '<div class="body">' +
            '<div class="title-row"><h3>' + escapeHtml(service.name || "Услуга") + '</h3><span class="price">' + escapeHtml(priceText(service.price)) + '</span></div>' +
            '<p class="desc">' + escapeHtml(service.shortDescription || "Описание скоро появится.") + '</p>' +
            '<div class="badges">' + popular + '<span class="badge">' + escapeHtml(genderLabel(service.gender)) + '</span>' + category + video + '</div>' +
          '</div>' +
        '</button>';
      }

      function sectionHtml(title, services) {
        return '<section class="section"><div class="section-title"><h2>' + escapeHtml(title) + '</h2><span>' + services.length + '</span></div><div class="cards">' + services.map(card).join("") + '</div></section>';
      }

      function render() {
        document.getElementById("catalog-title").textContent = catalog.title || "Каталог услуг";
        document.getElementById("category-filters").innerHTML = categoryFiltersHtml();
        var html = "";
        var visible = (catalog.services || []).filter(matches);
        var popular = visible.filter(function(service) { return !!service.popular; });
        var popularIds = {};
        popular.forEach(function(service) { popularIds[service.id] = true; });
        if (popular.length) html += sectionHtml("Популярные", popular);
        activeSections().forEach(function(section) {
          var services = visible.filter(function(service) {
            return normalizeGender(service.gender) === section.gender && !popularIds[service.id];
          });
          if (!services.length) return;
          html += sectionHtml(section.title, services);
        });
        document.getElementById("catalog-feed").innerHTML = html || '<div class="empty">В каталоге пока нет услуг</div>';
        Array.from(document.querySelectorAll(".chip")).forEach(function(chip) {
          if (chip.dataset.filter) chip.classList.toggle("active", chip.dataset.filter === activeFilter);
          if (chip.dataset.categoryFilter) chip.classList.toggle("active", chip.dataset.categoryFilter === activeCategory);
        });
      }

      function openService(id) {
        var service = (catalog.services || []).find(function(item) { return item.id === id; });
        if (!service) return;
        var modal = document.getElementById("modal");
        var media = service.previewVideo
          ? '<div class="modal-media"><video id="modal-video" src="' + escapeHtml(service.previewVideo) + '" controls playsinline></video><button class="fullscreen" data-fullscreen type="button">На весь экран</button></div>'
          : '<div class="modal-media">' + (service.previewImage ? '<img src="' + escapeHtml(service.previewImage) + '" alt="' + escapeHtml(service.name) + '" />' : '<div class="empty-preview">Нет превью</div>') + '</div>';
        modal.innerHTML = '<section class="modal" role="dialog" aria-modal="true">' +
          '<div class="modal-head"><div><h2>' + escapeHtml(service.name || "Услуга") + '</h2><span class="price">' + escapeHtml(priceText(service.price)) + '</span></div><button class="close" data-close type="button">x</button></div>' +
          media +
          '<div class="modal-copy"><div class="badges">' + (service.popular ? '<span class="badge popular">Популярное</span>' : '') + '<span class="badge">' + escapeHtml(genderLabel(service.gender)) + '</span>' + (serviceCategory(service) ? '<span class="badge">' + escapeHtml(serviceCategory(service)) + '</span>' : '') + (service.previewVideo ? '<span class="badge video">Видео</span>' : '') + '</div><p>' + escapeHtml(service.description || service.shortDescription || "Описание скоро появится.") + '</p></div>' +
          '<button class="back" data-close type="button">Назад</button>' +
        '</section>';
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
      }

      function closeModal() {
        var modal = document.getElementById("modal");
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = "";
      }

      document.addEventListener("click", function(event) {
        var filter = event.target.closest("[data-filter]");
        if (filter) {
          activeFilter = filter.dataset.filter || "all";
          render();
          return;
        }
        var categoryFilter = event.target.closest("[data-category-filter]");
        if (categoryFilter) {
          activeCategory = categoryFilter.dataset.categoryFilter || "all";
          render();
          return;
        }
        var cardButton = event.target.closest("[data-service]");
        if (cardButton) {
          openService(cardButton.dataset.service);
          return;
        }
        if (event.target.matches("[data-close]") || event.target.id === "modal") closeModal();
        if (event.target.matches("[data-fullscreen]")) {
          var video = document.getElementById("modal-video");
          if (video && video.requestFullscreen) video.requestFullscreen();
          else if (video && video.webkitEnterFullscreen) video.webkitEnterFullscreen();
        }
      });

      document.getElementById("search").addEventListener("input", function(event) {
        query = event.target.value.trim().toLowerCase();
        render();
      });

      async function loadCatalog() {
        try {
          var response = await fetch("./catalog.json");
          if (response.ok) {
            catalog = await response.json();
            render();
            return;
          }
        } catch (error) {}
        catalog = JSON.parse(document.getElementById("catalog-fallback").textContent);
        render();
      }

      loadCatalog();
    </script>
  </body>
</html>`;
}

function buildTransferData(exportType, scope = {}) {
  const base = emptyTransferData();
  if (exportType === "project") {
    const project = projectById(scope.projectId);
    if (!project) return base;
    const classes = classesByProject(project.id);
    const classIds = new Set(classes.map((klass) => klass.id));
    const students = state.data.students.filter((student) => classIds.has(student.classId));
    const serviceIds = serviceIdsForStudents(students);
    return fillTransferData(base, {
      operators: state.data.operators,
      projects: [project],
      classes,
      students,
      services: state.data.catalog.filter((item) => serviceIds.has(item.id)),
      orders: state.data.orders.filter((order) => students.some((student) => student.id === order.studentId)),
      media: state.data.media.filter((media) => students.some((student) => student.id === media.studentId)),
      finalWorks: state.data.finalWorks.filter((work) => students.some((student) => student.id === work.studentId)),
      documents: documentsForProjectTransfer(project.id, classIds),
      settings: state.data.settings,
      checklistTemplates: state.data.templates
    });
  }
  if (exportType === "class") {
    const klass = classById(scope.classId);
    const project = projectById(klass?.projectId);
    if (!klass || !project) return base;
    const students = state.data.students.filter((student) => student.classId === klass.id);
    const serviceIds = serviceIdsForStudents(students);
    return fillTransferData(base, {
      operators: state.data.operators,
      projects: [project],
      classes: [klass],
      students,
      services: state.data.catalog.filter((item) => serviceIds.has(item.id)),
      orders: state.data.orders.filter((order) => students.some((student) => student.id === order.studentId)),
      media: state.data.media.filter((media) => students.some((student) => student.id === media.studentId)),
      finalWorks: state.data.finalWorks.filter((work) => students.some((student) => student.id === work.studentId)),
      documents: (state.data.documents || []).filter((doc) => doc.groupId === klass.id),
      settings: state.data.settings,
      checklistTemplates: state.data.templates
    });
  }
  if (exportType === "services") {
    return fillTransferData(base, { services: manualOrderedServices(state.data.catalog) });
  }
  if (exportType === "operators") {
    return fillTransferData(base, { operators: state.data.operators });
  }
  if (exportType === "settings") {
    return fillTransferData(base, { operators: state.data.operators, settings: state.data.settings, checklistTemplates: state.data.templates });
  }
  if (exportType === "work_config") {
    return fillTransferData(base, {
      operators: state.data.operators,
      services: manualOrderedServices(state.data.catalog),
      settings: state.data.settings,
      checklistTemplates: state.data.templates
    });
  }
  return fillTransferData(base, {
    operators: state.data.operators,
    operatorEvents: state.data.operatorEvents,
    projects: state.data.projects,
    classes: state.data.classes,
    students: state.data.students,
    services: state.data.catalog,
    orders: state.data.orders,
    media: state.data.media,
    finalWorks: state.data.finalWorks,
    documents: state.data.documents,
    settings: state.data.settings,
    checklistTemplates: state.data.templates
  });
}

function documentsForProjectTransfer(projectId, classIds = new Set()) {
  return (state.data.documents || []).filter((doc) => {
    if (doc.projectId !== projectId) return false;
    return !doc.groupId || classIds.has(doc.groupId);
  });
}

function emptyTransferData() {
  return {
    operators: [],
    operatorEvents: [],
    projects: [],
    classes: [],
    students: [],
    services: [],
    orders: [],
    media: [],
    finalWorks: [],
    documents: [],
    tasks: [],
    settings: [],
    statuses: [],
    checklistTemplates: []
  };
}

function fillTransferData(target, patch) {
  Object.entries(patch).forEach(([key, value]) => {
    target[key] = Array.isArray(value) ? value.map((record) => withTransferAliases(key, record)) : [];
  });
  target.tasks = transferTasksFromOrders(target.orders);
  target.statuses = target.settings.filter((item) => item?.id === STATUS_EXPORT_DEFAULT.id).map(clonePlainRecord);
  return target;
}

function withTransferAliases(dataKey, record) {
  const next = dataKey === "media" || dataKey === "documents" ? { ...record } : clonePlainRecord(record);
  if (dataKey === "operators") next.operatorId = next.operatorId || next.id;
  if (dataKey === "operatorEvents") next.eventId = next.eventId || next.id;
  if (dataKey === "projects") next.projectId = next.projectId || next.id;
  if (dataKey === "classes") next.classId = next.classId || next.id;
  if (dataKey === "students") next.studentId = next.studentId || next.id;
  if (dataKey === "services") next.serviceId = next.serviceId || next.id;
  if (dataKey === "orders") next.orderId = next.orderId || next.id;
  if (dataKey === "media") next.mediaId = next.mediaId || next.id;
  if (dataKey === "finalWorks") next.finalWorkId = next.finalWorkId || next.id;
  if (dataKey === "documents") next.documentId = next.documentId || next.id;
  return next;
}

function clonePlainRecord(record) {
  return JSON.parse(JSON.stringify(record ?? {}));
}

function serviceIdsForStudents(students) {
  const ids = new Set();
  students.forEach((student) => selectedCatalogIdsForStudent(student).forEach((id) => ids.add(id)));
  return ids;
}

function transferTasksFromOrders(orders) {
  return (orders || []).flatMap((order) => (order.items || []).map((item) => ({
    id: item.id || item.taskId || `${order.id || order.studentId}_${item.type}`,
    taskId: item.taskId || item.id || `${order.id || order.studentId}_${item.type}`,
    orderId: order.id,
    studentId: order.studentId,
    ...clonePlainRecord(item)
  })));
}

async function collectTransferMediaFiles(data) {
  const files = [];
  const taken = new Set();
  (data.services || []).forEach((service) => {
    addDataUrlMediaFile(files, taken, `media/services/${service.id}/preview`, servicePreviewImageDataUrl(service));
    addDataUrlMediaFile(files, taken, `media/services/${service.id}/preview_video`, servicePreviewVideoDataUrl(service));
    (service.angles || []).forEach((angle) => addDataUrlMediaFile(files, taken, `media/services/${service.id}/${angle.id || uid("angle")}`, angle.refDataUrl));
    (service.angles || []).forEach((angle) => addDataUrlMediaFile(files, taken, `media/services/${service.id}/${angle.id || uid("angle")}_video`, angle.videoRefDataUrl));
  });
  for (const item of data.media || []) {
    if (!item.blob) continue;
    const path = `media/student_files/${item.id}/${safePath(item.fileName || `${item.id}.bin`)}`;
    if (taken.has(path)) continue;
    taken.add(path);
    files.push({ path, data: new Uint8Array(await item.blob.arrayBuffer()) });
  }
  for (const item of data.documents || []) {
    const blob = item.blob || await documentBlob(item);
    if (!blob) continue;
    const path = `documents/${item.id}/${safePath(item.fileName || `${item.id}.bin`)}`;
    if (taken.has(path)) continue;
    taken.add(path);
    files.push({ path, data: new Uint8Array(await blob.arrayBuffer()) });
  }
  return files;
}

function addDataUrlMediaFile(files, taken, basePath, dataUrl) {
  const parsed = dataUrlToBytes(dataUrl);
  if (!parsed) return;
  const ext = dataUrlExtension(dataUrl);
  let path = `${basePath}.${ext}`;
  let index = 2;
  while (taken.has(path)) {
    path = `${basePath}_${index}.${ext}`;
    index += 1;
  }
  taken.add(path);
  files.push({ path, data: parsed.bytes });
}

function stripTransferMediaDataUrls(data) {
  const next = clonePlainRecord(data);
  (next.services || []).forEach((service) => {
    if (dataUrlToBytes(service.previewDataUrl)) service.previewDataUrl = "";
    if (dataUrlToBytes(service.previewImageDataUrl)) service.previewImageDataUrl = "";
    if (dataUrlToBytes(service.previewVideoDataUrl)) service.previewVideoDataUrl = "";
    if (dataUrlToBytes(service.previewVideoUrl)) service.previewVideoUrl = "";
    (service.angles || []).forEach((angle) => {
      if (dataUrlToBytes(angle.refDataUrl)) angle.refDataUrl = "";
      if (dataUrlToBytes(angle.videoRefDataUrl)) angle.videoRefDataUrl = "";
    });
  });
  (next.media || []).forEach((item) => {
    delete item.blob;
  });
  (next.documents || []).forEach((item) => {
    delete item.blob;
  });
  return next;
}

function hydrateTransferMediaData(data, entries) {
  (data.services || []).forEach((service) => {
    const imageEntry = findTransferMediaEntry(entries, `media/services/${service.id}/preview`);
    const videoEntry = findTransferMediaEntry(entries, `media/services/${service.id}/preview_video`);
    if (imageEntry) service.previewDataUrl = zipEntryToDataUrl(imageEntry);
    if (videoEntry) service.previewVideoDataUrl = zipEntryToDataUrl(videoEntry);
    (service.angles || []).forEach((angle) => {
      const angleId = angle.id || "";
      if (!angleId) return;
      const refEntry = findTransferMediaEntry(entries, `media/services/${service.id}/${angleId}`);
      const videoRefEntry = findTransferMediaEntry(entries, `media/services/${service.id}/${angleId}_video`);
      if (refEntry) angle.refDataUrl = zipEntryToDataUrl(refEntry);
      if (videoRefEntry) angle.videoRefDataUrl = zipEntryToDataUrl(videoRefEntry);
    });
  });
  (data.media || []).forEach((item) => {
    const entry = entries.find((entry) => {
      const normalized = String(entry.path || "").replace(/\\/g, "/");
      return normalized.endsWith(`media/student_files/${item.id}/${item.fileName}`) || normalized.endsWith(`/${item.fileName}`);
    });
    item.blob = new Blob(entry ? [entry.data] : [], { type: item.type === "video" ? "video/mp4" : "image/jpeg" });
  });
  (data.documents || []).forEach((item) => {
    const entry = entries.find((entry) => {
      const normalized = String(entry.path || "").replace(/\\/g, "/");
      return normalized.endsWith(`documents/${item.id}/${item.fileName}`) || normalized.endsWith(`/${item.fileName}`);
    });
    item.blob = new Blob(entry ? [entry.data] : [], { type: item.mimeType || documentMimeType(item.fileName) });
    item.storageMode = "indexeddb";
  });
  return data;
}

function findTransferMediaEntry(entries, basePath) {
  const normalizedBase = String(basePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  return entries.find((entry) => {
    const path = String(entry.path || "").replace(/\\/g, "/").replace(/^\/+/, "");
    const withoutExtension = path.replace(/\.[^/.]+$/, "");
    return withoutExtension === normalizedBase || withoutExtension.endsWith(`/${normalizedBase}`);
  });
}

function zipEntryToDataUrl(entry) {
  return bytesToDataUrl(mimeForPath(entry.path, isVideoZipEntry(entry) ? "video" : "photo"), entry.data);
}

function bytesToDataUrl(mime, bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return `data:${mime || "application/octet-stream"};base64,${btoa(binary)}`;
}

async function importTransferFile(file, importMode = "auto") {
  if (!file) return;
  const entries = await parseZip(new Uint8Array(await file.arrayBuffer()));
  const draft = await createTransferImportDraft(entries, importMode);
  showTransferImportPreview(draft);
}

async function createTransferImportDraft(entries, importMode = "auto") {
  const manifestEntry = entries.find((entry) => entry.path.endsWith("manifest.json"));
  const dataEntry = entries.find((entry) => entry.path.endsWith("data.json"));
  if (!manifestEntry || !dataEntry) throw new Error("manifest.json or data.json not found");
  const manifest = JSON.parse(new TextDecoder().decode(manifestEntry.data));
  if (![TRANSFER_APP_NAME, ...TRANSFER_LEGACY_APP_NAMES].includes(manifest.app)) throw new Error("Unsupported transfer archive");
  const rawData = JSON.parse(new TextDecoder().decode(dataEntry.data));
  const exportType = manifest.exportType || "full_backup";
  const mode = TRANSFER_IMPORT_SCOPES[importMode] ? importMode : exportType;
  const allowed = new Set(TRANSFER_IMPORT_SCOPES[mode] || TRANSFER_IMPORT_SCOPES.full_backup);
  const data = hydrateTransferMediaData(normalizeTransferData(rawData, allowed), entries);
  const stats = transferImportStats(data);
  return { id: uid("transfer_import"), manifest, mode, data, stats, resolution: "update" };
}

function normalizeTransferData(rawData, allowed) {
  const data = emptyTransferData();
  Object.keys(TRANSFER_STORE_MAP).forEach((key) => {
    data[key] = allowed.has(key) ? normalizeTransferRecords(key, rawData[key]) : [];
  });
  data.tasks = Array.isArray(rawData.tasks) ? rawData.tasks.map(clonePlainRecord) : [];
  data.statuses = Array.isArray(rawData.statuses) ? rawData.statuses.map(clonePlainRecord) : [];
  if (allowed.has("settings") && data.statuses.length) {
    const byId = new Map(data.settings.map((record) => [record.id, record]));
    data.statuses.filter((record) => record?.id).forEach((record) => byId.set(record.id, record));
    data.settings = Array.from(byId.values());
  }
  return data;
}

function normalizeTransferRecords(dataKey, records) {
  return Array.from(new Map((records || [])
    .map((record) => normalizeTransferRecordId(dataKey, record))
    .filter((record) => record && record.id)
    .map((record) => [record.id, record]))
    .values());
}

function normalizeTransferRecordId(dataKey, record) {
  const next = clonePlainRecord(record);
  const alias = {
    projects: "projectId",
    classes: "classId",
    students: "studentId",
    operators: "operatorId",
    operatorEvents: "eventId",
    services: "serviceId",
    orders: "orderId",
    media: "mediaId",
    finalWorks: "finalWorkId",
    documents: "documentId",
    settings: "settingId",
    checklistTemplates: "templateId"
  }[dataKey];
  next.id = next.id || next[alias] || "";
  return next;
}

function transferImportStats(data) {
  const stats = { added: {}, updated: {}, conflicts: [] };
  Object.entries(TRANSFER_STORE_MAP).forEach(([dataKey, store]) => {
    const existingIds = new Set((state.data[store] || []).map((item) => item.id));
    const existingById = new Map((state.data[store] || []).map((item) => [item.id, item]));
    const records = data[dataKey] || [];
    stats.added[dataKey] = records.filter((record) => !existingIds.has(record.id)).length;
    stats.updated[dataKey] = records.filter((record) => existingIds.has(record.id)).length;
    records.forEach((record) => {
      const existing = existingById.get(record.id);
      if (existing && !sameTransferRecord(existing, appRecordFromTransfer(dataKey, record))) {
        stats.conflicts.push({ dataKey, store, id: record.id, label: transferRecordLabel(dataKey, record), resolution: "update" });
      }
    });
  });
  return stats;
}

function sameTransferRecord(existing, incoming) {
  return stableJson(stripRuntimeFields(existing)) === stableJson(stripRuntimeFields(incoming));
}

function stripRuntimeFields(record) {
  const next = { ...(record || {}) };
  delete next.blob;
  return next;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function transferRecordLabel(dataKey, record) {
  if (dataKey === "operators") return record.name || record.id;
  if (dataKey === "operatorEvents") return record.type || record.id;
  if (dataKey === "projects") return record.name || record.id;
  if (dataKey === "classes") return record.name || record.id;
  if (dataKey === "students") return `${record.lastName || ""} ${record.firstName || ""}`.trim() || record.qrId || record.id;
  if (dataKey === "services") return record.name || record.title || record.id;
  if (dataKey === "orders") return record.studentId || record.id;
  if (dataKey === "media") return record.fileName || record.id;
  if (dataKey === "documents") return record.fileName || record.name || record.id;
  if (dataKey === "checklistTemplates") return record.name || record.id;
  return record.title || record.name || record.id;
}

function showTransferImportPreview(draft) {
  document.querySelector(".transfer-import-backdrop")?.remove();
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop transfer-import-backdrop";
  panel.innerHTML = `
    <section class="qr-panel import-draft-panel" role="dialog" aria-modal="true" aria-label="Предпросмотр импорта">
      <div class="card-header">
        <div>
          <h2 class="card-title">Предпросмотр импорта</h2>
          <p class="muted">${escapeHtml(draft.manifest.exportType || draft.mode)} · ${escapeHtml(draft.manifest.exportedAt || "")}</p>
        </div>
        <button class="icon-button" data-cancel-transfer-import type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      <div class="stats finance-stats">
        ${transferPreviewStat("Проектов", draft.stats.added.projects, draft.stats.updated.projects)}
        ${transferPreviewStat("Классов", draft.stats.added.classes, draft.stats.updated.classes)}
        ${transferPreviewStat("Учеников", draft.stats.added.students, draft.stats.updated.students)}
        ${transferPreviewStat("Услуг", draft.stats.added.services, draft.stats.updated.services)}
        ${transferPreviewStat("Сотрудников", draft.stats.added.operators, draft.stats.updated.operators)}
        ${transferPreviewStat("Медиа", draft.stats.added.media, draft.stats.updated.media)}
        ${transferPreviewStat("Готовых работ", draft.stats.added.finalWorks, draft.stats.updated.finalWorks)}
        ${transferPreviewStat("Документов", draft.stats.added.documents, draft.stats.updated.documents)}
      </div>
      <div class="import-draft-list">
        <div class="import-draft-row ${draft.stats.conflicts.length ? "warning" : ""}"><strong>Конфликты</strong><span>${draft.stats.conflicts.length ? "есть" : "нет"}</span></div>
        ${draft.stats.conflicts.length ? transferConflictControls(draft) : ""}
      </div>
      <div class="toolbar">
        <button class="secondary-button" data-cancel-transfer-import type="button">Отмена</button>
        <button class="primary-button" data-confirm-transfer-import type="button">Импортировать</button>
      </div>
    </section>
  `;
  panel.querySelectorAll("[data-cancel-transfer-import]").forEach((node) => node.addEventListener("click", closeTransferImportPreview));
  panel.querySelector("[data-transfer-apply-all]")?.addEventListener("click", () => {
    const resolution = panel.querySelector("[data-transfer-resolution-all]")?.value || "update";
    panel.querySelectorAll("[data-transfer-conflict-resolution]").forEach((select) => { select.value = resolution; });
  });
  panel.querySelector("[data-confirm-transfer-import]")?.addEventListener("click", () => confirmTransferImport(draft, panel));
  document.body.append(panel);
  injectIcons();
}

function transferPreviewStat(label, added = 0, updated = 0) {
  return `<div class="stat"><strong>+${added} / ${updated}</strong><span class="muted">${escapeHtml(label)}</span></div>`;
}

function transferConflictControls(draft) {
  return `
    <div class="import-draft-assign">
      <select class="select" data-transfer-resolution-all aria-label="Решение для всех конфликтов">${transferResolutionOptions("update")}</select>
      <button class="secondary-button compact" data-transfer-apply-all type="button">Применить ко всем</button>
    </div>
    ${draft.stats.conflicts.slice(0, 30).map((conflict, index) => `
      <div class="import-draft-row">
        <strong>${escapeHtml(TRANSFER_COUNT_LABELS[conflict.dataKey] || conflict.dataKey)}: ${escapeHtml(conflict.label)}</strong>
        <select class="select" data-transfer-conflict-resolution="${index}" aria-label="Решение конфликта">${transferResolutionOptions(conflict.resolution)}</select>
      </div>
    `).join("")}
    ${draft.stats.conflicts.length > 30 ? `<p class="muted">Показаны первые 30 конфликтов из ${draft.stats.conflicts.length}.</p>` : ""}
  `;
}

function transferResolutionOptions(selected) {
  return [
    ["update", "Обновить существующее"],
    ["keep", "Оставить старое"],
    ["copy", "Создать копию"]
  ].map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}

function closeTransferImportPreview() {
  document.querySelector(".transfer-import-backdrop")?.remove();
}

async function confirmTransferImport(draft, panel) {
  return withBusy("Импорт данных...", async () => {
    draft.stats.conflicts.forEach((conflict, index) => {
      conflict.resolution = panel.querySelector(`[data-transfer-conflict-resolution="${index}"]`)?.value || "update";
    });
    const result = await applyTransferImport(draft);
    await recordOperatorEvent("import", { targetType: draft.mode || draft.manifest.exportType || "transfer", targetId: draft.id });
    await refreshData();
    normalizeCurrentOperator();
    closeTransferImportPreview();
    notify(`Импорт завершен: добавлено ${result.added}, обновлено ${result.updated}, пропущено ${result.skipped}.`);
    if (shouldShowOperatorGate()) {
      renderOperatorGate();
      return;
    }
    navigate("home");
  });
}

async function applyTransferImport(draft) {
  const result = { added: 0, updated: 0, skipped: 0 };
  const conflictByRecord = new Map(draft.stats.conflicts.map((item) => [`${item.dataKey}:${item.id}`, item]));
  const idMaps = {};
  for (const dataKey of TRANSFER_STORE_ORDER) {
    const store = TRANSFER_STORE_MAP[dataKey];
    idMaps[dataKey] = new Map();
    for (const originalRecord of draft.data[dataKey] || []) {
      const conflict = conflictByRecord.get(`${dataKey}:${originalRecord.id}`);
      if (conflict?.resolution === "keep") {
        result.skipped += 1;
        continue;
      }
      if (dataKey === "operators" && conflict?.resolution === "copy") conflict.resolution = "update";
      const exists = Boolean((state.data[store] || []).some((item) => item.id === originalRecord.id));
      const record = remapTransferRecord(dataKey, originalRecord, idMaps);
      if (dataKey === "operators" && !exists) {
        const nameDecision = await resolveOperatorNameImport(record);
        if (nameDecision === "skip") {
          result.skipped += 1;
          continue;
        }
        if (nameDecision === "merge") {
          result.updated += 1;
          continue;
        }
      }
      if (conflict?.resolution === "copy") {
        const copyId = uid(transferIdPrefix(dataKey));
        idMaps[dataKey].set(originalRecord.id, copyId);
        record.id = copyId;
        if (dataKey === "students") record.qrId = copyId;
        if (dataKey === "orders") record.id = `order_${record.studentId || copyId}`;
      }
      await put(store, record);
      if (exists && conflict?.resolution !== "copy") result.updated += 1;
      else result.added += 1;
    }
  }
  return result;
}

async function resolveOperatorNameImport(incoming) {
  const incomingName = String(incoming.name || "").trim().toLowerCase();
  if (!incomingName) return "add";
  const existing = state.data.operators.find((operator) => operator.id !== incoming.id && String(operator.name || "").trim().toLowerCase() === incomingName);
  if (!existing) return "add";
  const answer = prompt(
    `Найден сотрудник с таким именем, но другим ID:\n${incoming.name}\n\n1. Объединить\n2. Добавить как нового\n3. Пропустить`,
    "1"
  );
  if (answer === "1") {
    await mergeImportedOperator(existing, incoming);
    return "merge";
  }
  if (answer === "2") return "add";
  return "skip";
}

async function mergeImportedOperator(existing, incoming) {
  const aliases = Array.from(new Set([
    ...(existing.aliases || []),
    ...(incoming.aliases || []),
    existing.id
  ].filter((id) => id && id !== incoming.id)));
  await reassignOperatorReferences(existing.id, incoming.id);
  await put("operators", {
    ...existing,
    ...incoming,
    id: incoming.id,
    aliases,
    createdAt: existing.createdAt || incoming.createdAt || now(),
    updatedAt: now()
  });
  if (existing.id !== incoming.id) await del("operators", existing.id);
  if (state.currentOperatorId === existing.id) setCurrentOperator(incoming.id);
}

async function reassignOperatorReferences(oldId, newId) {
  for (const store of STORE_NAMES) {
    if (store === "operators") continue;
    const records = state.data[store] || [];
    for (const record of records) {
      const next = replaceOperatorReference(record, oldId, newId);
      if (next !== record) await put(store, next);
    }
  }
}

function replaceOperatorReference(record, oldId, newId) {
  const fields = ["createdBy", "updatedBy", "addedBy", "importedBy", "capturedBy", "exportedBy", "completedBy", "operatorId"];
  let changed = false;
  const next = { ...record };
  fields.forEach((field) => {
    if (next[field] === oldId) {
      next[field] = newId;
      changed = true;
    }
  });
  if (Array.isArray(next.items)) {
    const items = next.items.map((item) => {
      const patched = { ...item };
      let itemChanged = false;
      fields.forEach((field) => {
        if (patched[field] === oldId) {
          patched[field] = newId;
          itemChanged = true;
        }
      });
      if (itemChanged) changed = true;
      return itemChanged ? patched : item;
    });
    if (changed) next.items = items;
  }
  return changed ? next : record;
}

function remapTransferRecord(dataKey, record, idMaps) {
  const next = appRecordFromTransfer(dataKey, record);
  if (dataKey === "classes" && idMaps.projects?.has(next.projectId)) next.projectId = idMaps.projects.get(next.projectId);
  if (dataKey === "students") {
    if (idMaps.classes?.has(next.classId)) next.classId = idMaps.classes.get(next.classId);
    if (idMaps.services?.size) {
      next.catalogId = idMaps.services.get(next.catalogId) || next.catalogId;
      next.catalogIds = (next.catalogIds || []).map((id) => idMaps.services.get(id) || id);
    }
  }
  if (dataKey === "orders") {
    if (idMaps.students?.has(next.studentId)) next.studentId = idMaps.students.get(next.studentId);
    if (idMaps.services?.size) {
      next.catalogId = idMaps.services.get(next.catalogId) || next.catalogId;
      next.catalogIds = (next.catalogIds || []).map((id) => idMaps.services.get(id) || id);
      next.items = (next.items || []).map((item) => remapOrderItemServices(item, idMaps.services));
    }
  }
  if (dataKey === "media" && idMaps.students?.has(next.studentId)) next.studentId = idMaps.students.get(next.studentId);
  if (dataKey === "documents") {
    if (idMaps.projects?.has(next.projectId)) next.projectId = idMaps.projects.get(next.projectId);
    if (idMaps.classes?.has(next.groupId)) next.groupId = idMaps.classes.get(next.groupId);
    if (next.ownerType === "project" && idMaps.projects?.has(next.ownerId)) next.ownerId = idMaps.projects.get(next.ownerId);
    if (["group", "class"].includes(next.ownerType) && idMaps.classes?.has(next.ownerId)) next.ownerId = idMaps.classes.get(next.ownerId);
  }
  if (dataKey === "finalWorks") {
    if (idMaps.projects?.has(next.projectId)) next.projectId = idMaps.projects.get(next.projectId);
    if (idMaps.classes?.has(next.groupId)) next.groupId = idMaps.classes.get(next.groupId);
    if (idMaps.students?.has(next.studentId)) next.studentId = idMaps.students.get(next.studentId);
    if (idMaps.services?.has(next.serviceId)) next.serviceId = idMaps.services.get(next.serviceId);
    if (idMaps.media?.has(next.sourceMediaId)) next.sourceMediaId = idMaps.media.get(next.sourceMediaId);
    if (idMaps.media?.has(next.referenceMediaId)) next.referenceMediaId = idMaps.media.get(next.referenceMediaId);
    if (idMaps.media?.has(next.resultMediaId)) next.resultMediaId = idMaps.media.get(next.resultMediaId);
    next.printQrPayload = finalWorkCompactQrPayload(next);
  }
  return next;
}

function appRecordFromTransfer(dataKey, record) {
  const next = dataKey === "media" || dataKey === "documents" ? { ...record } : clonePlainRecord(record);
  if (dataKey === "projects") delete next.projectId;
  if (dataKey === "operators") delete next.operatorId;
  if (dataKey === "operatorEvents") delete next.eventId;
  if (dataKey === "classes") delete next.classId;
  if (dataKey === "students") delete next.studentId;
  if (dataKey === "services") delete next.serviceId;
  if (dataKey === "orders") delete next.orderId;
  if (dataKey === "media") delete next.mediaId;
  if (dataKey === "finalWorks") delete next.finalWorkId;
  if (dataKey === "documents") delete next.documentId;
  if (dataKey === "settings") delete next.settingId;
  if (dataKey === "checklistTemplates") delete next.templateId;
  return next;
}

function remapOrderItemServices(item, serviceMap) {
  const next = clonePlainRecord(item);
  const parsed = parseServiceTaskType(next.type || "");
  if (parsed && serviceMap.has(parsed.catalogId)) next.type = serviceTaskType(serviceMap.get(parsed.catalogId), parsed.angleId);
  return next;
}

function transferIdPrefix(dataKey) {
  return {
    projects: "project",
    operators: "operator",
    operatorEvents: "operator_event",
    classes: "class",
    students: "student",
    services: "catalog",
    orders: "order",
    media: "media",
    finalWorks: "final",
    documents: "document",
    settings: "setting",
    checklistTemplates: "template"
  }[dataKey] || "copy";
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
  recordOperatorEvent("export", { targetType: "status_pdf", targetId: classId || projectId || "" });
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
        <td>${escapeHtml(albumClassStatusLabel(calculateAlbumClassStatus(klass)))}</td>
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
      <td>${escapeHtml(albumStudentStatusLabel(calculateAlbumStudentStatus(student)))}</td>
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
  recordOperatorEvent("export", { targetType: "album_status_pdf", targetId: classId || albumProjectId || "" });
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
    operators: state.data.operators,
    operatorEvents: state.data.operatorEvents,
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
      return item ? { id: item.id, title: serviceName(item), previewFile: servicePreviewImageDataUrl(item) ? uniqueServicePreviewFile(item, previewNames) : "" } : null;
    }).filter(Boolean);
    files.push({ path: `${base}/meta.json`, data: jsonBytes({ student, order, services: selectedServices }) });
    for (const service of selectedServices) {
      if (!service.previewFile) continue;
      const item = catalogItemById(service.id);
      const parsed = servicePreviewImageDataUrl(item) ? dataUrlToBytes(servicePreviewImageDataUrl(item)) : null;
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
  const ext = dataUrlExtension(servicePreviewImageDataUrl(item));
  const base = safePath(serviceName(item) || "service");
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
      if (store === "media" || store === "albumMedia" || store === "documents") {
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
  for (const item of state.data.documents || []) {
    const blob = item.blob || await documentBlob(item);
    if (!blob) continue;
    files.push({ path: `documents/${item.id}/${item.fileName}`, data: new Uint8Array(await blob.arrayBuffer()) });
  }
  for (const item of state.data.catalog) {
    if (!servicePreviewImageDataUrl(item)) continue;
    const parsed = dataUrlToBytes(servicePreviewImageDataUrl(item));
    if (!parsed) continue;
    const ext = dataUrlExtension(servicePreviewImageDataUrl(item));
    files.push({ path: `catalog_previews/${item.id}.${ext}`, data: parsed.bytes });
  }
  for (const item of state.data.catalog) {
    if (!servicePreviewVideoDataUrl(item)) continue;
    const parsed = dataUrlToBytes(servicePreviewVideoDataUrl(item));
    if (!parsed) continue;
    const ext = dataUrlExtension(servicePreviewVideoDataUrl(item));
    files.push({ path: `catalog_preview_videos/${item.id}.${ext}`, data: parsed.bytes });
  }
  return files;
}

async function handleZipInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  showBusy("Импорт ZIP...");
  try {
    const entries = await parseZip(new Uint8Array(await file.arrayBuffer()));
    const transferManifestEntry = entries.find((entry) => entry.path.endsWith("manifest.json"));
    const transferDataEntry = entries.find((entry) => entry.path.endsWith("data.json"));
    if (transferManifestEntry && transferDataEntry) {
      const draft = await createTransferImportDraft(entries, state.zipImportMode);
      showTransferImportPreview(draft);
      return;
    }
    const settingsEntry = entries.find((entry) => entry.path.endsWith("spf-settings.json"));
    const fullEntry = entries.find((entry) => entry.path.endsWith("spf-full-data.json"));
    if (settingsEntry || state.zipImportMode === "settings") {
      if (!settingsEntry) throw new Error("spf-settings.json not found");
      await importSettingsMeta(JSON.parse(new TextDecoder().decode(settingsEntry.data)));
      await recordOperatorEvent("import", { targetType: "settings" });
      await refreshData();
      normalizeCurrentOperator();
      notify("Настройки импортированы.");
      if (shouldShowOperatorGate()) {
        renderOperatorGate();
        return;
      }
      renderSettings();
      return;
    }
    if (fullEntry) {
      await importFullMeta(JSON.parse(new TextDecoder().decode(fullEntry.data)), entries);
      await recordOperatorEvent("import", { targetType: "full_backup" });
      await refreshData();
      normalizeCurrentOperator();
      notify("Все данные импортированы.");
      if (shouldShowOperatorGate()) {
        renderOperatorGate();
        return;
      }
      navigate("home");
      return;
    }
    const dataEntry = entries.find((entry) => entry.path.endsWith("spf-data.json"));
    if (!dataEntry) {
      await importShootEntries(entries);
      return;
    }
    const meta = JSON.parse(new TextDecoder().decode(dataEntry.data));
    for (const store of ["operators", "operatorEvents", "projects", "classes", "students", "orders", "templates", "settings", "catalog"]) {
      for (const record of meta[store] || []) await put(store, record);
    }
    const mediaRecords = meta.media || [];
    for (const record of mediaRecords) {
      const entry = entries.find((item) => item.path.endsWith(`/${record.fileName}`));
      const blob = entry ? new Blob([entry.data], { type: record.type === "video" ? "video/mp4" : "image/jpeg" }) : new Blob([]);
      await put("media", { ...record, blob });
    }
    await recordOperatorEvent("import", { targetType: "legacy_zip" });
    await refreshData();
    normalizeCurrentOperator();
    notify("ZIP импортирован.");
    if (shouldShowOperatorGate()) {
      renderOperatorGate();
      return;
    }
    navigate("home");
  } catch (error) {
    notify(zipImportErrorMessage(error));
  } finally {
    state.zipImportMode = "auto";
    event.target.value = "";
    hideBusy();
  }
}

async function handleTransferFolderInput(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  showBusy("Импорт папки...");
  try {
    const entries = await filesToZipLikeEntries(files);
    const draft = await createTransferImportDraft(entries, state.zipImportMode);
    showTransferImportPreview(draft);
  } catch (error) {
    notify("Не удалось импортировать папку услуг. Выберите папку, где лежат manifest.json и data.json.");
  } finally {
    state.zipImportMode = "auto";
    event.target.value = "";
    hideBusy();
  }
}

async function filesToZipLikeEntries(files) {
  const entries = [];
  for (const [index, file] of files.entries()) {
    const path = file.webkitRelativePath || file.name || `file_${index}`;
    if (isIgnoredImportPath(path)) continue;
    entries.push({ path, data: new Uint8Array(await file.arrayBuffer()), index });
  }
  return entries;
}

async function importSettingsMeta(meta) {
  for (const store of ["operators", "templates", "settings", "catalog"]) {
    for (const record of meta[store] || []) await put(store, record);
  }
}

async function importFullMeta(meta, entries) {
  for (const store of STORE_NAMES) {
    if (store === "media" || store === "albumMedia" || store === "documents") continue;
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
  for (const record of meta.documents || []) {
    const entry = entries.find((item) => item.path.endsWith(`documents/${record.id}/${record.fileName}`) || item.path.endsWith(`/${record.fileName}`));
    const blob = new Blob(entry ? [entry.data] : [], { type: record.mimeType || documentMimeType(record.fileName) });
    await put("documents", { ...record, storageMode: "indexeddb", blob });
  }
}

async function exportAlbumClassZip(classId) {
  return withBusy("Экспорт альбома...", async () => {
    const klass = albumClassById(classId);
    if (!klass) return;
    const files = await buildAlbumExportFiles(klass);
    const blob = createZip(files);
    downloadBlob(blob, `${safeFileName(`${klass.name}_album_export`)}.zip`);
    await markAlbumStudentsExportedToDesigner(classId);
    await recordOperatorEvent("export", { targetType: "album_class", targetId: classId });
    await refreshData();
    notify("ZIP альбома экспортирован.");
    if (state.albumClassId === classId) renderAlbumClass();
  });
}

async function markAlbumStudentsExportedToDesigner(classId) {
  const time = now();
  const operatorId = currentOperatorIdForAction({ warn: false });
  for (const student of albumStudentsByClass(classId).filter(albumStudentHasPortrait)) {
    await put("albumStudents", {
      ...student,
      exportedToDesigner: true,
      exportedToDesignerAt: student.exportedToDesignerAt || time,
      exportedBy: student.exportedBy || operatorId,
      updatedAt: time,
      updatedBy: operatorId
    });
  }
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
  showBusy("Импорт альбомного ZIP...");
  try {
    const entries = await parseZip(new Uint8Array(await file.arrayBuffer()));
    const dataEntry = entries.find((entry) => entry.path.endsWith("spf-album-data.json"));
    if (!dataEntry) {
      const result = await importAlbumShootEntries(entries);
      if (!result.assignedCount && !result.qrCount) throw new Error("spf-album-data.json not found");
      await recordOperatorEvent("import", { targetType: "album_media", count: result.assignedCount });
      await refreshData();
      notify(`ZIP альбомной съемки: QR ${result.qrCount}, файлов ${result.assignedCount}${result.skippedCount ? `, пропущено ${result.skippedCount}` : ""}.`);
      if (state.albumClassId) renderAlbumClass();
      return;
    }
    const meta = JSON.parse(new TextDecoder().decode(dataEntry.data));
    const project = meta.project || { id: uid("album_project"), schoolName: meta.classInfo?.schoolName || "Импортированный альбом", createdAt: now() };
    const klass = meta.klass || { id: uid("album_class"), albumProjectId: project.id, name: meta.classInfo?.className || "Группа", albumType: "standard", pagesCount: 0, status: "", createdAt: now() };
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
    await recordOperatorEvent("import", { targetType: "album_class", targetId: klass.id });
    await refreshData();
    notify("ZIP альбома импортирован.");
    navigate("albumClass", { albumClassId: klass.id, albumProjectId: project.id, albumTab: "students" });
  } catch (error) {
    notify(zipImportErrorMessage(error, "альбома"));
  } finally {
    event.target.value = "";
    hideBusy();
  }
}

function zipImportErrorMessage(error, scope = "") {
  const text = String(error?.message || "");
  if (text.includes("Unsupported ZIP compression") || text.includes("Unable to decompress")) {
    return `Safari не распаковал сжатый ZIP${scope ? ` ${scope}` : ""}. Разархивируйте его и выберите кнопку "Импорт папки услуг".`;
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

function isSupportedImageZipEntry(entry) {
  return !isIgnoredZipEntry(entry) && /\.(jpe?g|png|webp)$/i.test(entry.path);
}

function isHeicZipEntry(entry) {
  return !isIgnoredZipEntry(entry) && /\.(heic|heif)$/i.test(entry.path);
}

function isVideoZipEntry(entry) {
  return !isIgnoredZipEntry(entry) && /\.(mp4|mov|m4v|webm)$/i.test(entry.path);
}

function isIgnoredZipEntry(entry) {
  const parts = String(entry.path || "").split("/").filter(Boolean);
  const name = parts[parts.length - 1] || "";
  return parts.includes("__MACOSX") || name.startsWith("._") || name === ".DS_Store";
}

function isIgnoredImportPath(path) {
  const parts = String(path || "").split("/").filter(Boolean);
  const name = parts[parts.length - 1] || "";
  return parts.includes("__MACOSX") || name.startsWith("._") || name === ".DS_Store";
}

function isAlbumMediaZipEntry(entry) {
  return isImageZipEntry(entry) || isVideoZipEntry(entry);
}

function sortZipEntries(a, b) {
  if (Number.isFinite(a.index) && Number.isFinite(b.index)) return a.index - b.index;
  return a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: "base" });
}

async function sortFilesByCaptureOrder(files) {
  const enriched = await Promise.all(files.map(async (file, index) => ({
    file,
    index,
    captureTime: await readExifDateTimeOriginal(file).catch(() => null),
    name: file.webkitRelativePath || file.name || ""
  })));
  return enriched
    .sort((a, b) => {
      if (a.captureTime && b.captureTime && a.captureTime !== b.captureTime) return a.captureTime - b.captureTime;
      if (a.captureTime && !b.captureTime) return -1;
      if (!a.captureTime && b.captureTime) return 1;
      const byName = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      return byName || a.index - b.index;
    })
    .map((item) => item.file);
}

async function readExifDateTimeOriginal(file) {
  if (!/\.jpe?g$/i.test(file.name || "")) return null;
  const bytes = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
  let text = "";
  for (let index = 0; index < bytes.length; index += 1) {
    const code = bytes[index];
    text += code >= 32 && code <= 126 ? String.fromCharCode(code) : " ";
  }
  const match = text.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute, second).getTime();
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
  if (ext === "svg") return "image/svg+xml";
  if (ext === "mp4" || ext === "m4v") return "video/mp4";
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  return fallbackType === "video" ? "video/mp4" : "image/jpeg";
}

async function parseZip(bytes) {
  const centralEntries = await parseZipCentralDirectory(bytes).catch(() => []);
  if (centralEntries.length) return centralEntries;
  return parseZipLocalHeaders(bytes);
}

async function parseZipCentralDirectory(bytes) {
  const endOffset = findZipEndOfCentralDirectory(bytes);
  if (endOffset < 0) return [];
  const totalEntries = readU16(bytes, endOffset + 10);
  const centralOffset = readU32(bytes, endOffset + 16);
  const entries = [];
  let offset = centralOffset;
  for (let index = 0; index < totalEntries && offset < bytes.length - 4; index += 1) {
    if (readU32(bytes, offset) !== 0x02014b50) break;
    const method = readU16(bytes, offset + 10);
    const compressedSize = readU32(bytes, offset + 20);
    const nameLength = readU16(bytes, offset + 28);
    const extraLength = readU16(bytes, offset + 30);
    const commentLength = readU16(bytes, offset + 32);
    const localOffset = readU32(bytes, offset + 42);
    const path = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    const localNameLength = readU16(bytes, localOffset + 26);
    const localExtraLength = readU16(bytes, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressed : await decompressZipEntry(compressed, method);
    entries.push({ path, data, index: entries.length });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function findZipEndOfCentralDirectory(bytes) {
  const min = Math.max(0, bytes.length - 0xffff - 22);
  for (let offset = bytes.length - 22; offset >= min; offset -= 1) {
    if (readU32(bytes, offset) === 0x06054b50) return offset;
  }
  return -1;
}

async function parseZipLocalHeaders(bytes) {
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

function calculateAlbumClassStatus(klass) {
  if (!klass) return "not_started";
  const manual = manualAlbumClassStatus(klass);
  if (manual) return manual;
  const students = albumStudentsByClass(klass.id);
  if (!students.length) return "not_started";
  const ownerIds = new Set([
    ...students.map((student) => student.id),
    ...albumGroupsByClass(klass.id).map((group) => group.id),
    ...albumTeachersByClass(klass.id).map((teacher) => teacher.id)
  ]);
  const hasMedia = state.data.albumMedia.some((media) => ownerIds.has(media.ownerId))
    || students.some(albumStudentHasMedia)
    || albumGroupsByClass(klass.id).some((group) => group.mediaId || group.videoMediaId)
    || albumTeachersByClass(klass.id).some((teacher) => teacher.portraitMediaId || teacher.videoMediaId);
  if (!hasMedia) return "not_started";
  return students.every(albumStudentHasPortrait) ? "shot" : "shooting";
}

function manualAlbumClassStatus(klass) {
  const status = normalizeAlbumClassStatus(klass?.status, "");
  return ALBUM_CLASS_MANUAL_STATUS_KEYS.includes(status) ? status : "";
}

function calculateAlbumStudentStatus(student) {
  if (!student) return "not_shot";
  const manual = normalizeAlbumStudentStatus(student.status, "");
  if (manual === "ready") return "ready";
  if (student.addedToLayout || student.exportedToDesigner || student.exportedToDesignerAt || student.designerExportedAt) return "ready";
  if (manual === "processed") return "processed";
  if (albumStudentHasFinal(student)) return "processed";
  if (manual === "shot") return "shot";
  return albumStudentHasMedia(student) ? "shot" : "not_shot";
}

function albumStudentHasMedia(student) {
  return Boolean(student?.portraitMediaId || student?.videoMediaId || albumMediaByOwner("student", student?.id).length);
}

function albumStudentHasPortrait(student) {
  return Boolean(student?.portraitMediaId || albumMediaByOwner("student", student?.id).some((media) => media.fileType === "image"));
}

function albumStudentHasFinal(student) {
  const finalIds = [student?.finalPortraitMediaId, student?.retouchMediaId, student?.finalExportMediaId, student?.finalMediaId].filter(Boolean);
  if (finalIds.length) return true;
  return albumMediaByOwner("student", student?.id).some((media) => media.role === "final" || media.kind === "final" || media.isFinalResult);
}

function albumClassStats(classId) {
  const students = albumStudentsByClass(classId);
  const groups = albumGroupsByClass(classId);
  const teachers = albumTeachersByClass(classId);
  const portraits = students.filter(albumStudentHasPortrait).length;
  const videos = students.filter((student) => student.videoMediaId).length;
  const ready = students.filter((student) => calculateAlbumStudentStatus(student) === "ready").length;
  const processed = students.filter((student) => ["processed", "ready"].includes(calculateAlbumStudentStatus(student))).length;
  const readyPercent = students.length ? Math.round(((portraits + processed + ready) / (students.length * 3)) * 100) : 0;
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
  const key = normalizeAlbumClassStatus(status, "not_started");
  return ALBUM_CLASS_STATUSES[key] || ALBUM_CLASS_STATUSES.not_started;
}

function albumStudentStatusLabel(status) {
  const key = normalizeAlbumStudentStatus(status, "not_shot");
  return ALBUM_STUDENT_STATUSES[key] || ALBUM_STUDENT_STATUSES.not_shot;
}

function albumGroupTypeLabel(type) {
  return ALBUM_GROUP_TYPES[type] || ALBUM_GROUP_TYPES.custom;
}

function albumStatusClass(status) {
  if (["shot", "processed", "ready", "print_ready", "printed", "delivered"].includes(status)) return "paid";
  if (["shooting", "layout"].includes(status)) return "in-progress";
  return "unpaid";
}

function normalizeAlbumType(value, fallback = "standard") {
  const text = String(value || "").trim().toLowerCase();
  const byLabel = Object.entries(ALBUM_TYPES).find(([key, label]) => key === text || label.toLowerCase() === text);
  return byLabel?.[0] || fallback;
}

function normalizeAlbumClassStatus(value, fallback = "not_started") {
  const text = String(value || "").trim().toLowerCase();
  if (text === "auto") return "";
  const mapped = LEGACY_ALBUM_CLASS_STATUS_MAP[text] || text;
  const byLabel = Object.entries(ALBUM_CLASS_STATUSES).find(([key, label]) => key === mapped || label.toLowerCase() === text);
  return byLabel?.[0] || fallback || "";
}

function normalizeAlbumStudentStatus(value, fallback = "not_shot") {
  const text = String(value || "").trim().toLowerCase();
  if (text === "auto") return "";
  const mapped = LEGACY_ALBUM_STUDENT_STATUS_MAP[text] || text;
  const byLabel = Object.entries(ALBUM_STUDENT_STATUSES).find(([key, label]) => key === mapped || label.toLowerCase() === text);
  return byLabel?.[0] || fallback || "";
}

function normalizeAlbumGroupType(value, fallback = "custom") {
  const text = String(value || "").trim().toLowerCase();
  const byLabel = Object.entries(ALBUM_GROUP_TYPES).find(([key, label]) => key === text || label.toLowerCase() === text);
  return byLabel?.[0] || fallback;
}

function classesByProject(projectId) {
  const project = projectById(projectId);
  const classes = state.data.classes.filter((klass) => klass.projectId === projectId);
  const sortMode = classSortMode(project);
  if (sortMode === "alpha") return classes.sort((a, b) => a.name.localeCompare(b.name, "ru", { sensitivity: "base" }));
  if (sortMode === "numeric") return classes.sort((a, b) => a.name.localeCompare(b.name, "ru", { numeric: true, sensitivity: "base" }));
  return manualOrderedClasses(projectId);
}

function manualOrderedClasses(projectId) {
  return state.data.classes
    .filter((klass) => klass.projectId === projectId)
    .sort((a, b) => classManualOrder(a) - classManualOrder(b) || a.name.localeCompare(b.name, "ru", { numeric: true, sensitivity: "base" }));
}

function classManualOrder(klass) {
  return Number.isFinite(klass.orderIndex) ? klass.orderIndex : state.data.classes.findIndex((item) => item.id === klass.id);
}

function classSortMode(project) {
  return CLASS_SORT_MODES[project?.classSort] ? project.classSort : "manual";
}

function nextClassOrderIndex(projectId) {
  const indexes = state.data.classes
    .filter((klass) => klass.projectId === projectId)
    .map((klass) => Number.isFinite(klass.orderIndex) ? klass.orderIndex : state.data.classes.findIndex((item) => item.id === klass.id));
  return indexes.length ? Math.max(...indexes) + 1 : 0;
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

function normalizeServicePriceInput(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = text.replace(/\s+/g, "").replace(",", ".");
  return /^\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized) : text;
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
    { key: "catalog", label: "Услуги", value: (student) => selectedCatalogIdsForStudent(student).map((id) => serviceName(catalogItemById(id))).filter(Boolean).join(", ") || "Не выбраны" },
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

function catalogWatermarkSettings() {
  const saved = state.data.settings.find((item) => item.id === SETTING_IDS.catalogWatermark) || {};
  return {
    id: SETTING_IDS.catalogWatermark,
    enabled: saved.enabled !== false,
    text: String(saved.text || "").trim(),
    opacity: normalizeWatermarkOpacity(saved.opacity),
    logoDataUrl: String(saved.logoDataUrl || "").trim(),
    logoName: String(saved.logoName || "").trim()
  };
}

function normalizeWatermarkOpacity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.48;
  return Math.min(0.85, Math.max(0.25, number));
}

async function saveWatermarkSettingsFromView() {
  const previous = catalogWatermarkSettings();
  const settings = {
    ...previous,
    enabled: Boolean(view.querySelector("[data-watermark-enabled]")?.checked),
    text: view.querySelector("[data-watermark-text]")?.value.trim() || "",
    opacity: normalizeWatermarkOpacity(view.querySelector("[data-watermark-opacity]")?.value)
  };
  await put("settings", settings);
  await refreshData();
  notify("Водяной знак сохранен.");
  showSettingsDetail("watermark");
}

function uploadWatermarkLogo() {
  state.currentPreview = { kind: "watermarkLogo" };
  previewInput.value = "";
  previewInput.click();
}

async function saveWatermarkLogo(file) {
  const previous = catalogWatermarkSettings();
  const logoDataUrl = await fileToPngImageDataUrl(file, { maxSize: 900 });
  await put("settings", {
    ...previous,
    enabled: true,
    logoDataUrl,
    logoName: file.name || "logo.png"
  });
  await refreshData();
  notify("Логотип водяного знака сохранен.");
  showSettingsDetail("watermark");
}

async function removeWatermarkLogo() {
  const previous = catalogWatermarkSettings();
  await put("settings", { ...previous, logoDataUrl: "", logoName: "" });
  await refreshData();
  notify("Логотип удален.");
  showSettingsDetail("watermark");
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
  if (state.filter === "todo") return ["not_started", "shooting"].includes(calculateStudentStatus(student));
  if (state.filter === "done") return ["shot", "processed", "printed", "delivered"].includes(calculateStudentStatus(student));
  if (state.filter === "processing") return calculateStudentStatus(student) === "shooting";
  if (state.filter === "ready") return ["processed", "printed", "delivered"].includes(calculateStudentStatus(student));
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

function calculateStudentStatus(student) {
  if (!student) return "not_started";
  const manual = manualStudentStatus(student);
  if (manual) return manual;
  const finalState = studentFinalState(student.id);
  if (finalState === "delivered") return "delivered";
  if (finalState === "printed") return "printed";
  if (finalState === "processed") return "processed";
  const checklist = studentChecklistState(student.id);
  if (checklist.requiredComplete) return "shot";
  if (checklist.hasProgress) return "shooting";
  return "not_started";
}

function manualStudentStatus(student) {
  if (!student) return "";
  const order = state.data.orders.find((entry) => entry.studentId === student.id);
  const values = [order?.status, student.orderStatus, student.status].map(normalizeStudentStatusKey);
  return values.find((status) => STUDENT_MANUAL_STATUS_KEYS.includes(status)) || "";
}

function normalizeStudentStatusKey(value) {
  const status = String(value || "").trim().toLowerCase();
  return LEGACY_STUDENT_STATUS_MAP[status] || (ORDER_STATUSES[status] ? status : "");
}

function studentFinalState(studentId) {
  const works = finalWorksForStudent(studentId);
  const finalMedia = mediaByStudent(studentId).filter((item) => item.type === "final_work" || item.orderType === "final_work" || item.isFinalResult);
  if (!works.length && !finalMedia.length) return "";
  if (works.length && works.every((work) => work.status === "delivered")) return "delivered";
  if (works.length && works.every((work) => work.status === "printed" || work.status === "delivered")) return "printed";
  return "processed";
}

function studentChecklistState(studentId) {
  const order = orderByStudent(studentId);
  const items = order.items || [];
  const media = mediaByStudent(studentId).filter((item) => item.type !== "final_work" && item.orderType !== "final_work");
  const mediaIds = new Set(media.map((item) => item.id));
  const doneCount = items.filter((item) => item.status === "done").length;
  const requiredComplete = items.length > 0 && items.every((item) => item.status === "done" && orderItemHasMedia(item, media, mediaIds));
  return {
    requiredComplete,
    hasProgress: media.length > 0 || doneCount > 0
  };
}

function orderItemHasMedia(item, media, mediaIds) {
  const fileIds = Array.isArray(item.fileIds) ? item.fileIds : [];
  if (fileIds.some((id) => mediaIds.has(id))) return true;
  return media.some((entry) => entry.orderType === item.type);
}

function orderByStudent(studentId) {
  const student = studentById(studentId);
  const order = state.data.orders.find((entry) => entry.studentId === studentId) || { id: `order_${studentId}`, studentId, items: [] };
  return normalizeOrderForStudent(student, order);
}

function normalizeOrderForStudent(student, order) {
  if (!student) return { ...order, items: order.items?.length ? order.items : defaultOrderItems() };
  const selectedCatalogIds = selectedCatalogIdsForStudent(student);
  if (!selectedCatalogIds.length) {
    return { ...order, items: [] };
  }
  const serviceItems = orderItemsFromCatalogs(selectedCatalogIds, order.items || []);
  const serviceTypes = new Set(serviceItems.map((item) => item.type));
  const hasOnlyServiceItems = (order.items || []).length > 0 && (order.items || []).every((item) => serviceTypes.has(item.type));
  if (hasOnlyServiceItems && serviceItems.length === order.items.length) return order;
  return {
    ...order,
    catalogId: selectedCatalogIds[0],
    catalogIds: selectedCatalogIds,
    items: serviceItems
  };
}

function mediaByStudent(studentId) {
  return state.data.media
    .filter((item) => item.studentId === studentId)
    .sort((a, b) => mediaSortTime(a) - mediaSortTime(b) || String(a.fileName || a.id).localeCompare(String(b.fileName || b.id), undefined, { numeric: true, sensitivity: "base" }));
}

function mediaSortTime(item) {
  const time = Date.parse(item?.createdAt || "");
  return Number.isFinite(time) ? time : 0;
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

function serviceName(item) {
  return String(item?.name || item?.title || "").trim();
}

function serviceManualOrder(item, fallbackIndex = 0) {
  const value = Number(item?.orderIndex);
  return Number.isFinite(value) ? value : fallbackIndex;
}

function manualOrderedServices(items = state.data.catalog) {
  return [...items].sort((a, b) => {
    const indexA = state.data.catalog.findIndex((item) => item.id === a.id);
    const indexB = state.data.catalog.findIndex((item) => item.id === b.id);
    return serviceManualOrder(a, indexA) - serviceManualOrder(b, indexB)
      || serviceName(a).localeCompare(serviceName(b), "ru", { numeric: true, sensitivity: "base" })
      || String(a.id || "").localeCompare(String(b.id || ""));
  });
}

function alphabeticalServices(items = state.data.catalog) {
  return [...items].sort((a, b) => serviceName(a).localeCompare(serviceName(b), "ru", { numeric: true, sensitivity: "base" }));
}

function categoryOrderedServices(items = state.data.catalog) {
  return alphabeticalServices(items).sort((a, b) => serviceCategoryLabel(a).localeCompare(serviceCategoryLabel(b), "ru", { numeric: true, sensitivity: "base" }));
}

function publicOrderedServices(items = state.data.catalog) {
  return manualOrderedServices(items);
}

function servicesForAdminView() {
  const filtered = state.data.catalog.filter(serviceMatchesCategoryFilter);
  if (state.serviceSort === "alpha") return alphabeticalServices(filtered);
  if (state.serviceSort === "category") return categoryOrderedServices(filtered);
  return manualOrderedServices(filtered);
}

function nextServiceOrderIndex() {
  const orders = state.data.catalog.map((item, index) => serviceManualOrder(item, index));
  return (orders.length ? Math.max(...orders) : -1) + 1;
}

function isServicePopular(item) {
  return Boolean(item?.popular);
}

function serviceCategory(item) {
  return String(item?.category || "").trim();
}

function normalizeServiceCategory(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function serviceCategoryLabel(itemOrCategory) {
  const value = typeof itemOrCategory === "string" ? normalizeServiceCategory(itemOrCategory) : serviceCategory(itemOrCategory);
  return value || "Без категории";
}

function serviceCategoryOptions({ includeDefaults = true } = {}) {
  const values = new Set(includeDefaults ? serviceCategorySettings().categories : []);
  state.data.catalog.forEach((item) => {
    const category = serviceCategory(item);
    if (category) values.add(category);
  });
  return Array.from(values).sort((a, b) => a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" }));
}

function serviceCategorySettings() {
  const saved = state.data.settings.find((item) => item.id === SETTING_IDS.serviceCategories);
  const categories = Array.isArray(saved?.categories) && saved.categories.length ? saved.categories : SERVICE_DEFAULT_CATEGORIES;
  return {
    id: SETTING_IDS.serviceCategories,
    categories: Array.from(new Set(categories.map(normalizeServiceCategory).filter(Boolean)))
  };
}

async function saveServiceCategorySettings(categories) {
  await put("settings", stampUpdated({
    ...serviceCategorySettings(),
    categories: Array.from(new Set(categories.map(normalizeServiceCategory).filter(Boolean)))
  }));
  await refreshData();
}

function showServiceCategoryManager() {
  const categories = serviceCategoryOptions();
  const panel = document.createElement("div");
  panel.className = "qr-panel-backdrop service-category-backdrop";
  panel.innerHTML = `
    <section class="qr-panel service-category-panel" role="dialog" aria-modal="true" aria-label="Категории услуг">
      <div class="card-header">
        <div>
          <h2 class="card-title">Категории услуг</h2>
          <p class="muted">Добавляйте и переименовывайте категории для фильтра услуг.</p>
        </div>
        <button class="icon-button" data-close-service-categories type="button" aria-label="Закрыть"><span data-icon="close"></span></button>
      </div>
      <div class="import-draft-list">
        ${categories.map((category) => `
          <div class="import-draft-row">
            <strong>${escapeHtml(category)}</strong>
            <span class="row">
              <button class="secondary-button compact" data-edit-service-category="${escapeAttr(category)}" type="button">Изменить</button>
              <button class="secondary-button compact" data-delete-service-category="${escapeAttr(category)}" type="button">Удалить</button>
            </span>
          </div>
        `).join("") || '<p class="muted">Категорий пока нет.</p>'}
      </div>
      <form class="import-draft-assign" data-add-service-category-form>
        <input class="input" name="category" placeholder="Новая категория" />
        <button class="primary-button compact" type="submit">Добавить</button>
      </form>
    </section>
  `;
  const close = () => panel.remove();
  panel.querySelector("[data-close-service-categories]")?.addEventListener("click", close);
  panel.querySelector("[data-add-service-category-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const category = normalizeServiceCategory(new FormData(event.currentTarget).get("category"));
    if (!category) return notify("Введите название категории.");
    await saveServiceCategorySettings([...serviceCategoryOptions(), category]);
    close();
    showServiceCategoryManager();
  });
  panel.querySelectorAll("[data-edit-service-category]").forEach((node) => node.addEventListener("click", async () => {
    const oldName = node.dataset.editServiceCategory;
    const nextName = normalizeServiceCategory(prompt("Новое название категории", oldName));
    if (!nextName || nextName === oldName) return;
    await renameServiceCategory(oldName, nextName);
    close();
    showServiceCategoryManager();
  }));
  panel.querySelectorAll("[data-delete-service-category]").forEach((node) => node.addEventListener("click", async () => {
    const category = node.dataset.deleteServiceCategory;
    if (!confirm(`Удалить категорию "${category}"? У услуг эта категория будет очищена.`)) return;
    await deleteServiceCategory(category);
    close();
    showServiceCategoryManager();
  }));
  document.body.append(panel);
  injectIcons();
}

async function renameServiceCategory(oldName, nextName) {
  const categories = serviceCategoryOptions().map((category) => category === oldName ? nextName : category);
  await saveServiceCategorySettings(categories);
  for (const item of state.data.catalog.filter((service) => serviceCategory(service) === oldName)) {
    await put("catalog", stampUpdated({ ...item, category: nextName }));
  }
  await refreshData();
  renderServices();
}

async function deleteServiceCategory(category) {
  await saveServiceCategorySettings(serviceCategoryOptions().filter((item) => item !== category));
  for (const item of state.data.catalog.filter((service) => serviceCategory(service) === category)) {
    await put("catalog", stampUpdated({ ...item, category: "" }));
  }
  await refreshData();
  renderServices();
}

function serviceMatchesCategoryFilter(item) {
  if (state.serviceCategoryFilter === "all") return true;
  if (state.serviceCategoryFilter === SERVICE_UNCATEGORIZED) return !serviceCategory(item);
  return serviceCategory(item) === state.serviceCategoryFilter;
}

function serviceGender(item) {
  const value = String(item?.gender || "unisex").trim().toLowerCase();
  return ["boys", "girls", "unisex"].includes(value) ? value : "unisex";
}

function normalizeServiceGender(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["boys", "male", "boy", "мальчики", "мальчикам", "для мальчиков"].includes(text)) return "boys";
  if (["girls", "female", "girl", "девочки", "девочкам", "для девочек"].includes(text)) return "girls";
  return "unisex";
}

function serviceGenderLabel(itemOrGender) {
  const gender = typeof itemOrGender === "string" ? normalizeServiceGender(itemOrGender) : serviceGender(itemOrGender);
  if (gender === "boys") return "Мальчикам";
  if (gender === "girls") return "Девочкам";
  return "Для всех";
}

function serviceShortDescription(item) {
  return String(item?.shortDescription || "").trim();
}

function serviceDescription(item) {
  return String(item?.description || "").trim();
}

function servicePreviewImageDataUrl(item) {
  return String(item?.previewDataUrl || item?.previewImageDataUrl || "").trim();
}

function servicePreviewVideoDataUrl(item) {
  return String(item?.previewVideoDataUrl || item?.previewVideoUrl || "").trim();
}

function servicePreviewImageId(item) {
  return servicePreviewImageDataUrl(item) ? (item?.previewImageId || `${item?.id || "service"}_preview_image`) : "";
}

function servicePreviewVideoId(item) {
  return servicePreviewVideoDataUrl(item) ? (item?.previewVideoId || `${item?.id || "service"}_preview_video`) : "";
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
  return selected.length ? [] : orderItemsFromTemplate();
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
  return normalizeCatalogIds(student?.catalogIds?.length ? student.catalogIds : (student?.catalogId ? [student.catalogId] : []));
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
  return `${serviceName(catalog)}: ${angle.name}`;
}

function servicePrompt(item) {
  return String(item?.prompt || item?.orderInfo || "").trim();
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

function classColorOption(colorId, fallbackName = "") {
  const byId = CLASS_COLOR_OPTIONS.find((option) => option.id === colorId);
  if (byId) return byId;
  const cover = classCoverClass(fallbackName).replace("cover-", "");
  return CLASS_COLOR_OPTIONS.find((option) => option.id === cover) || CLASS_COLOR_OPTIONS[0];
}

function pluralizeRu(count, one, few, many) {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function statusDot(status) {
  const colorClass = status === "paid" || ["shot", "processed", "printed", "delivered"].includes(status) ? "dot-green" : status === "shooting" ? "dot-blue" : "dot-yellow";
  return `<span class="status-dot ${colorClass}"></span>`;
}

function currentOrderStatus(student) {
  return calculateStudentStatus(student);
}

function orderStatusLabel(studentOrStatus) {
  const status = typeof studentOrStatus === "string" ? normalizeStudentStatusKey(studentOrStatus) : currentOrderStatus(studentOrStatus);
  return ORDER_STATUSES[status] || ORDER_STATUSES.not_started;
}

function orderStatusClass(studentOrStatus) {
  const status = typeof studentOrStatus === "string" ? normalizeStudentStatusKey(studentOrStatus) : currentOrderStatus(studentOrStatus);
  if (["shot", "processed", "printed", "delivered"].includes(status)) return "paid";
  if (status === "shooting") return "in-progress";
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
  if (/₽|руб|rub|eur|€|usd|\$/i.test(text)) return text;
  const amount = parseMoney(text);
  if (amount) return formatMoney(amount);
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
  const labels = state.data.catalog.map((item, index) => `${index + 1}. ${serviceName(item)}`).join("\n");
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

async function withBusy(message, task) {
  showBusy(message);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  try {
    return await task();
  } finally {
    hideBusy();
  }
}

function showBusy(message = "Загрузка...") {
  document.querySelector(".busy-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "busy-overlay";
  overlay.innerHTML = `
    <div class="busy-card" role="status" aria-live="polite">
      <span class="busy-spinner"></span>
      <strong>${escapeHtml(message)}</strong>
      <small>Пожалуйста, подождите</small>
    </div>
  `;
  document.body.append(overlay);
}

function hideBusy() {
  document.querySelector(".busy-overlay")?.remove();
}

function devImportDebug(label, payload) {
  if (!/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(location.hostname)) return;
  console.debug(label, payload);
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

async function fileToOptimizedImageDataUrl(file, options = {}) {
  if (!file || !String(file.type || "").startsWith("image/")) return fileToDataUrl(file);
  if (/gif|svg|heic|heif/i.test(file.type || file.name || "")) return fileToDataUrl(file);
  const maxSize = options.maxSize || 1600;
  const quality = options.quality || 0.84;
  try {
    const image = await loadImageForCanvas(file);
    const width = image.width || image.naturalWidth;
    const height = image.height || image.naturalHeight;
    if (!width || !height) return fileToDataUrl(file);
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    if (typeof image.close === "function") image.close();
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return fileToDataUrl(file);
  }
}

async function fileToPngImageDataUrl(file, options = {}) {
  if (!file || !String(file.type || "").startsWith("image/")) return fileToDataUrl(file);
  if (/svg|heic|heif/i.test(file.type || file.name || "")) return fileToDataUrl(file);
  const maxSize = options.maxSize || 900;
  try {
    const image = await loadImageForCanvas(file);
    const width = image.width || image.naturalWidth;
    const height = image.height || image.naturalHeight;
    if (!width || !height) return fileToDataUrl(file);
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    if (typeof image.close === "function") image.close();
    return canvas.toDataURL("image/png");
  } catch {
    return fileToDataUrl(file);
  }
}

function loadImageForCanvas(file) {
  if ("createImageBitmap" in window) return createImageBitmap(file);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load image"));
    };
    image.src = url;
  });
}

function dataUrlExtension(dataUrl) {
  const mime = String(dataUrl || "").slice(0, 64);
  if (mime.includes("image/png")) return "png";
  if (mime.includes("image/webp")) return "webp";
  if (mime.includes("image/gif")) return "gif";
  if (mime.includes("image/svg+xml")) return "svg";
  if (mime.includes("video/mp4")) return "mp4";
  if (mime.includes("video/quicktime")) return "mov";
  if (mime.includes("video/webm")) return "webm";
  return "jpg";
}

function dataUrlToBytes(dataUrl) {
  const text = String(dataUrl || "");
  if (!text.startsWith("data:")) return null;
  const comma = text.indexOf(",");
  if (comma < 0) return null;
  const header = text.slice(5, comma);
  const mime = header.split(";")[0] || "application/octet-stream";
  const payload = text.slice(comma + 1);
  try {
    if (!header.includes(";base64")) return { mime, bytes: new TextEncoder().encode(decodeURIComponent(payload)) };
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return { mime, bytes };
  } catch {
    return null;
  }
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

function fileLooksSupportedImage(file) {
  return /\.(jpe?g|png|webp)$/i.test(file?.name || "") || ["image/jpeg", "image/png", "image/webp"].includes(file?.type || "");
}

function fileLooksHeic(file) {
  return /\.(heic|heif)$/i.test(file?.name || "");
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
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/></svg>',
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

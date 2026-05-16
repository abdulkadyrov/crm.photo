const DB_NAME = "school-photo-flow";
const DB_VERSION = 1;
const STORE_NAMES = ["projects", "classes", "students", "orders", "media", "templates", "settings"];
const ORDER_TYPES = {
  portrait: "Portrait",
  full: "Full body",
  side: "Side",
  video: "Video",
  interview: "Interview"
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
  qrStream: null
};

const view = document.querySelector("#view");
const title = document.querySelector("#screen-title");
const toast = document.querySelector("#toast");
const mediaInput = document.querySelector("#media-input");
const zipInput = document.querySelector("#zip-input");

init();

async function init() {
  injectIcons();
  document.documentElement.dataset.theme = localStorage.getItem("spf-theme") || "light";
  state.db = await openDb();
  await seedIfNeeded();
  await refreshData();
  bindShell();
  navigate("home");
  registerServiceWorker();
}

function emptyData() {
  return {
    projects: [],
    classes: [],
    students: [],
    orders: [],
    media: [],
    templates: [],
    settings: []
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
    name: "MVP checklist",
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
  zipInput.addEventListener("change", handleZipInput);
}

function navigate(route, params = {}) {
  stopQrStream();
  Object.assign(state, params, { route });
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.route === route));
  render();
}

function render() {
  const renderers = {
    home: renderHome,
    search: renderSearch,
    scan: renderScan,
    classes: renderClasses,
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
        <button class="icon-button" data-add-class="${project.id}" type="button" title="Добавить класс"><span data-icon="plus"></span></button>
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
  view.innerHTML = `
    <section class="toolbar">
      <select class="select" data-project-select>
        ${projects.map((project) => `<option value="${project.id}" ${project.id === activeProject ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}
      </select>
      <button class="primary-button" data-add-class="${activeProject}" type="button">Класс</button>
    </section>
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
        <button class="icon-button" data-add-student="${klass.id}" type="button" title="Добавить ученика"><span data-icon="plus"></span></button>
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
  title.textContent = "Scan QR";
  view.innerHTML = `
    <section class="split">
      <div class="panel">
        <div class="qr-box" id="qr-box">
          <div>
            <p class="card-title">QR → ученик → чеклист</p>
            <p class="muted">Наведите камеру на QR или введите studentId/qrId вручную.</p>
          </div>
        </div>
        <div class="toolbar" style="margin-top:12px">
          <button class="primary-button" data-start-scan type="button">Сканировать</button>
          <button class="secondary-button" data-stop-scan type="button">Стоп</button>
        </div>
      </div>
      <form class="panel grid" data-manual-qr>
        <h2 class="card-title">Ручной ввод</h2>
        <input class="input" name="qr" placeholder="studentId или qrId" required />
        <button class="primary-button" type="submit">Открыть ученика</button>
      </form>
    </section>
  `;
  bindViewActions();
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
  title.textContent = `${student.firstName} ${student.lastName}`;
  view.innerHTML = `
    <section class="split">
      <div class="grid">
        <article class="panel">
          <div class="card-header">
            <div>
              <h2 class="card-title">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</h2>
              <p class="muted">${escapeHtml(project?.name || "")} · ${escapeHtml(klass?.name || "")} · QR ${escapeHtml(student.qrId)}</p>
            </div>
            <span class="status-pill ${student.paymentStatus}">${student.paymentStatus === "paid" ? "paid" : "unpaid"}</span>
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
        <h2 class="card-title">Очередь</h2>
        ${queueList(order)}
        <select class="select" data-payment="${student.id}">
          <option value="paid" ${student.paymentStatus === "paid" ? "selected" : ""}>paid</option>
          <option value="unpaid" ${student.paymentStatus === "unpaid" ? "selected" : ""}>unpaid</option>
        </select>
        <button class="secondary-button" data-generate-qr="${student.id}" type="button">Показать QR payload</button>
      </aside>
    </section>
  `;
  bindViewActions();
}

function taskRow(item, studentId) {
  return `
    <div class="task-row ${item.status === "done" ? "done" : ""}">
      <div>
        <strong>${ORDER_TYPES[item.type] || item.type}</strong>
        <p class="muted">${item.fileIds.length} файлов</p>
      </div>
      <button class="${item.status === "done" ? "secondary-button" : "primary-button"} compact" data-toggle-task="${studentId}:${item.type}" type="button">
        ${item.status === "done" ? "done" : "pending"}
      </button>
    </div>
  `;
}

function queueList(order) {
  const pending = order.items.filter((item) => item.status !== "done");
  if (!pending.length) return '<p class="status-pill paid">Чеклист закрыт</p>';
  return pending.map((item, index) => `
    <div class="task-row">
      <strong>${index + 1}. ${ORDER_TYPES[item.type] || item.type}</strong>
      <span class="muted">pending</span>
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

function renderSettings() {
  title.textContent = "Settings";
  const template = state.data.templates[0] || { id: uid("template"), name: "Checklist", items: Object.keys(ORDER_TYPES) };
  view.innerHTML = `
    <section class="grid">
      <article class="panel grid">
        <h2 class="card-title">Шаблон чеклиста</h2>
        <input class="input" data-template-name value="${escapeAttr(template.name)}" />
        <textarea class="textarea" data-template-items>${template.items.map((item) => ORDER_TYPES[item] || item).join("\n")}</textarea>
        <button class="primary-button" data-save-template="${template.id}" type="button">Сохранить шаблон</button>
      </article>
      <article class="panel grid">
        <h2 class="card-title">Импорт / экспорт</h2>
        <div class="toolbar">
          <button class="secondary-button" data-import-zip type="button">Импорт ZIP</button>
          <button class="primary-button" data-action="export-all" type="button">Экспорт ZIP</button>
        </div>
      </article>
      <article class="panel grid">
        <h2 class="card-title">Данные MVP</h2>
        <button class="danger-button" data-reset-demo type="button">Очистить и создать demo</button>
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
    <button class="student-card" data-open-student="${student.id}" type="button">
      <div class="student-line">
        <div>
          <h3>${escapeHtml(student.lastName)} ${escapeHtml(student.firstName)}</h3>
          <p class="muted">${escapeHtml(project?.name || "")} · ${escapeHtml(klass?.name || "")}</p>
        </div>
        <span class="status-pill ${student.paymentStatus}">${student.paymentStatus}</span>
      </div>
      <div class="progress"><span style="width:${c.percent}%"></span></div>
      <p class="muted">${c.doneCount}/${c.total} задач · ${statusLabel(student)}</p>
    </button>
  `;
}

function bindViewActions() {
  injectIcons();
  view.querySelectorAll("[data-open-project]").forEach((node) => {
    node.addEventListener("click", (event) => {
      if (event.target.closest("button[data-add-class]")) return;
      navigate("classes", { projectId: node.dataset.openProject });
    });
  });
  view.querySelectorAll("[data-add-class]").forEach((node) => node.addEventListener("click", () => addClass(node.dataset.addClass)));
  view.querySelectorAll("[data-add-student]").forEach((node) => node.addEventListener("click", () => addStudent(node.dataset.addStudent)));
  view.querySelectorAll("[data-open-student]").forEach((node) => node.addEventListener("click", () => navigate("student", { studentId: node.dataset.openStudent })));
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
  view.querySelector("[data-payment]")?.addEventListener("change", (event) => updatePayment(event.target.dataset.payment, event.target.value));
  view.querySelector("[data-manual-qr]")?.addEventListener("submit", handleManualQr);
  view.querySelector("[data-start-scan]")?.addEventListener("click", startQrScanner);
  view.querySelector("[data-stop-scan]")?.addEventListener("click", stopQrStream);
  view.querySelector("[data-import-zip]")?.addEventListener("click", () => zipInput.click());
  view.querySelectorAll("[data-action='export-all']").forEach((node) => node.addEventListener("click", () => exportZip()));
  view.querySelectorAll("[data-export-student]").forEach((node) => node.addEventListener("click", () => exportZip(node.dataset.exportStudent)));
  view.querySelector("[data-save-template]")?.addEventListener("click", saveTemplate);
  view.querySelector("[data-reset-demo]")?.addEventListener("click", resetDemo);
  view.querySelector("[data-reset-order]")?.addEventListener("click", () => resetOrder(state.studentId));
  view.querySelector("[data-generate-qr]")?.addEventListener("click", () => showQrPayload(state.studentId));
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

async function addStudent(classId) {
  const firstName = prompt("Имя ученика");
  if (!firstName) return;
  const lastName = prompt("Фамилия ученика") || "";
  const id = uid("student");
  await put("students", { id, classId, firstName: firstName.trim(), lastName: lastName.trim(), qrId: id, paymentStatus: "unpaid", status: "not_started" });
  await put("orders", { id: `order_${id}`, studentId: id, items: orderItemsFromTemplate() });
  await refreshData();
  navigate("student", { studentId: id });
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

async function attachFileToOrder(studentId, type, fileId) {
  const order = orderByStudent(studentId);
  const item = order.items.find((entry) => entry.type === type) || order.items[0];
  item.fileIds = Array.from(new Set([...item.fileIds, fileId]));
  item.status = "done";
  await put("orders", order);
}

async function markTaskDone(studentId, type) {
  if (!type) return;
  const order = orderByStudent(studentId);
  const item = order.items.find((entry) => entry.type === type);
  if (item) item.status = "done";
  await put("orders", order);
  await refreshData();
  renderStudent();
}

async function toggleTask(studentId, type) {
  const order = orderByStudent(studentId);
  const item = order.items.find((entry) => entry.type === type);
  if (item) item.status = item.status === "done" ? "pending" : "done";
  await put("orders", order);
  await refreshData();
  renderStudent();
}

async function updatePayment(studentId, paymentStatus) {
  const student = studentById(studentId);
  await put("students", { ...student, paymentStatus });
  await refreshData();
  renderStudent();
}

async function resetOrder(studentId) {
  const order = orderByStudent(studentId);
  order.items = order.items.map((item) => ({ ...item, status: "pending", fileIds: [] }));
  await put("orders", order);
  await refreshData();
  renderStudent();
}

async function saveTemplate() {
  const name = view.querySelector("[data-template-name]").value.trim() || "Checklist";
  const items = view.querySelector("[data-template-items]").value.split("\n").map(normalizeOrderType).filter(Boolean);
  if (!items.length) return notify("Добавьте хотя бы один пункт чеклиста.");
  const id = view.querySelector("[data-save-template]").dataset.saveTemplate;
  await put("templates", { id, name, items: Array.from(new Set(items)), scope: "default" });
  await refreshData();
  notify("Шаблон сохранен.");
  renderSettings();
}

async function resetDemo() {
  if (!confirm("Очистить локальные данные и создать demo?")) return;
  for (const store of STORE_NAMES) await clearStore(store);
  await seedIfNeeded();
  await refreshData();
  navigate("home");
}

function handleManualQr(event) {
  event.preventDefault();
  openQrValue(new FormData(event.currentTarget).get("qr"));
}

function openQrValue(value) {
  const parsed = parseQrPayload(value);
  const student = state.data.students.find((entry) => entry.id === parsed || entry.qrId === parsed);
  if (!student) {
    notify("Ученик по QR не найден.");
    return;
  }
  navigate("student", { studentId: student.id });
}

async function startQrScanner() {
  const box = view.querySelector("#qr-box");
  if (!("BarcodeDetector" in window)) {
    notify("BarcodeDetector недоступен в этом браузере. Используйте ручной ввод.");
    return;
  }
  try {
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    state.qrStream = stream;
    const video = document.createElement("video");
    video.className = "video-preview";
    video.srcObject = stream;
    video.playsInline = true;
    box.replaceChildren(video);
    await video.play();
    const scan = async () => {
      if (!state.qrStream) return;
      const codes = await detector.detect(video).catch(() => []);
      if (codes[0]?.rawValue) {
        stopQrStream();
        openQrValue(codes[0].rawValue);
        return;
      }
      requestAnimationFrame(scan);
    };
    scan();
  } catch (error) {
    notify("Камера недоступна. Проверьте разрешения браузера.");
  }
}

function stopQrStream() {
  if (!state.qrStream) return;
  state.qrStream.getTracks().forEach((track) => track.stop());
  state.qrStream = null;
}

function parseQrPayload(value) {
  const raw = String(value || "").trim();
  try {
    const json = JSON.parse(raw);
    return json.studentId || json.qrId || raw;
  } catch {
    return raw;
  }
}

async function exportZip(studentId = null) {
  const files = await buildExportFiles(studentId);
  const blob = createZip(files);
  downloadBlob(blob, `SPF_export_${new Date().toISOString().slice(0, 10)}.zip`);
  notify("ZIP экспортирован.");
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
    for (const store of ["projects", "classes", "students", "orders", "templates"]) {
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
  const c = completion(student.id);
  if (c.done) return "готово";
  if (mediaByStudent(student.id).length) return "в обработке";
  return "не снято";
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

function defaultOrderItems() {
  return Object.keys(ORDER_TYPES).map((type) => ({ type, status: "pending", fileIds: [] }));
}

function orderItemsFromTemplate() {
  const items = state.data.templates[0]?.items || Object.keys(ORDER_TYPES);
  return items.map((type) => ({ type, status: "pending", fileIds: [] }));
}

function normalizeOrderType(value) {
  const text = value.trim().toLowerCase();
  const found = Object.entries(ORDER_TYPES).find(([key, label]) => key === text || label.toLowerCase() === text);
  return found?.[0] || text.replace(/\s+/g, "_");
}

function filterChip(filter, label) {
  return `<button class="chip ${state.filter === filter ? "active" : ""}" data-filter="${filter}" type="button">${label}</button>`;
}

function empty(text) {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}

function showQrPayload(studentId) {
  const student = studentById(studentId);
  prompt("QR payload", JSON.stringify({ studentId: student.id }));
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
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L6.6 16.6l.1-.1A1.7 1.7 0 0 0 7 14.6a1.7 1.7 0 0 0-1.5-1H5v-3h.5A1.7 1.7 0 0 0 7 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1A1.7 1.7 0 0 0 17 9a1.7 1.7 0 0 0 1.5 1h.5v3h-.5a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    theme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 1 0 9 6 8 8 0 1 1-9-6Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
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

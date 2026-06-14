import { APP_NAME, APP_VERSION } from "./constants.js";
import { state } from "./state.js";
import { createHashRouter } from "./router.js";

const router = createHashRouter();
const BOOTSTRAP_RECOVERY_KEY = "vakha-studio-bootstrap-recovery";

export async function bootstrap() {
  state.appVersion = APP_VERSION;
  state.router = router;

  try {
    await import("./legacy-app.js");
    clearRecoveryFlag();
  } catch (error) {
    await handleBootstrapFailure(error);
  }
}

bootstrap();

async function handleBootstrapFailure(error) {
  console.error("Vakha Studio bootstrap failed", error);
  if (!readRecoveryFlag()) {
    setRecoveryFlag();
    await clearAppCaches();
    location.reload();
    return;
  }
  renderBootstrapError(error);
}

async function clearAppCaches() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // The visible fallback below is safer than blocking on cache cleanup.
  }
}

function renderBootstrapError(error) {
  const title = document.querySelector("#screen-title");
  const context = document.querySelector("#screen-context");
  const summary = document.querySelector("#screen-summary");
  const view = document.querySelector("#view");
  if (title) title.textContent = "Ошибка загрузки";
  if (context) context.textContent = APP_NAME;
  if (summary) summary.textContent = "Кэш очищен. Обновите страницу еще раз.";
  if (!view) return;
  const message = error && error.message ? error.message : "Не удалось запустить приложение.";
  view.innerHTML = `
    <section class="panel grid">
      <div>
        <h2 class="card-title">Приложение не запустилось</h2>
        <p class="muted">${escapeHtml(message)}</p>
      </div>
      <button class="primary-button" data-bootstrap-reload type="button">Обновить приложение</button>
    </section>
  `;
  const button = view.querySelector("[data-bootstrap-reload]");
  if (button) {
    button.addEventListener("click", async () => {
      clearRecoveryFlag();
      await clearAppCaches();
      location.reload();
    });
  }
}

function readRecoveryFlag() {
  try {
    return sessionStorage.getItem(BOOTSTRAP_RECOVERY_KEY) === "true";
  } catch {
    return false;
  }
}

function setRecoveryFlag() {
  try {
    sessionStorage.setItem(BOOTSTRAP_RECOVERY_KEY, "true");
  } catch {
    // ignore
  }
}

function clearRecoveryFlag() {
  try {
    sessionStorage.removeItem(BOOTSTRAP_RECOVERY_KEY);
  } catch {
    // ignore
  }
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

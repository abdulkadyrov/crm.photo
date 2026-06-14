const CACHE_NAME = "vakha-studio-cache-v28";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./js/core/app.js",
  "./js/core/legacy-app.js",
  "./js/core/router.js",
  "./js/core/state.js",
  "./js/core/db.js",
  "./js/core/storage.js",
  "./js/core/constants.js",
  "./js/modules/dashboard.js",
  "./js/modules/projects.js",
  "./js/modules/groups.js",
  "./js/modules/students.js",
  "./js/modules/student-details.js",
  "./js/modules/qr.js",
  "./js/modules/import.js",
  "./js/modules/export.js",
  "./js/modules/albums.js",
  "./js/modules/services-catalog.js",
  "./js/modules/montage.js",
  "./js/modules/final-works.js",
  "./js/modules/print.js",
  "./js/modules/operators.js",
  "./js/modules/settings.js",
  "./js/modules/checklist.js",
  "./js/modules/public-catalog.js",
  "./js/services/qr-service.js",
  "./js/services/zip-service.js",
  "./js/services/media-service.js",
  "./js/services/print-service.js",
  "./js/services/pdf-service.js",
  "./js/services/import-service.js",
  "./js/services/export-service.js",
  "./js/services/album-service.js",
  "./js/services/finalwork-service.js",
  "./js/ui/modal.js",
  "./js/ui/toast.js",
  "./js/ui/bottom-nav.js",
  "./js/ui/cards.js",
  "./js/ui/dialogs.js",
  "./js/ui/forms.js",
  "./js/ui/gallery.js",
  "./js/ui/print-preview.js",
  "./js/utils/dom.js",
  "./js/utils/date.js",
  "./js/utils/file.js",
  "./js/utils/image.js",
  "./js/utils/canvas.js",
  "./js/utils/ids.js",
  "./js/utils/validation.js",
  "./js/utils/debounce.js",
  "./vendor/jsQR.js",
  "./manifest.webmanifest",
  "./icons/vakha-studio-logo.png",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(handleRequest(event.request));
});

function shouldPreferNetwork(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (request.mode === "navigate") return true;
  return ["script", "style", "worker", "manifest"].includes(request.destination)
    || /\.(?:html|js|css|webmanifest)$/i.test(url.pathname);
}

async function handleRequest(request) {
  return shouldPreferNetwork(request) ? networkFirst(request) : cacheFirst(request);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (isUsableResponse(request, response)) {
      await cacheResponse(request, response);
      return response;
    }
    return (await caches.match(request)) || response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return caches.match("./index.html");
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (!isUsableResponse(request, response)) return response;
    await cacheResponse(request, response);
    return response;
  } catch {
    if (request.mode === "navigate") return caches.match("./index.html");
    return Response.error();
  }
}

async function cacheResponse(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

function isUsableResponse(request, response) {
  if (!response || !response.ok || response.type === "opaque") return false;
  const url = new URL(request.url);
  const contentType = response.headers.get("content-type") || "";
  if (/\.js$/i.test(url.pathname)) return /javascript|ecmascript/i.test(contentType);
  if (/\.css$/i.test(url.pathname)) return /text\/css/i.test(contentType);
  if (/\.webmanifest$/i.test(url.pathname)) return /json|manifest/i.test(contentType);
  if (/\.html?$/i.test(url.pathname) || request.mode === "navigate") return /text\/html/i.test(contentType);
  return true;
}

const CACHE_NAME = "vakha-studio-cache-v25";
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
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

const CACHE_PREFIX = "vakha-studio-cache-";
const CACHE_VERSION = "v54";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const CHILD_TEMPLATE_PREVIEWS = [
  "child-boy-pirate-captain", "child-boy-armored-tech-hero", "child-boy-medieval-knight",
  "child-boy-football-champion", "child-boy-chechen-dzhigit", "child-girl-fairytale-princess",
  "child-girl-long-haired-tower-princess", "child-girl-ice-queen",
  "child-girl-brave-highland-princess", "child-girl-eastern-princess-headscarf",
  "child-girl-magic-academy-hijab", "child-girl-horse-rider-headscarf",
  "child-girl-forest-fairy", "child-girl-ballerina-princess",
  "child-boy-santa-workshop", "child-girl-snowman-friend",
  "child-boy-rescue-puppy-team", "child-girl-fairy-tea-party",
  "child-boy-block-world-friend", "child-girl-electric-creature-friend",
  "child-boy-speed-fox-team", "child-girl-robot-friend",
  "child-boy-dragon-friend", "child-girl-superhero-team-up",
  "child-boy-chechen-mosque-dawn", "child-boy-chechen-stone-tower",
  "child-boy-chechen-wolf-guardian", "child-boy-chechen-horse-valley",
  "child-boy-chechen-fortress-sunset", "child-boy-chechen-waterfall",
  "child-boy-winter-cadet", "child-boy-rescue-unit", "child-boy-field-observer",
  "child-boy-rescue-helicopter-pilot", "child-boy-solar-cape-guardian",
  "child-boy-emerald-giant-friend", "child-boy-iron-tech-guardian",
  "child-boy-thunder-guardian", "child-boy-speed-hedgehog-friend",
  "child-boy-night-wing-guardian", "child-boy-ninja-turtle-friend",
  "child-boy-robot-lion-pilot", "child-boy-cosmic-ranger-friend",
  "child-boy-city-hero-shield", "child-girl-chechen-mosque-garden",
  "child-girl-chechen-stone-tower", "child-girl-chechen-wolf-companion",
  "child-girl-chechen-waterfall", "child-girl-sun-tower-princess",
  "child-girl-forest-apple-princess", "child-girl-highland-archer-princess",
  "child-girl-rose-princess-beast", "child-girl-glass-slipper-princess",
  "child-girl-coral-sea-princess", "child-girl-ocean-wayfinder",
  "child-girl-northern-crystal-queen", "child-girl-moon-warrior-princess",
  "child-girl-desert-palace-princess", "child-girl-star-cape-heroine",
  "child-girl-sun-shield-heroine", "child-girl-ladybird-heroine",
  "child-girl-bear-forest-friend", "child-girl-fashion-dream-friend",
  "child-girl-butterfly-fairy-mentor"
].map((id) => `./assets/templates/children/${id}/preview.webp`);
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./js/core/app.js",
  "./js/core/bootstrap.js",
  "./js/core/legacy-app.js",
  "./js/core/router.js",
  "./js/core/state.js",
  "./js/core/events.js",
  "./js/core/db.js",
  "./js/core/storage.js",
  "./js/core/constants.js",
  "./js/data/db.js",
  "./js/data/child-portrait-templates.js",
  "./js/data/child-portrait-a4-scenes.js",
  "./js/data/migrations.js",
  "./js/data/repositories/base-repository.js",
  "./js/data/repositories/projects-repository.js",
  "./js/data/repositories/classes-repository.js",
  "./js/data/repositories/students-repository.js",
  "./js/data/repositories/orders-repository.js",
  "./js/data/repositories/media-repository.js",
  "./js/data/repositories/operators-repository.js",
  "./js/data/repositories/albums-repository.js",
  "./js/data/repositories/catalog-repository.js",
  "./js/data/repositories/documents-repository.js",
  "./js/data/repositories/final-works-repository.js",
  "./js/data/repositories/settings-repository.js",
  "./js/data/repositories/operator-events-repository.js",
  "./js/data/repositories/templates-repository.js",
  "./js/features/transfer/index.js",
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
  "./js/services/archive-service.js",
  "./js/services/backup-service.js",
  "./js/services/conflict-service.js",
  "./js/services/export-filter-service.js",
  "./js/services/file-system-service.js",
  "./js/services/integrity-service.js",
  "./js/services/import-preflight-service.js",
  "./js/services/list-performance-service.js",
  "./js/services/object-url-service.js",
  "./js/services/photographer-analytics-service.js",
  "./js/services/transfer-merge-service.js",
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
  "./icons/icon-512.svg",
  ...CHILD_TEMPLATE_PREVIEWS
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      return fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => cached || cache.match("./index.html"));
    })
  );
});

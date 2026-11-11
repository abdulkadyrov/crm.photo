const CACHE_PREFIX = "vakha-studio-cache-";
const CACHE_VERSION = "v162";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const CHILD_TEMPLATE_PREVIEWS = [
  "child-boy-mma-tank", "child-boy-mma-shirt", "child-boy-boxing-tank", "child-boy-boxing-shirt",
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
  "child-boy-night-wing-guardian", "child-boy-hogwarts-harry", "child-boy-ninja-turtle-friend",
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
const KINDERGARTEN_AI_VIDEO_ASSETS = [
  "./assets/kindergarten-ai-video/children/boys/boy-01-age-3.jpg",
  "./assets/kindergarten-ai-video/children/boys/boy-02-age-3.jpg",
  "./assets/kindergarten-ai-video/children/boys/boy-03-age-4.jpg",
  "./assets/kindergarten-ai-video/children/boys/boy-04-age-4.jpg",
  "./assets/kindergarten-ai-video/children/boys/boy-05-age-5.jpg",
  "./assets/kindergarten-ai-video/children/boys/boy-06-age-5.jpg",
  "./assets/kindergarten-ai-video/children/boys/boy-07-age-6.jpg",
  "./assets/kindergarten-ai-video/children/boys/boy-08-age-6.jpg",
  "./assets/kindergarten-ai-video/children/boys/boy-09-age-3.jpg",
  "./assets/kindergarten-ai-video/children/boys/boy-10-age-6.jpg",
  "./assets/kindergarten-ai-video/children/girls/girl-01-age-3.jpg",
  "./assets/kindergarten-ai-video/children/girls/girl-02-age-3.jpg",
  "./assets/kindergarten-ai-video/children/girls/girl-03-age-4.jpg",
  "./assets/kindergarten-ai-video/children/girls/girl-04-age-4.jpg",
  "./assets/kindergarten-ai-video/children/girls/girl-05-age-5.jpg",
  "./assets/kindergarten-ai-video/children/girls/girl-06-age-5.jpg",
  "./assets/kindergarten-ai-video/children/girls/girl-07-age-6.jpg",
  "./assets/kindergarten-ai-video/children/girls/girl-08-age-6.jpg",
  "./assets/kindergarten-ai-video/children/girls/girl-09-age-3.jpg",
  "./assets/kindergarten-ai-video/children/girls/girl-10-age-5.jpg",
  "./assets/kindergarten-ai-video/previews/fairytale-princess.jpg",
  "./assets/kindergarten-ai-video/previews/original-superhero.jpg",
  "./assets/kindergarten-ai-video/previews/dragon-flight.jpg",
  "./assets/kindergarten-ai-video/previews/dragon-flight-15s-user.mp4"
];
const REFERENCE_POSE_ASSETS = [
  "./assets/reference-poses/boy-portrait.jpg",
  "./assets/reference-poses/boy-face.jpg",
  "./assets/reference-poses/boy-full-body.jpg",
  "./assets/reference-poses/boy-side.jpg",
  "./assets/reference-poses/boy-interview-desk.jpg",
  "./assets/reference-poses/girl-portrait.jpg",
  "./assets/reference-poses/girl-face.jpg",
  "./assets/reference-poses/girl-full-body.jpg",
  "./assets/reference-poses/girl-side.jpg",
  "./assets/reference-poses/girl-interview-desk.jpg"
];
const APP_SHELL = [
  "./js/services/sequence-navigation.js",
  "./js/services/sequence-navigation.js?v=162",
  "./js/services/card-summary.js",
  "./js/services/card-summary.js?v=162",
  "./js/services/blob-zip.js",
  "./js/services/student-directory.js",
  "./js/services/camera-options.js",
  "./js/services/camera-options.js?v=162",
  "./assets/ui/student-avatar.svg",
  "./js/services/school-demo.js",
  "./js/services/local-portraits.js",
  "./js/ui/local-portraits-panel.js",
  "./js/services/record-sync.js",
  "./js/services/sync-codec.js",
  "./vendor/noble-hashes/sha2.js",
  "./vendor/noble-hashes/_md.js",
  "./vendor/noble-hashes/_u64.js",
  "./vendor/noble-hashes/utils.js",
  "./",
  "./index.html",
  "./styles.css",
  "./styles.css?v=162",
  "./app.js",
  "./js/core/app.js",
  "./js/core/app.js?v=162",
  "./js/core/bootstrap.js",
  "./js/core/legacy-app.js",
  "./js/core/legacy-app.js?v=162",
  "./js/core/router.js",
  "./js/core/state.js",
  "./js/core/events.js",
  "./js/core/db.js",
  "./js/core/storage.js",
  "./js/core/constants.js",
  "./js/data/db.js",
  "./js/data/child-portrait-templates.js",
  "./js/data/child-portrait-a4-scenes.js",
  "./js/data/kindergarten-ai-video-services.js",
  "./js/data/game-photo-services.js",
  "./js/data/class-photo-service.js",
  "./js/services/class-roster.js",
  "./js/services/roster-photo-parser.js",
  "./js/services/roster-photo-crop.js",
  "./js/services/roster-photo-import.js",
  "./js/services/monitor-image.js",
  "./js/services/monitor-roster.js",
  "./js/services/transfer-asset-loader.js",
  "./js/services/catalog-themes.js",
  "./js/services/shooting-roster.js",
  "./js/ui/photo-camera.js",
  "./js/ui/photo-camera.js?v=162",
  "./js/services/camera-framing.js",
  "./js/services/teacher-broadcast.js",
  "./js/services/teacher-broadcast.js?v=134",
  "./js/services/class-links-transfer.js",
  "./assets/class-photo/class-photo-a4.png",
  "./assets/game-photo-services/free-fire.webp",
  "./assets/game-photo-services/pubg.webp",
  "./assets/game-photo-services/roblox-boy.webp",
  "./assets/game-photo-services/roblox-girl.webp",
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
  "./js/services/cloud-workspace.js",
  "./js/services/parent-orders.js",
  "./js/services/parent-order-model.js",
  "./js/services/dialog-return.js",
  "./js/services/qr-service.js",
  "./js/services/zip-service.js",
  "./js/services/media-service.js",
  "./js/services/print-service.js",
  "./js/services/pdf-service.js",
  "./js/services/import-service.js",
  "./js/services/export-service.js",
  "./js/services/album-service.js",
  "./js/services/finalwork-service.js",
  "./js/services/finalwork-service.js?v=89",
  "./js/services/archive-service.js",
  "./js/services/backup-service.js",
  "./js/services/conflict-service.js",
  "./js/services/export-filter-service.js",
  "./js/services/export-filter-service.js?v=134",
  "./js/services/file-system-service.js",
  "./js/services/integrity-service.js",
  "./js/services/import-preflight-service.js",
  "./js/services/list-performance-service.js",
  "./js/services/object-url-service.js",
  "./js/services/photographer-analytics-service.js",
  "./js/services/catalog-presentation-service.js",
  "./js/services/catalog-media-service.js",
  "./js/services/final-work-media-service.js",
  "./js/services/photo-pdf-service.js",
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
  "./vendor/zxing.min.js",
  "./js/services/barcode-reader.js",
  "./vendor/JsBarcode.code128.min.js",
  "./js/services/print-code-layout.js",
  "./js/services/portrait-identity-policy.js",
  "./manifest.webmanifest",
  "./icons/vakha-studio-logo.png",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  ...CHILD_TEMPLATE_PREVIEWS,
  ...KINDERGARTEN_AI_VIDEO_ASSETS,
  ...REFERENCE_POSE_ASSETS
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
  if (!url.pathname.startsWith('/api/')) {
    event.respondWith((async () => {
      const media = await caches.open('vakha-catalog-media-v1');
      const cached = await media.match(event.request.url);
      if (cached) {
        const range = event.request.headers.get('range');
        if (!range) return cached;
        const bytes = await cached.arrayBuffer();
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (match) {
          const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
          const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
          if (start > end || start >= bytes.byteLength) return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${bytes.byteLength}`}});
          return new Response(bytes.slice(start, end + 1), {status: 206, headers: {'Content-Type': cached.headers.get('Content-Type') || 'application/octet-stream', 'Content-Range': `bytes ${start}-${end}/${bytes.byteLength}`, 'Content-Length': String(end-start+1), 'Accept-Ranges': 'bytes'}});
        }
        return cached;
      }
      return fetch(event.request).then(async response => { if (url.origin === location.origin && response.ok && response.status !== 206 && !url.pathname.startsWith('/local-portraits/')) { const cache = await caches.open(CACHE_NAME); await cache.put(event.request, response.clone()); } return response; }).catch(async () => (await caches.match(event.request)) || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })());
    return;
  }
  if (url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/local-portraits/")) return;
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

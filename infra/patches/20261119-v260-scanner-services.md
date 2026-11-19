# Per-service confirmation for a shared child QR

Deployed on 2026-11-19 to CRM Photo as v260, on top of the v259 production
release. Production scanner integration predates committed main; this narrow
overlay follows the existing v249 patch convention and preserves unrelated drafts.
Apply the adjacent patch with `git apply --unidiff-zero` to the v259 release.

A shared child QR with multiple works now requires selecting the printed work.
Cards show result thumbnails, ordered service count and per-work review state.
Acceptance saves the exact work ID and image version in the existing device-local
scan session. Scanning the shared code again still allows choosing another work.
A repeated work is a duplicate and cannot increment photo counts without explicit
extra-copy confirmation. Old child-only events do not count as service reviews.
Summary rows name accepted works. Missing ordered results are shown explicitly.
No payment, printed or delivered statuses are changed by acceptance.

Validated using the published UI modules in Chromium and WebKit, at 319, 390,
and 768 CSS px, with three services, reload, duplicate and summary checks.
Physical camera was not tested. Nine focused model tests pass. The dirty source
checkout's full suite has 303/304 passing with the pre-existing 48-vs-160 QR test
failure; no QR size change is included here.

Rollback: /srv/crm-photo/releases/20261119-v259-originals-on-demand

Published SHA-256:

- index.html: 4427b452c5949267ea7d37e95a87ab41f6cb49ccdb3da5b54edf0770ecd1e3a9
- sw.js: 6333d47f4ea346af1afcd9677c96be3ee794939dd32877d1eedeaebda8c6de7d
- js/core/app.js: 8b7b5341aafd4f42ee3a3515482a6082532a56b6ab4a1e5a61bb4cb00452e965
- js/core/legacy-app.js: d4c6f35bd2b56e3884f3910fbd6682fed5f48d9adfb82ae6ab6bc18713646b7b
- js/ui/group-scan-panel.js: 0e0494522a89d5e90daf90b8ca73628052143cb4cf8b36ab3a8a82da9c728c7f
- js/services/group-scan.js: a617517720c6d91a18bad815fc6368b2d24907d1cc1ce70036084a645749de4c
- styles.css: 7249ecd3fb6d66464fe52bc29b1199dc0798f534773f92f6d5ec9c0f720b1141

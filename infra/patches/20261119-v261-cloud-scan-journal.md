# Shared cloud scan journal

Deployed on 2026-11-19 as v261 over v260. Frontend scanner wiring is still a
production overlay; this patch follows the existing v249/v260 convention without
including unrelated source-checkout changes. Install the committed scan-cloud.js
and scan_sessions.py modules, apply the adjacent patch with
`git apply --unidiff-zero` to v260, then gracefully reload the API workers.
The SQLite migration only adds tables and indexes; it does not alter old records.

Every event has an immutable UUID, child/work ID and image version. GET/POST
/api/v1/sync/scans enforce project membership; viewers cannot write. Requests are
transactional and retries are idempotent. Concurrent ordinary confirmations of the
same work/version/round become one accepted copy; extra copies require an explicit
choice. No payment, printed or delivered fields are changed.

The client persists an offline queue before advancing, imports active device-local
journals with a backup, and merges changes across group/all-group scanner views.
It retries on reconnect/focus and polls every eight seconds while CRM is open,
even if the scanner panel is closed. Authentication is bound to the originating
account. A cloud status distinguishes confirmed saves from pending local work.
New rounds use compare-and-swap reset operations. Late offline events stay in the
previous round; a delayed reset cannot erase a newer round from another device.
Deleted historical work references are retained as unaccepted history.

Validated with model tests and real API tests in two independent browser contexts
using Chromium and WebKit: service choice, cloud continuation, duplicate rejection,
offline reload/reconnect and reset propagation. Physical phones were not tested.
Existing local dirty-checkout QR minimum-size test remains unrelated (48 vs 160).

Frontend rollback: /srv/crm-photo/releases/20261119-v260-scanner-services
API/database backup: /opt/crm-photo/backups/cloud-scan-20261119-v261

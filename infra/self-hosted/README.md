# CRM Photo: independent hosting and later migration

## Actual state — 2026-11-01

DNS A `crm.khanzama.ru` -> `141.133.204.84` was created in Beget and verified via Google public DNS.
Safari is open on the Beget server panel. AR Photo HTTPS returned 200 before any server changes.
Direct SSH times out before authentication. Access was recovered through the existing WayYaam SSH host as a jump host; no SSH security settings were changed.
Frontend deployment completed at https://crm.khanzama.ru/. Safari loaded the app over valid HTTPS and the main screen was checked using Continue without profile. Shared backend work remains outstanding.

The current CRM is a browser-local IndexedDB application. Hosting its frontend does NOT provide a shared database, employee authentication or S3 uploads. Do not describe this package as multi-user online CRM.

An exact source snapshot (including pending barcode/print work) is outside the repository at
`/Users/abdulkadyrov2002/Documents/crm-photo-preserved-20261101/offline-source.tar.gz`,
with `uncommitted.patch` and `base-commit.txt`. This is NOT a backup of users' IndexedDB data.
Before moving real data, each browser/device holding unique records must make a full ZIP export via the existing application. Keep the original origin and backups until imports are verified.

## Frontend deployment

1. Run `npm run check` locally.
2. Run `python3 scripts/package-self-hosted.py /absolute/path/crm-photo.tar.gz`.
   Its adjacent JSON records the commit, actual file hashes (including uncommitted changes), archive hash and local storage mode.
3. Copy archive and activation script to the target server. Verify the JSON hash against the archive.
4. Run `bash activate-release.sh /path/crm-photo.tar.gz ARCHIVE_SHA256 RELEASE_ID`.
   Releases are isolated under `/srv/crm-photo/releases`; activation changes only `/srv/crm-photo/current`.
5. Run `bash install-caddy.sh Caddyfile.crm` on the server. This backs up the existing configuration, installs the isolated CRM fragment, adds one import, validates, and reloads Caddy. It restores configuration files on failure. Preserve every AR Photo host and handler.
6. Run `caddy validate --config /etc/caddy/Caddyfile` before `systemctl reload caddy`.
   If validation fails, restore the configuration before doing anything else. Do not restart AR Photo containers.
7. Verify public HTTPS and certificate validation, `/healthz`, module and media loads, camera permissions, ZIP export/import, service worker update, and AR Photo frontend/API smoke tests.
8. If any regression occurs, restore the previous Caddy configuration and reload after validation. To roll frontend code back, atomically repoint `current` to the saved previous release. Retain all releases until the new version is verified.

Only allowlisted public application assets are packaged. Backups, ZIP exports, environment files, tests, source Git metadata and work directories are excluded. No production media export is implicitly authorized by packaging.

## Shared online CRM — required implementation before team use

Use a separate backend service (loopback listener, bounded memory/CPU), database and database user owned by CRM. Do not use AR Photo's service role or tables. Keep secrets outside the frontend and repository. Browser requests should use same-origin `/api/v1/`, with the upstream configurable in the CRM host block.

Implement employee authentication, permissions and a migration-aware data layer first. Existing `getAll/put/del/clearStore` in `js/core/legacy-app.js` currently talk directly to IndexedDB; simply replacing the host cannot synchronize them. Online writes need server-side authorization, record versions and conflict responses; batch imports need resumable/idempotent jobs and verified counts. Preserve local-only mode for the old installation. Never silently fall back to local writes after a failed online save.

Keep local directory handles and device preferences on each device. Transfer Blob media separately and persist durable object identifiers in database records. Load remote media on demand, rather than downloading every file on each refresh. Use a private dedicated S3 bucket, limited server credentials, upload size limits, and authenticated temporary media URLs. Bucket creation may carry a provider charge and has not been performed.

Backups must cover the independent database AND media. Schedule encrypted backups outside the VPS and test restoration. Define retention and deletion behavior before enabling destructive operations.

## API to AR Photo / printed QR

The integration is planned, not implemented. Add a server-to-server adapter with configurable `AR_PHOTO_API_URL`, `AR_PHOTO_PUBLIC_URL` and a narrowly scoped server credential. Verify the actual AR Photo endpoints before selecting routes; do not invent working endpoints.

A CRM request uses a stable job identifier and idempotency key. AR Photo returns its project/object identifier, processing status and permanent public viewer URL. CRM stores that mapping and renders the public URL into the QR. Failed processing must support safe retries. Do not put credentials, S3 signed URLs or server IP addresses in printed QR codes. Changing CRM servers must not change AR Photo's public viewer URLs.

## Move to another server

Keep `crm.khanzama.ru` and the S3 bucket unchanged. Provision only CRM services on the new server. Transfer verified immutable release, database backup and separately delivered secrets; verify media access and a restored database before switching DNS.

For the final database cutover, pause writes on the old CRM, make and restore the final backup, then update only CRM's DNS A record. Keep the old CRM in maintenance mode during DNS propagation to prevent split writes. Verify employee sessions, record counts, media, imports and AR Photo integration. After new writes begin, rollback requires transferring those writes back; changing DNS alone is not a data-safe rollback.

AR Photo stays on its own host/service with unchanged public QR URLs. Moving CRM neither requires moving S3 nor modifying AR Photo's deployment.

## Verified deployment record

- Release: `release-20261101-6bb97f7-workspace` (includes preserved pending barcode/print changes).
- Archive SHA-256: `14edb157c5785f20833c2cbddf319e49e7519ff16890b34fe20adf42da83fa00`.
- All 504 deployed file hashes match the packaging manifest.
- All 90 existing automated tests passed before packaging; deployment scripts passed shell syntax checks.
- Caddy validated, CRM and AR Photo HTTPS returned 200, and the existing AR Photo configuration is preserved byte-for-byte with only a CRM import appended.
- Original AR Photo frontend SHA-256 remains `6fec010b6c7d70392172dee6ef9cfdf6b21339b0fd03c685294c55dffe9086ad`.
- Caddy rollback backup: `/opt/crm-photo/backups/caddy-20261101T174447Z/`.
- Browser inspection verified initial setup and main screen; real camera capture, production-data import, shared editing and S3 uploads were not validated.
- Original browser data was not exported or moved. New-domain browser data is independent.
- Beget panel showed paid-through 2026-11-03; no paid services were added.

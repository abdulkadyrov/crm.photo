# CRM Photo: accounts, offline work and project transfers

## Current deployment (2026-11-01)

CRM runs at https://crm.khanzama.ru independently of AR Photo. DNS points to
141.133.204.84. SSH uses the existing WayYaam host as a jump host; server security
settings were not weakened. The original offline source snapshot remains at
`/Users/abdulkadyrov2002/Documents/crm-photo-preserved-20261101/offline-source.tar.gz`.
This source archive is not a backup of browser IndexedDB data.

The frontend includes the existing print/QR/Code128 work through f2e1da5 and
e178a4e, including A4 comparison, transparent codes and clean original sources.
Admin layouts and existing print behavior are retained. Server controls are
additional; restricted roles hide finances and unsupported actions.

## Accounts and roles

Open **Сервер**. The owner creates employee accounts with a login, a password
(minimum 12 characters), role and explicitly assigned projects. The owner can
change passwords, role/assignments or disable an account. Changing an account
revokes its current server sessions. There is no public registration.

| Role | Project access | Server permissions | Money |
| --- | --- | --- | --- |
| admin | All | Create projects, manage accounts, send/receive full project/group versions | Visible |
| manager | Assigned | Send/receive project/group versions; review employee submissions | Hidden |
| photographer | Assigned | Receive projects; submit shots and paid/unpaid flags | Hidden |
| viewer | Assigned | Receive published versions only | Hidden |

Photographer submissions contain media and payment flags only; no project
structure, prices, catalog changes, documents or final-work replacements.
The server checks submitted students against previously published project
versions. Employee archives never include local operator PINs or global settings.
Finance keys are removed recursively from employee downloads and uploads.
Documents are omitted for staff because PDFs/images may contain invoices.
Finance fields already held by the owner are retained when importing staff data.

Accounts and access checks are server-side. Passwords are PBKDF2-SHA256 hashes
with random salts (600,000 iterations), never plaintext database fields.
Sessions use random tokens, stored hashed, and Secure/HttpOnly/SameSite=Strict
host-only cookies. Writes require the configured Origin. Login attempts are
limited. The first owner credential is delivered as a private local file; it
is not included in Git, frontend assets, or public archives.

## Offline and sending

Existing IndexedDB workflows remain. Each employee has a separate local database;
the administrator retains `school-photo-flow`. First login and receiving a project
require internet. After the application and project have loaded, they can be
used offline. Server account management always requires an online connection.

**Отправить на сервер** is available for a project or group. It freezes a ZIP
snapshot in a separate persistent IndexedDB queue. Upload starts immediately
when possible and retries on reconnect while the app is open, on the next app
startup, or via **Повторить отправку очереди**. Closing the app does not promise
background upload. Upload requests time out after five minutes; failed snapshots
remain queued and retries keep the same identifier. A lost success response does
not create duplicate versions. The limit is 1 GiB per archive; send groups for
large projects. Quota errors never delete original local data.

Server versions are immutable, with author/time/role recorded. Receiving uses the
existing import preview/conflict handling. There is no silent overwrite or live
record synchronization; the owner/manager reviews submissions. Previously
exported archives and old-origin browser data are not automatically migrated.

Revocation prevents new server reads/writes immediately. An offline device may
retain previously downloaded data and cached role until it reconnects: offline
access is not remote wipe. Use separate OS/browser profiles on shared devices.

## Runtime and storage

- Frontend releases: `/srv/crm-photo/releases`, atomic `current` symlink.
- API: `/opt/crm-photo/server`, dedicated `crm-photo` system user.
- Service: `crm-photo-api.service`; Gunicorn 26.2.0, loopback `127.0.0.1:8091`.
- Resource limits: 512 MiB RAM, 75% of one CPU; one worker/four threads.
- Private SQLite database and ZIP packages: `/var/lib/crm-photo` (0700).
- Caddy fragment: `/etc/caddy/crm-photo.caddy`; `/api/v1/*` routes only to CRM.
- AR Photo Caddy host blocks, containers, database and S3 are independent.

Current files are stored privately on the VPS, not in S3. A dedicated CRM bucket
has not been provisioned. Migrating these packages to S3 remains separate work;
no AR Photo storage keys or service-role credentials are reused.

## Deployment and rollback

1. Run `npm run check` and `python3 -m unittest discover -s tests/server -v`.
2. Package public files with `scripts/package-self-hosted.py`; the adjacent JSON
   records actual file hashes. Exclude backups, secrets, output/, tmp/, .DS_Store.
3. Create a new release directory; copy public files and verify every manifest
   hash. `activate-release.sh` accepts a full archive/hash and atomically switches
   only CRM's symlink. Keep prior releases available.
4. Install server code and `server/requirements.txt` in a dedicated virtualenv;
   copy the CRM systemd units and Caddy fragment. `install-caddy.sh` backs up,
   validates and reloads Caddy while retaining every AR Photo host block.
5. Bootstrap an owner once with `server/bootstrap.py PRIVATE_OUTPUT_FILE` running
   as the CRM user. It refuses to replace an existing administrator. Deliver the
   0600 credential file privately; change password from the application.
6. Check HTTPS, login/access rejection, archive transfer and AR Photo health.

Rollback frontend by atomically switching to the prior symlink target. Restore
CRM's previous Caddy fragment after validation if necessary. Database/package
rollback requires a verified backup and accounting for new writes; reverting
DNS or code is not a data rollback.

## Backups and moving servers

`crm-photo-backup.timer` runs daily at 04:20 server time (UTC). `server/backup.py`
uses SQLite's online backup API and includes every immutable package referenced
by that consistent snapshot. It retains seven completed private archives under
`/var/lib/crm-photo/backups`. Copies on this VPS alone do not protect against loss
of the VPS; copy them to independent storage. Initial verified backup is also
copied to the owner's Mac after deployment.

For relocation: retain `crm.khanzama.ru`; install the CRM runtime on the new VPS,
stop writes on the old CRM for final cutover, create a final backup, restore
`crm.sqlite3` and `packages/` into the new private data directory with CRM-user
ownership, verify accounts/record counts/media, then switch only CRM's DNS.
Keep the old CRM read-only during DNS propagation. AR Photo remains on its
current host and its printed QR links remain unchanged.

Future AR integration must use a server-to-server adapter, narrowly scoped
credentials, idempotent job IDs and permanent AR Photo viewer URLs. It is not
implemented by this release. Never print server IPs or temporary signed S3 URLs.

## Verification

95 JS tests and 7 server tests passed: existing print/scanner tests, offline
account/database isolation, API cache exclusion, ACLs, finance removal, payment
flags, archive/media preservation, idempotency, account revocation and CSRF.
All 201 offline precache paths exist in the release source.

Safari checks used temporary synthetic accounts/data: admin login and account
form; photographer login, isolated local database, assigned-project download,
import preview, no monetary amount in the student card, paid/unpaid action,
group upload and server confirmation. Server ZIP inspection confirmed the
browser-submitted payment flag. Browser Back from the Server dialog restored
the same student card and payment state. Synthetic server users/data were removed.
Physical phone-camera and real airplane-mode tests remain device checks.

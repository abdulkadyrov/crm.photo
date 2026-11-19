# Select printed services on a phone and review them on Mac

Production overlay v262 over v261. Install the committed selective-print.js,
selective-print-panel.js and print_selection.py modules, apply the adjacent patch
with `git apply --unidiff-zero` to the v261 source, then gracefully reload the API.
This follows the v249/v260/v261 overlay convention and excludes unrelated drafts.

Project/group menus and the normal project print picker now include selective
printing. Mac shows a pairing QR/link. An authenticated phone can search names,
scan QR/Code128 with its own camera, upload a code photo, or enter a code manually.
Shared child codes require choosing the precise service. A repeated scan does not
increase copies; each selected work defaults to one copy with an explicit editor.
Both devices show the same durable selection. The session link requires the same
CRM account and current project access; it conveys no anonymous access. Sessions
expire after seven days. Mutations are transactional and idempotent.

Selection is queued locally before showing success and restored after reload.
Only the chosen current files are hydrated and hash-verified for printing; changed
or correction work is blocked. The existing A4 cache, ordering and PDF preview are
preserved. Explicit selections allow reprinting already printed services and use
the selection's copy counts. Browser/mobile Back from print review returns to the
same selection tab, search and scroll. Late preparations cannot reopen a closed
selection. No physical print jobs or payment/print/delivery status updates occur.

The camera picker lists video devices exposed by the browser. An iPhone exposed
by Apple's Continuity Camera can be chosen there; the independent QR-link route
uses the phone browser directly and does not require a video stream to the Mac.
Apple reference: https://support.apple.com/ru-ru/102546

Validated with real API fixtures in Chromium/WebKit, two isolated authenticated
contexts, a decoded pairing QR, fake camera capture in Chromium, name search,
per-service selection, duplicates, offline reload/reconnect, exact two-page PDF
and Back restoration at 319px. Physical iPhone/Mac camera hardware was not tested.
Rollback frontend: /srv/crm-photo/releases/20261119-v261-cloud-scan-journal
API and database backup: /opt/crm-photo/backups/selective-print-20261119-v262

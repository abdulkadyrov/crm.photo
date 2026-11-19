# Phone camera with a viewfinder (v264)

Choosing iPhone as a macOS Continuity Camera leaves its screen locked, so the operator cannot aim using the phone display. The new “Камера телефона” control in selective printing instead pairs the public `/camera/` page with an authenticated Mac session using an eight digit, single use code. The phone shows its local rear camera preview and relays bounded JPEG frames; the Mac decodes QR codes and keeps the existing per-service selection flow. The phone never receives CRM credentials, child names, photographs or print-selection access.

Codes expire after five minutes; an idle host session expires after thirty minutes. Frames use a private latest-frame file, not object storage. Stop revokes the sender token and deletes the frame. Upload validation requires Pillow. Additive SQLite tables are initialized by the existing backend startup.

The adjacent production overlay applies to v263. Deploy the new standalone modules and camera page alongside it; the overlay preserves live print cache and image-delivery behavior absent from the older repository baseline. Back up the API and SQLite first; publish a new immutable frontend release, then switch its symlink. Rollback uses the previous frontend symlink and backed-up API files; additive tables may remain.

Validation: 295 JavaScript tests; 91 server tests (two optional skips). Local package tests use a 64 MiB cap because the Mac has less than the existing 3 GiB free-space guard. CI uses the normal production cap. Browser verification uses real pixel capture, JPEG transport and QR decoding with a synthetic camera; physical iPhone camera behavior still requires device verification.

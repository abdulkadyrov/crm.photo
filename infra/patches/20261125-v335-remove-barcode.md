# Remove Code 128 output (v336)

Apply the companion patch to deployed v334. Printing and child cards now generate QR only; the code type switch and barcode width/height fields are removed. Saved barcode preferences normalize to QR without changing the enabled setting. Old barcode decoding remains available for previously printed sheets and clean-source recovery. JsBarcode encoder no longer loads.

Prepared A4 signatures change and trigger the existing cache refresh. Original portrait records are preserved. Other dirty workspace changes are excluded from this release patch.

Validation: three behavioral regression tests pass against both local and staged production source; staged JavaScript syntax passes. Run `QR_ONLY_SOURCE=tmp/remove-barcode-20261125/stage/js/core/legacy-app.js node --test infra/patches/20261125-v335-qr-only.test.mjs`. Backup: /var/lib/crm-photo/audits/remove-barcode-20261125.

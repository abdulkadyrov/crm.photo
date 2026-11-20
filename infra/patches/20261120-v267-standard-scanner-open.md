# Restore the standard QR scanner (v267)

Opening QR from the bottom navigation or Open scanner failed with ReferenceError: cloudScanJournal is not defined. The production overlay had inserted that function inside persistStudentMedia's per-student lock callback, outside the scanner's scope. Move the complete journal function to module scope before persistStudentMedia. Its startup migration and scanner callers can then resolve it without first saving a photograph.

The release repair script guards expected anchors and preserves the media-lock callback. The adjacent patch targets v266; publish the four staged loader/cache/frontend files as an immutable v267 release and switch its symlink. No API, database, photo or scan-journal mutation is required for this repair. Root checkout contains other work; only the isolated release helper, regression tests and production overlay are committed.

Regression tests reproduce the old inaccessible function, verify the scanner can read the journal before any capture, and ensure original photo persistence still returns its file. Verify the actual deployed bottom QR navigation, manual code form, cloud status and close/reopen path; preserve the user's existing tab and journal.

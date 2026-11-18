# v249 scanner and print comparison overlay

Production v247 contains scanner, fulfillment and comment functionality not yet
published in main. The adjacent patch applies narrowly to that production source;
it must not replace the production app with main's older legacy-app.js.

Baseline hashes (SHA-256):
- js/core/legacy-app.js: 27c265e3a6cd4367ae354b4dd40bb8c5c2d193a417ff67761c7e0a02ef9500c2
- js/ui/group-scan-panel.js: 40cdfe45b3187c4512dda297d13e75afc0ac4322913e68f201b515e09a5176de

Install js/ui/scan-photo-viewer.js, apply the patch, bump shell imports and SW to
v249, and precache the viewer module. Preserve the preceding release for rollback.

Single photo: pinch, wheel, double click or +/-; pan by dragging.
Comparison: outline each head separately; their centers and sizes become the same,
then zoom and pan together. Head regions are temporary, no biometric data is saved.
Closing or browser Back leaves scanner/print selection and scroll mounted.

Scanner comments now save to students.staffComments with the work title before
advancing, including repeated scans. Save failures leave the current scan and text
in place. Existing scanner notes on other devices remain in those local journals;
they are not retroactively claimed as saved to the server.

The scanner original selector can choose any source photo in the child media.
Changing that selection retains the unsaved scan comment; no source record is changed.

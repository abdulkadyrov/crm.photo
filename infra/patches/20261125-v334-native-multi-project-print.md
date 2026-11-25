# Native cross-project print selection (v334)

Applies the attached patch to the deployed v333 static files; add js/services/multi-project-print.js alongside it. Original dirty workspace changes are preserved. No server authorization or database schema changes.

Project actions now include “Печать из всех проектов”. A combined selection wraps existing per-project authenticated selections. The normal print review receives all selected works and originals, then uses the existing A4 pipeline. Each blob request retains its project scope. Combined links support printReview=1 to open review controls on the current device.

Validation: 7 targeted selection tests pass, both local and staged legacy-app syntax checks pass, design detector reports no findings. Live native review loaded and selected exactly 7/7 intended works with paired original/A4 previews. Printing was not started. Full dirty-workspace check: 319 pass, one pre-existing QR minimum-size test fails (48 versus expected 160); the QR layout source and test were already modified before this task and are not included here.

Deployment backup: /var/lib/crm-photo/audits/native-multi-print-20261125. Existing finalWorks correction for the already-retouched Yakub was resolved through sync/push, preserving its previous record in that backup.

# Tap focus and focus before still capture (v265)

Photo capture defaults to requesting camera focus and allowing 500 ms for it to settle before freezing the preview and opening review. The existing immediate mode remains available by turning off «Фокус перед снимком». Save/retake, resolution mode, zoom and torch remain available. Preview requests 30 fps, with up to 60 fps allowed when the device supplies it.

A shared controller maps taps through cover/contain crop coordinates into normalized sensor coordinates. It submits pointsOfInterest only when the camera and browser expose the necessary focus controls, preserves previous resolution/zoom/torch constraints and does not claim a confirmed focus lock: the web API has no portable focus-lock event. Unsupported phones show an automatic-focus message. A yellow marker shows the requested location, not confirmation of optical sharpness.

The controller is bound to photo capture, phone camera sender, selective print scanner and the production group QR scanner. The latter lives only in the production overlay, matching the existing release convention. The adjacent overlay applies to v264; deploy the new camera-focus.js with it, then switch the immutable frontend release symlink. No backend/database changes.

Verification: 300 tests pass in clean main. Camera browser fixtures in Chromium and WebKit cover point request, delay before actual pixel freeze, paused review, saving and resuming. Phone relay fixtures additionally verify unsupported-focus feedback and the existing QR/service-selection flow. Synthetic cameras do not establish physical iPhone optical focus quality. The older dirty workspace has an unrelated pre-existing QR minimum-size assertion failure (48 vs 160); it is excluded from this release.

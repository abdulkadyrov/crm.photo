# On-demand camera originals, production v259

A newly synced device could receive students and final-result metadata long before its global media download reached that child. Opening a child now fetches its photo index and hydrates missing camera-original records directly with two concurrent requests, verifies hashes through the existing blob loader and caches the actual media records without creating outgoing edits. Progress and a retry action are shown in Originals. Failed files do not block other originals. Pending local changes/deletions and concurrent hydrated records are preserved.

Scoped production base: `20261119-v257-private-image-previews`. Deployment: `20261119-v259-originals-on-demand`. This archive preserves the task delta separately from unrelated uncommitted features. Includes source from the existing private-preview release; no original photo bytes changed.

Validation: syntax checks passed; three fake-IndexedDB cold-device tests passed (initial empty media store, persisted byte equality, shared-blob coalescing/cache reuse, no outgoing edits; partial failure and retry; pending deletion protection). Live browser reported 8 of 8 original images decoded and opened the camera-photo gallery at 1/8 without console errors. Physical new phone was not directly tested.

Offline opening retains local originals and does not launch a network load.

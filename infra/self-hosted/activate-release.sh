#!/usr/bin/env bash
# Run on the destination server after copying the reviewed public archive.
set -euo pipefail
archive=${1:?Usage: activate-release.sh ARCHIVE SHA256 RELEASE_ID}
checksum=${2:?SHA256 required}
release=${3:?Release ID required}
[[ "$release" =~ ^[a-zA-Z0-9_-]+$ ]] || { echo 'Invalid release ID' >&2; exit 1; }
printf '%s  %s\n' "$checksum" "$archive" | sha256sum --check --status
base=/srv/crm-photo
mkdir -p "$base/releases"
target="$base/releases/$release"
[[ ! -e "$target" ]] || { echo 'Release already exists' >&2; exit 1; }
# Validate paths before extraction, including archive links.
python3 - "$archive" <<'PY'
import sys, tarfile
from pathlib import PurePosixPath
allowed = {'index.html','app.js','styles.css','sw.js','manifest.webmanifest','js','icons','assets','vendor'}
with tarfile.open(sys.argv[1]) as archive:
    for entry in archive:
        path = PurePosixPath(entry.name)
        if path.is_absolute() or '..' in path.parts or not path.parts or path.parts[0] not in allowed or not entry.isfile():
            raise SystemExit('Unexpected archive member')
PY
mkdir "$target"
tar --no-same-owner -xzf "$archive" -C "$target"
find "$target" -type d -exec chmod 755 {} +
find "$target" -type f -exec chmod 644 {} +
test -s "$target/index.html"
previous=$(readlink "$base/current" || true)
ln -s "$target" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
printf 'Activated %s\nPrevious target: %s\n' "$target" "$previous"

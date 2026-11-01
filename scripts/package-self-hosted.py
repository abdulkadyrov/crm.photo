#!/usr/bin/env python3
"""Package only public application files, never workspace backups or credentials."""
import hashlib
import json
import subprocess
import sys
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ('index.html', 'app.js', 'styles.css', 'sw.js', 'manifest.webmanifest', 'js', 'icons', 'assets', 'vendor')

def package(destination):
    destination = Path(destination).resolve()
    destination.parent.mkdir(parents=True, exist_ok=True)
    manifest = {'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'storageMode': 'browser-local', 'files': {}}
    with tarfile.open(destination, 'w:gz') as archive:
        for entry in PUBLIC:
            source = ROOT / entry
            for path in sorted(source.rglob('*')) if source.is_dir() else [source]:
                if path.is_symlink():
                    raise ValueError(f'Symlinks forbidden: {path}')
                if not path.is_file() or any(part.startswith('.') for part in path.relative_to(ROOT).parts):
                    continue
                name = path.relative_to(ROOT).as_posix()
                manifest['files'][name] = hashlib.sha256(path.read_bytes()).hexdigest()
                archive.add(path, arcname=name, recursive=False)
    manifest['archiveSha256'] = hashlib.sha256(destination.read_bytes()).hexdigest()
    destination.with_suffix(destination.suffix + '.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{destination}: {len(manifest["files"])} public files; browser-local storage')

if __name__ == '__main__':
    package(sys.argv[1])

"""Package a portrait acceptance build; keep full runtime and catalog previews."""
import argparse
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
allowed_dirs = {'js', 'vendor', 'icons', 'assets'}
files = [root / name for name in ['index.html','styles.css','app.js','sw.js','manifest.webmanifest','LOCAL-PORTRAITS.md'] if (root/name).exists()]
for folder in allowed_dirs:
    for path in (root/folder).rglob('*'):
        if not path.is_file() or path.name.startswith('.'):
            continue
        if folder == 'assets':
            is_pirate = 'child-boy-pirate-captain' in path.parts
            if path.name in ('master.png','master.jpg','face-mask.png') and not is_pirate:
                continue
            if path.suffix.lower() in ('.mp4','.mov','.zip') and path.name != 'dragon-flight-15s-user.mp4':
                continue
        files.append(path)
files.extend(root/'scripts/local-portraits'/name for name in ['server.py','start-local.cmd'])
files.append(root/'test-fixtures/local-portraits-acceptance.zip')
args.output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for path in files:
        archive.write(path,'CRMPhoto/'+str(path.relative_to(root)))
print(f'{args.output}: {args.output.stat().st_size:,} bytes, {len(files)} files')

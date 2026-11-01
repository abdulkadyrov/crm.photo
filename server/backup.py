"""Consistent SQLite backup plus immutable private archives; restore into an empty data dir."""
import os,sqlite3,sys,tarfile,tempfile,time
from pathlib import Path
root=Path(os.environ.get('CRM_DATA_DIR','/var/lib/crm-photo'))
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True,mode=0o700)
with tempfile.TemporaryDirectory() as temp:
    target=Path(temp)/'crm.sqlite3'
    with sqlite3.connect(root/'crm.sqlite3') as src, sqlite3.connect(target) as dst: src.backup(dst)
    with sqlite3.connect(target) as db: ids=[r[0] for r in db.execute('SELECT id FROM packages')]
    path=out/('crm-'+time.strftime('%Y%m%dT%H%M%SZ',time.gmtime())+'.tar.gz')
    with tarfile.open(path,'x:gz') as archive:
        archive.add(target,arcname='crm.sqlite3')
        if (root/'parent-media').exists(): archive.add(root/'parent-media',arcname='parent-media')
        for id in ids: archive.add(root/'packages'/f'{id}.zip',arcname=f'packages/{id}.zip')
    path.chmod(0o600)
    # Retain seven completed daily snapshots. Never rotate the only verified backup.
    backups=sorted(out.glob('crm-????????T??????Z.tar.gz'),key=lambda p:p.name,reverse=True)
    for old in backups[7:]: old.unlink()
    print(path)

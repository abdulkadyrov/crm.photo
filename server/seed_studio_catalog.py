"""Explicit additive catalog seed. Default validates only; --apply requires existing CRM DB."""
import argparse,json,os,sqlite3,time,zipfile
from pathlib import Path
from types import SimpleNamespace

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--archive',required=True);parser.add_argument('--actor-login');parser.add_argument('--apply',action='store_true');args=parser.parse_args()
 path=Path(args.archive)
 if not args.apply:
  with zipfile.ZipFile(path) as archive:
   services=json.loads(archive.read('catalog.json'))['services'];print(json.dumps({'dryRun':True,'services':len(services),'uniqueIds':len({item['id'] for item in services})}))
  return
 root=Path(os.environ.get('CRM_DATA_DIR','/var/lib/crm-photo'))
 # Do not provision a database or account as a side effect of a catalog seed.
 if not (root/'crm.sqlite3').exists() and not (root/'crm.sqlite').exists() and not (root/'crm.db').exists():raise SystemExit('Existing CRM database required; verify CRM_DATA_DIR')
 if not args.actor_login:raise SystemExit('--actor-login required with --apply')
 import app,studio_api,studio_imports
 with app.db() as c:
  studio_api.initialize(c);actor=c.execute("SELECT * FROM users WHERE login=? AND role='admin' AND active=1",(args.actor_login,)).fetchone()
  if not actor:raise SystemExit('Active administrator not found')
  def save(store,value,scope):
   encoded=json.dumps(value,ensure_ascii=False);seq=c.execute('INSERT INTO sync_changes(store,id,scope,data,actor,at) VALUES(?,?,?,?,?,?)',(store,value['id'],scope,encoded,actor['id'],time.time())).lastrowid
   c.execute('INSERT INTO sync_records VALUES(?,?,?,?,?)',(store,value['id'],scope,encoded,seq))
  added=studio_imports.seed_catalog_zip(path,c,actor,SimpleNamespace(**vars(app)),save)
  print(json.dumps({'added':added,'mode':'absent-only','existingPricesPreserved':True}))
if __name__=='__main__':main()

"""Run as a separate worker, never as a browser/background-PWA promise."""
import argparse,time,logging
import app, ar_jobs
from ar_adapter import HttpARAdapter
from private_storage import PrivateS3, mirror_one

def run_once():
 storage=PrivateS3()
 mirror_one(app,storage,time.time())
 def asset_url(scope,digest,mime):
  with app.db() as c:
   row=c.execute("SELECT state FROM storage_mirror WHERE scope=? AND digest=?",(scope,digest)).fetchone()
   if not row or row['state']!='ready':raise RuntimeError('Private asset not mirrored yet')
  return storage.signed_get(scope,digest,mime=mime)
 return ar_jobs.run_one(app,HttpARAdapter(asset_url))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--once',action='store_true');args=parser.parse_args();app.initialize()
 while True:
  try:run_once()
  except Exception:logging.error('Integration worker unavailable; retained pending jobs, retrying')
  if args.once:break
  time.sleep(5)

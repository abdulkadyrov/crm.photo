"""Private incremental S3 backups. Only SQLite is staged locally; COMPLETE is last.
Restore: python backup_s3.py --restore <snapshot-id> --destination <empty-directory>
No local originals or existing backups are deleted by the scheduled backup.
"""
import argparse,contextlib,fcntl,hashlib,json,os,re,sqlite3,tempfile,time,uuid
from pathlib import Path,PurePosixPath
from private_storage import PrivateS3
PREFIX='crm-backups/v1/'

def digest_file(path):
 h=hashlib.sha256()
 with Path(path).open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()

def safe_path(value):
 p=PurePosixPath(value)
 if p.is_absolute() or '..' in p.parts or not p.parts or '\\' in value:raise ValueError('Unsafe backup path')
 return str(p)

class Backup:
 def __init__(self,storage):self.s=storage;self.c=storage.client;self.bucket=storage.bucket;self.checked=set()
 def head(self,key):
  try:return self.c.head_object(Bucket=self.bucket,Key=key)
  except Exception as e:
   if str(getattr(e,'response',{}).get('Error',{}).get('Code')) in ('404','NoSuchKey','NotFound'):return None
   raise
 def verify(self,key,digest,size):
  response=self.c.get_object(Bucket=self.bucket,Key=key);h=hashlib.sha256();count=0
  with contextlib.closing(response['Body']) as body:
   for block in iter(lambda:body.read(1024*1024),b''):h.update(block);count+=len(block)
  if count!=size or h.hexdigest()!=digest:raise RuntimeError('S3 backup readback mismatch')
 def pool(self,digest,size,path=None,source_key=None):
  if not re.fullmatch('[a-f0-9]{64}',digest):raise ValueError('Invalid digest')
  key=PREFIX+'pool/'+digest
  if key in self.checked:return key
  head=self.head(key)
  if head and head['ContentLength']==size and head.get('Metadata',{}).get('sha256')==digest and head.get('Metadata',{}).get('verified')=='sha256-readback-v1':
   self.checked.add(key);return key
  if path:
   with Path(path).open('rb') as f:self.c.upload_fileobj(f,self.bucket,key,ExtraArgs={'Metadata':{'sha256':digest}})
  elif source_key:self.c.copy_object(Bucket=self.bucket,Key=key,CopySource={'Bucket':self.bucket,'Key':source_key},MetadataDirective='REPLACE',Metadata={'sha256':digest})
  else:raise RuntimeError('Missing backup source')
  self.verify(key,digest,size)
  self.c.copy_object(Bucket=self.bucket,Key=key,CopySource={'Bucket':self.bucket,'Key':key},MetadataDirective='REPLACE',Metadata={'sha256':digest,'verified':'sha256-readback-v1'})
  self.checked.add(key);return key
 def put_json(self,key,value):
  data=json.dumps(value,ensure_ascii=False,sort_keys=True).encode();self.c.put_object(Bucket=self.bucket,Key=key,Body=data,ContentType='application/json');return hashlib.sha256(data).hexdigest()
 def read_json(self,key):
  r=self.c.get_object(Bucket=self.bucket,Key=key)
  with contextlib.closing(r['Body']) as body:return json.loads(body.read())
 def create(self,root):
  root=Path(root);snapshot=time.strftime('%Y%m%dT%H%M%SZ',time.gmtime())+'-'+uuid.uuid4().hex[:8];entries={}
  with tempfile.TemporaryDirectory(prefix='crm-s3-db-') as temp:
   db=Path(temp)/'crm.sqlite3'
   with sqlite3.connect('file:'+str(root/'crm.sqlite3')+'?mode=ro',uri=True) as src,sqlite3.connect(db) as dst:src.backup(dst)
   with sqlite3.connect(db) as c:
    if c.execute('PRAGMA quick_check').fetchone()[0]!='ok':raise RuntimeError('SQLite integrity check failed')
    blobs=list(c.execute('SELECT scope,digest,size FROM sync_blobs'))
   def add(relative,path=None,digest=None,size=None,source=None):
    if path:digest=digest or digest_file(path);size=Path(path).stat().st_size
    key=self.pool(digest,size,path,source);entries[safe_path(relative)]={'key':key,'sha256':digest,'size':size}
   add('crm.sqlite3',db)
   for scope,digest,size in blobs:
    local=root/'sync-blobs'/digest
    if local.is_file():
     if digest_file(local)!=digest:raise RuntimeError('Local blob hash mismatch')
     add('sync-blobs/'+digest,local,digest)
    else:add('sync-blobs/'+digest,digest=digest,size=size,source=self.s.key(scope,digest))
   for folder in ('sync-blobs','parent-media','packages'):
    for p in sorted((root/folder).rglob('*')):
     if p.is_symlink():raise RuntimeError('Symlink in backup input')
     if p.is_file() and str(p.relative_to(root)) not in entries:add(str(p.relative_to(root)),p)
   manifest={'version':1,'snapshot':snapshot,'createdAt':time.time(),'files':entries}
   base=PREFIX+'snapshots/'+snapshot+'/'
   digest=self.put_json(base+'manifest.json',manifest)
   # Restore database bytes independently from the source; check SQLite before completion.
   restored=Path(temp)/'restored.sqlite3';item=entries['crm.sqlite3']
   self.c.download_file(self.bucket,item['key'],str(restored))
   if digest_file(restored)!=item['sha256']:raise RuntimeError('Restored database hash mismatch')
   with sqlite3.connect(restored) as c:
    if c.execute('PRAGMA quick_check').fetchone()[0]!='ok':raise RuntimeError('Restored SQLite integrity failed')
   if self.read_json(base+'manifest.json')!=manifest:raise RuntimeError('Manifest readback mismatch')
   self.put_json(base+'COMPLETE.json',{'manifestSha256':digest,'files':len(entries),'databaseRestore':'ok'})
   print(json.dumps({'snapshot':snapshot,'files':len(entries),'uniqueObjects':len(self.checked),'databaseRestore':'ok','complete':True}),flush=True)
   return snapshot
 def restore(self,snapshot,destination):
  if not re.fullmatch('[A-Za-z0-9_-]+',snapshot):raise ValueError('Invalid snapshot')
  base=PREFIX+'snapshots/'+snapshot+'/';complete=self.read_json(base+'COMPLETE.json');manifest=self.read_json(base+'manifest.json')
  if hashlib.sha256(json.dumps(manifest,ensure_ascii=False,sort_keys=True).encode()).hexdigest()!=complete['manifestSha256']:raise RuntimeError('Manifest checksum mismatch')
  destination=Path(destination)
  if destination.exists() and any(destination.iterdir()):raise ValueError('Restore requires an empty destination')
  destination.mkdir(parents=True,exist_ok=True,mode=0o700)
  for relative,item in manifest['files'].items():
   p=destination/safe_path(relative);p.parent.mkdir(parents=True,exist_ok=True);partial=p.with_name(p.name+'.partial')
   if item['key']!=PREFIX+'pool/'+item['sha256']:raise ValueError('Invalid pool key')
   self.c.download_file(self.bucket,item['key'],str(partial))
   if digest_file(partial)!=item['sha256'] or partial.stat().st_size!=item['size']:raise RuntimeError('Restore hash mismatch')
   partial.chmod(0o600);partial.rename(p)
  with sqlite3.connect(destination/'crm.sqlite3') as c:
   if c.execute('PRAGMA quick_check').fetchone()[0]!='ok':raise RuntimeError('Restored database invalid')
  return manifest

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--root',default=os.environ.get('CRM_DATA_DIR','/var/lib/crm-photo'));parser.add_argument('--restore');parser.add_argument('--destination');args=parser.parse_args()
 os.umask(0o077)
 with open(Path(args.root)/'.s3-backup.lock','a') as lock:
  fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  backup=Backup(PrivateS3())
  if args.restore:
   if not args.destination:parser.error('--destination required')
   backup.restore(args.restore,args.destination)
  else:backup.create(args.root)
if __name__=='__main__':main()

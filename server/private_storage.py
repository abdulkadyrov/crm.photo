"""Optional private S3 mirror; filesystem remains durable during provider outages.
No keys, bucket credentials or S3 client are exposed to the browser.
"""
import hashlib, os, re
from pathlib import Path

class PrivateS3:
 def __init__(self, client=None):
  self.bucket=os.environ.get('CRM_S3_BUCKET','')
  if not self.bucket:raise RuntimeError('CRM_S3_BUCKET is required')
  if client is None:
   import boto3
   from botocore.config import Config
   endpoint=os.environ.get('CRM_S3_ENDPOINT','')
   if not endpoint.startswith('https://'):raise RuntimeError('Private S3 requires HTTPS')
   client=boto3.client('s3',endpoint_url=endpoint,region_name=os.environ.get('CRM_S3_REGION','ru-3'),config=Config(signature_version='s3v4',s3={'addressing_style':'virtual'}))
  self.client=client
 def key(self,scope,digest):
  if not re.fullmatch('[A-Za-z0-9_-]{1,200}',scope) or not re.fullmatch('[a-f0-9]{64}',digest):raise ValueError('Invalid asset key')
  return 'crm/v1/'+scope+'/'+digest
 def upload(self,scope,digest,path):
  # Content addressing is idempotent; never request public-read ACL.
  key=self.key(scope,digest)
  with Path(path).open('rb') as stream:
   self.client.upload_fileobj(stream,self.bucket,key,ExtraArgs={'Metadata':{'sha256':digest}})
  return key
 def open(self,scope,digest,size):
  result=self.client.get_object(Bucket=self.bucket,Key=self.key(scope,digest))
  body=result['Body']
  if result.get('ContentLength')!=size or result.get('Metadata',{}).get('sha256')!=digest:
   body.close();raise RuntimeError('Private asset metadata mismatch')
  return body
 def signed_get(self,scope,digest,expires=300,mime=None):
  params={'Bucket':self.bucket,'Key':self.key(scope,digest)}
  if mime is not None:
   if mime not in ('image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm'):raise ValueError('Unsupported AR MIME')
   # Signed response override also fixes objects mirrored before MIME was available.
   params['ResponseContentType']=mime
  return self.client.generate_presigned_url('get_object',Params=params,ExpiresIn=min(900,max(60,expires)))

def mirror_one(a, storage, now):
 """Replicable from the local spool; errors cannot delete or acknowledge local data."""
 with a.db() as c:
  c.execute('CREATE TABLE IF NOT EXISTS storage_mirror(scope TEXT,digest TEXT,state TEXT,attempts INTEGER DEFAULT 0,next_at REAL DEFAULT 0,PRIMARY KEY(scope,digest))')
  c.execute("INSERT OR IGNORE INTO storage_mirror(scope,digest,state) SELECT scope,digest,'queued' FROM sync_blobs")
  row=c.execute("SELECT * FROM storage_mirror WHERE state!='ready' AND next_at<=? LIMIT 1",(now,)).fetchone()
  if not row:return False
  row=dict(row)
 try:
  storage.upload(row['scope'],row['digest'],a.ROOT/'sync-blobs'/row['digest']);state='ready'
 except Exception:state='retry'
 with a.db() as c:
  c.execute('UPDATE storage_mirror SET state=?,attempts=attempts+1,next_at=? WHERE scope=? AND digest=?',(state,now+min(3600,15*2**min(row['attempts'],8)),row['scope'],row['digest']))
 return True

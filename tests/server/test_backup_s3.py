import io,json,tempfile,sqlite3,hashlib,unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'server'))
from backup_s3 import Backup,PREFIX
class Missing(Exception):response={'Error':{'Code':'404'}}
class Client:
 def __init__(self):self.objects={};self.uploads=0;self.corrupt=False
 def head_object(self,Bucket,Key):
  if Key not in self.objects:raise Missing()
  raw,meta=self.objects[Key];return {'ContentLength':len(raw),'Metadata':meta}
 def get_object(self,Bucket,Key):
  raw=self.objects[Key][0]
  if self.corrupt and '/pool/' in Key:raw=b'broken'
  return {'Body':io.BytesIO(raw)}
 def put_object(self,Bucket,Key,Body,**kw):self.objects[Key]=(Body,kw.get('Metadata',{}))
 def upload_fileobj(self,stream,Bucket,Key,ExtraArgs):self.uploads+=1;self.put_object(Bucket,Key,stream.read(),**ExtraArgs)
 def copy_object(self,Bucket,Key,CopySource,**kw):self.put_object(Bucket,Key,self.objects[CopySource['Key']][0],Metadata=kw.get('Metadata',{}))
 def download_file(self,Bucket,Key,path):Path(path).write_bytes(self.objects[Key][0])
class Storage:
 bucket='private'
 def __init__(self):self.client=Client()
 def key(self,scope,digest):return 'crm/v1/'+scope+'/'+digest
class TestS3Backup(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)/'source';self.root.mkdir();self.s=Storage();self.b=Backup(self.s)
  with sqlite3.connect(self.root/'crm.sqlite3') as c:c.execute('CREATE TABLE sync_blobs(scope TEXT,digest TEXT,size INTEGER)');c.execute('CREATE TABLE preserved(value TEXT)');c.execute("INSERT INTO preserved VALUES('real record')")
 def tearDown(self):self.temp.cleanup()
 def blob(self,local=True):
  raw=b'immutable photo';digest=hashlib.sha256(raw).hexdigest()
  with sqlite3.connect(self.root/'crm.sqlite3') as c:c.execute('INSERT INTO sync_blobs VALUES(?,?,?)',('school',digest,len(raw)))
  if local:
   p=self.root/'sync-blobs'/digest;p.parent.mkdir();p.write_bytes(raw)
  else:self.s.client.objects[self.s.key('school',digest)]=(raw,{})
  return digest
 def test_restore_and_incremental_reuse(self):
  digest=self.blob();snapshot=self.b.create(self.root);uploads=self.s.client.uploads
  self.b=Backup(self.s);self.b.create(self.root);self.assertEqual(self.s.client.uploads,uploads)
  out=Path(self.temp.name)/'restore';self.b.restore(snapshot,out)
  self.assertEqual((out/'sync-blobs'/digest).read_bytes(),b'immutable photo')
  with sqlite3.connect(out/'crm.sqlite3') as c:self.assertEqual(c.execute('SELECT value FROM preserved').fetchone()[0],'real record')
 def test_primary_s3_blob_is_copied_to_backup_namespace(self):
  digest=self.blob(False);self.b.create(self.root);self.assertIn(PREFIX+'pool/'+digest,self.s.client.objects)
 def test_bad_readback_never_completes(self):
  self.blob();self.s.client.corrupt=True
  with self.assertRaises(RuntimeError):self.b.create(self.root)
  self.assertFalse(any(k.endswith('COMPLETE.json') for k in self.s.client.objects))
 def test_restore_refuses_nonempty_target(self):
  snapshot=self.b.create(self.root)
  with self.assertRaises(ValueError):self.b.restore(snapshot,self.root)
if __name__=='__main__':unittest.main()

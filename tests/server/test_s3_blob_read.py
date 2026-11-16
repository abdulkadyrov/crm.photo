import io,hashlib,json,unittest
from unittest.mock import patch
from test_cloud import app,request,PASSWORD
import sync_api

class S3BlobReadTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.raw=b'cloud-only photo';cls.digest=hashlib.sha256(cls.raw).hexdigest();cls.path='/sync/blob/cloud-read/'+cls.digest
  with app.db() as c:
   c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',('s3-reader','s3-reader','reader','viewer',app.password_hash(PASSWORD)))
   c.executemany('INSERT INTO projects VALUES(?,?)',[('cloud-read','Cloud'),('cloud-foreign','Foreign')]);c.execute('INSERT INTO memberships VALUES(?,?)',('s3-reader','cloud-read'))
   c.execute('INSERT INTO sync_blobs VALUES(?,?,?,?)',('cloud-read',cls.digest,len(cls.raw),'admin'))
   c.execute('CREATE TABLE IF NOT EXISTS storage_mirror(scope TEXT,digest TEXT,state TEXT,attempts INTEGER DEFAULT 0,next_at REAL DEFAULT 0,PRIMARY KEY(scope,digest))')
   c.execute("INSERT INTO storage_mirror(scope,digest,state) VALUES(?,?,'ready')",('cloud-read',cls.digest))
   c.execute('INSERT INTO sync_records VALUES(?,?,?,?,?)',('finalWorks','cloud-work','cloud-read',json.dumps({'id':'cloud-work','image':{'$syncBlob':cls.digest,'size':len(cls.raw)}}),1))
  cls.cookie=request('/login','POST',{'login':'s3-reader','password':PASSWORD})['headers']['Set-Cookie'].split(';')[0]
 def test_cloud_stream_and_inventory(self):
  body=io.BytesIO(self.raw)
  with patch('private_storage.PrivateS3') as storage:
   storage.return_value.open.return_value=body
   r=request(self.path,cookie=self.cookie);self.assertEqual(r['status'],200);self.assertEqual(r['raw'],self.raw);self.assertTrue(body.closed)
  from types import SimpleNamespace
  with app.db() as c:
   u=c.execute("SELECT * FROM users WHERE id='s3-reader'").fetchone()
   r=sync_api.route(SimpleNamespace(method='GET',e={'QUERY_STRING':'check=1'}),c,u,self.path,SimpleNamespace(**vars(app)))
   self.assertTrue(r['exists'])
  r=request('/sync/inventory/cloud-read',cookie=self.cookie);self.assertTrue(r['data']['files'][0]['ready'])
 def test_acl_before_provider(self):
  with patch('private_storage.PrivateS3') as storage:
   self.assertEqual(request('/sync/blob/cloud-foreign/'+self.digest,cookie=self.cookie)['status'],403);storage.assert_not_called()
 def test_provider_failure_is_retryable(self):
  with patch('private_storage.PrivateS3',side_effect=RuntimeError('offline')):
   self.assertEqual(request(self.path,cookie=self.cookie)['status'],503)
 def test_local_priority(self):
  p=app.ROOT/'sync-blobs'/self.digest;p.parent.mkdir(exist_ok=True);p.write_bytes(self.raw)
  try:
   with patch('private_storage.PrivateS3') as storage:
    self.assertEqual(request(self.path,cookie=self.cookie)['raw'],self.raw);storage.assert_not_called()
  finally:p.unlink()
 def test_abort_closes_body(self):
  body=io.BytesIO(self.raw);response=sync_api.CloudBlob(body,len(self.raw));response.close();self.assertTrue(body.closed)

class PrivateReadMetadataTest(unittest.TestCase):
 def test_mismatched_object_is_closed(self):
  from private_storage import PrivateS3
  from unittest.mock import Mock
  body=io.BytesIO(b'wrong');client=Mock();client.get_object.return_value={'Body':body,'ContentLength':5,'Metadata':{'sha256':'wrong'}}
  with patch.dict('os.environ',{'CRM_S3_BUCKET':'private-test'}):
   with self.assertRaises(RuntimeError):PrivateS3(client).open('scope','a'*64,5)
  self.assertTrue(body.closed)

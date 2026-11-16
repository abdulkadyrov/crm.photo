import io,hashlib,unittest
from unittest.mock import Mock,patch
from test_cloud import app,request,PASSWORD
from private_storage import PrivateS3,InvalidUpload

class StreamUploadTest(unittest.TestCase):
 def storage(self):
  client=Mock();client.create_multipart_upload.return_value={'UploadId':'upload'};client.upload_part.return_value={'ETag':'etag'}
  with patch.dict('os.environ',{'CRM_S3_BUCKET':'private-test'}):storage=PrivateS3(client)
  return storage,client
 def test_success_promotes_only_verified_stream(self):
  storage,c=self.storage();raw=b'photo';digest=hashlib.sha256(raw).hexdigest();c.head_object.return_value={'ContentLength':len(raw),'Metadata':{'sha256':digest}}
  storage.upload_stream('scope',digest,io.BytesIO(raw),len(raw));self.assertEqual(c.copy_object.call_args.kwargs['Key'],storage.key('scope',digest));c.delete_object.assert_called_once();c.abort_multipart_upload.assert_not_called()
 def test_mismatch_never_touches_canonical(self):
  storage,c=self.storage()
  with self.assertRaises(InvalidUpload):storage.upload_stream('scope','a'*64,io.BytesIO(b'bad'),3)
  c.copy_object.assert_not_called();c.complete_multipart_upload.assert_not_called();c.abort_multipart_upload.assert_called_once();c.delete_object.assert_called_once()
 def test_truncated_body_aborts(self):
  storage,c=self.storage()
  with self.assertRaises(InvalidUpload):storage.upload_stream('scope','a'*64,io.BytesIO(b'x'),10)
  c.copy_object.assert_not_called();c.abort_multipart_upload.assert_called_once()
 def test_provider_failure_aborts_and_cleans(self):
  storage,c=self.storage();c.upload_part.side_effect=RuntimeError('offline')
  with self.assertRaises(RuntimeError):storage.upload_stream('scope',hashlib.sha256(b'x').hexdigest(),io.BytesIO(b'x'),1)
  c.copy_object.assert_not_called();c.abort_multipart_upload.assert_called_once();c.delete_object.assert_called_once()
 def test_bounded_multipart_reads(self):
  storage,c=self.storage();raw=b'x'*(8*1024*1024+3);digest=hashlib.sha256(raw).hexdigest();c.head_object.return_value={'ContentLength':len(raw),'Metadata':{'sha256':digest}}
  class Bounded(io.BytesIO):
   def read(self,n=-1):
    assert 0<n<=8*1024*1024
    return super().read(n)
  storage.upload_stream('scope',digest,Bounded(raw),len(raw));self.assertEqual([len(call.kwargs['Body']) for call in c.upload_part.call_args_list],[8*1024*1024,3])

class NativeS3PostTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  with app.db() as c:
   c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',('s3-writer','s3-writer','writer','manager',app.password_hash(PASSWORD)))
   c.execute('INSERT INTO projects VALUES(?,?)',('s3-upload','Uploads'));c.execute('INSERT INTO memberships VALUES(?,?)',('s3-writer','s3-upload'));c.execute('INSERT INTO projects VALUES(?,?)',('s3-no-access','Other'))
  cls.cookie=request('/login','POST',{'login':'s3-writer','password':PASSWORD})['headers']['Set-Cookie'].split(';')[0]
 def post(self,raw,scope='s3-upload'):
  return request('/sync/blob/'+scope+'/'+hashlib.sha256(raw).hexdigest(),'POST',raw,self.cookie)
 def test_primary_success_no_disk_persist(self):
  raw=b'primary-upload';digest=hashlib.sha256(raw).hexdigest()
  with patch.object(app,'S3_PRIMARY',True),patch('private_storage.PrivateS3') as provider,patch('sync_api.tempfile.mkstemp',side_effect=AssertionError('must not persist')):
   self.assertEqual(self.post(raw)['status'],200);provider.return_value.upload_stream.assert_called_once()
  self.assertFalse((app.ROOT/'sync-blobs'/digest).exists())
  with app.db() as c:self.assertEqual(c.execute('SELECT state FROM storage_mirror WHERE scope=? AND digest=?',('s3-upload',digest)).fetchone()[0],'ready')
 def test_failure_503_no_registration(self):
  raw=b'failed-primary';digest=hashlib.sha256(raw).hexdigest()
  with patch.object(app,'S3_PRIMARY',True),patch('private_storage.PrivateS3',side_effect=RuntimeError('offline')):self.assertEqual(self.post(raw)['status'],503)
  with app.db() as c:self.assertIsNone(c.execute('SELECT 1 FROM sync_blobs WHERE scope=? AND digest=?',('s3-upload',digest)).fetchone())
 def test_acl_before_upload(self):
  with patch.object(app,'S3_PRIMARY',True),patch('private_storage.PrivateS3') as provider:
   self.assertEqual(self.post(b'foreign','s3-no-access')['status'],403);provider.assert_not_called()
 def test_default_local_path_preserved(self):
  raw=b'local-default';digest=hashlib.sha256(raw).hexdigest()
  with patch.object(app,'S3_PRIMARY',False),patch('private_storage.PrivateS3') as provider:
   self.assertEqual(self.post(raw)['status'],200);provider.assert_not_called()
  self.assertEqual((app.ROOT/'sync-blobs'/digest).read_bytes(),raw)

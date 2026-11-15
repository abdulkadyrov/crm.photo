"""No provider calls. Fake AWS credentials, real presigner when optional SDK is installed."""
import hashlib,importlib.util,json,os,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import Mock,patch
from urllib.parse import parse_qs,urlsplit,urlencode
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'server'))
from private_storage import PrivateS3
from ar_adapter import HttpARAdapter

class MimeContractTest(unittest.TestCase):
 def test_response_override_is_optional_backwards_compatible_and_validated(self):
  with patch.dict(os.environ,{'CRM_S3_BUCKET':'crm-test'}):
   client=Mock();storage=PrivateS3(client);digest='a'*64
   storage.signed_get('project',digest,120)
   self.assertNotIn('ResponseContentType',client.generate_presigned_url.call_args.kwargs['Params'])
   storage.signed_get('project',digest,mime='video/mp4')
   self.assertEqual(client.generate_presigned_url.call_args.kwargs['Params']['ResponseContentType'],'video/mp4')
   with self.assertRaises(ValueError):storage.signed_get('project',digest,mime='text/html\r\nX-Test: unsafe')
 def test_adapter_propagates_validated_asset_mime_to_url_callback(self):
  assets={name:{'sha256':hashlib.sha256(name.encode()).hexdigest(),'mime':mime} for name,mime in [('marker','image/jpeg'),('video','video/mp4')]}
  url=Mock(side_effect=lambda scope,digest,mime:'https://bucket.example/'+digest)
  response=Mock();response.read.return_value=b'{"status":"ready","arWorkId":"stable","viewerUrl":"https://khanzama.ru/ar.photo/ar/abc"}'
  opener=Mock();opener.open.return_value.__enter__=Mock(return_value=response);opener.open.return_value.__exit__=Mock(return_value=False)
  with patch.dict(os.environ,{'CRM_AR_API_URL':'https://khanzama.ru/ar.photo/api/v1','CRM_AR_API_TOKEN':'test-only'}),patch('ar_adapter.build_opener',return_value=opener):
   HttpARAdapter(url).publish({'projectId':'p','assets':assets},'intent')
  self.assertEqual(url.call_args_list[0].args,('p',assets['marker']['sha256'],'image/jpeg'))
  self.assertEqual(url.call_args_list[1].args,('p',assets['video']['sha256'],'video/mp4'))

@unittest.skipUnless(importlib.util.find_spec('boto3'),'optional server boto3 SDK not installed')
class RealPresignerTest(unittest.TestCase):
 def setUp(self):
  self.env=patch.dict(os.environ,{'CRM_S3_BUCKET':'crm-test','CRM_S3_ENDPOINT':'https://s3.ru-3.storage.selcloud.ru','CRM_S3_REGION':'ru-3','AWS_ACCESS_KEY_ID':'TEST_ACCESS_KEY','AWS_SECRET_ACCESS_KEY':'test-secret-not-production','AWS_SESSION_TOKEN':'','AWS_EC2_METADATA_DISABLED':'true'})
  self.env.start();self.addCleanup(self.env.stop)
 def test_sigv4_virtual_host_and_response_content_type(self):
  storage=PrivateS3();digest='a'*64
  first=storage.signed_get('p',digest,mime='image/jpeg');second=storage.signed_get('p',digest,mime='video/mp4')
  a=urlsplit(first);b=urlsplit(second);qa=parse_qs(a.query);qb=parse_qs(b.query)
  self.assertEqual(a.hostname,'crm-test.s3.ru-3.storage.selcloud.ru')
  self.assertEqual(qa['response-content-type'],['image/jpeg']);self.assertEqual(qb['response-content-type'],['video/mp4'])
  self.assertEqual(qa['X-Amz-Algorithm'],['AWS4-HMAC-SHA256']);self.assertNotEqual(qa['X-Amz-Signature'],qb['X-Amz-Signature'])
  self.assertEqual(storage.client.meta.config.s3['addressing_style'],'virtual')

class StrictTransportTest(unittest.TestCase):
 def test_strict_ar_transport_accepts_signed_override_for_legacy_octet_stream_object(self):
  # Read-only use of the independently prepared AR downloader, when both repos are present.
  ar_file=Path(__file__).resolve().parents[3]/'ar.photo'/'server'/'integration'/'security.py'
  if not ar_file.exists():self.skipTest('AR repository absent; independent presigner contract still tested')
  spec=importlib.util.spec_from_file_location('ar_security_transport_fixture',ar_file);ar=importlib.util.module_from_spec(spec);spec.loader.exec_module(ar)
  self.env=patch.dict(os.environ,{'CRM_S3_BUCKET':'crm-test'});self.env.start();self.addCleanup(self.env.stop)
  host='crm-test.s3.ru-3.storage.selcloud.ru';client=Mock()
  client.generate_presigned_url.side_effect=lambda operation,Params,ExpiresIn:'https://'+host+'/'+Params['Key']+'?'+urlencode({'response-content-type':Params['ResponseContentType']})
  storage=PrivateS3(client)
  for mime,raw in [('image/jpeg',b'\xff\xd8\xffsynthetic'),('video/mp4',b'\0\0\0\x18ftypisomsynthetic')]:
   digest=hashlib.sha256(raw).hexdigest();url=storage.signed_get('p',digest,mime=mime)
   class Response:
    status=200
    def __init__(self,content_type):self.content_type=content_type;self.buffer=raw
    def getheader(self,key,default=None):return {'Content-Type':self.content_type,'Content-Length':str(len(raw))}.get(key,default)
    def read(self,n):data=self.buffer;self.buffer=b'';return data
   class S3Transport:
    def __init__(self,*args):pass
    def request(self,method,target,headers):self.type=parse_qs(urlsplit(target).query).get('response-content-type',['binary/octet-stream'])[0]
    def getresponse(self):return Response(self.type)
    def close(self):pass
   resolver=lambda *args,**kwargs:[(None,None,None,None,('8.8.8.8',443))]
   with tempfile.TemporaryDirectory() as folder:
    target=Path(folder)/'asset';ar.download({'url':url,'mime':mime,'sha256':digest},target,host,resolver=resolver,connection=S3Transport)
    self.assertEqual(target.read_bytes(),raw)

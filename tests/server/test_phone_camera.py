import io,json,uuid,unittest
from test_cloud import app,request,PASSWORD
try:
 from PIL import Image
except ImportError:Image=None

@unittest.skipUnless(Image,'Pillow is required for camera frame validation')
class PhoneCameraTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.cookies={}
  with app.db() as c:
   c.execute('INSERT INTO projects VALUES(?,?)',('camera-project','School'))
   c.execute('INSERT INTO sync_records VALUES(?,?,?,?,0)',('projects','camera-project','camera-project',json.dumps({'id':'camera-project','name':'School'})))
   for role in ('admin','manager','viewer'):
    uid='camera-'+role;c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(uid,uid,uid,role,app.password_hash(PASSWORD)));c.execute('INSERT INTO memberships VALUES(?,?)',(uid,'camera-project'))
  for role in ('admin','manager','viewer'):cls.cookies[role]=request('/login','POST',{'login':'camera-'+role,'password':PASSWORD})['headers']['Set-Cookie'].split(';')[0]
  b=io.BytesIO();Image.new('RGB',(64,64),'white').save(b,'JPEG');cls.jpeg=b.getvalue()
 def setUp(self):
  selection=request('/sync/print-selections','POST',{'projectId':'camera-project'},self.cookies['admin']);self.assertEqual(selection['status'],200,selection)
  r=request('/sync/phone-camera','POST',{'selectionId':selection['data']['id']},self.cookies['admin']);self.assertEqual(r['status'],200,r);self.session=r['data'];self.ip='camera-'+uuid.uuid4().hex
 def pair(self,code=None):return request('/public/camera/pair','POST',{'code':code or self.session['code']},headers={'REMOTE_ADDR':self.ip})
 def frame(self,token,body=None):return request('/public/camera/frame/'+self.session['id'],'POST',self.jpeg if body is None else body,headers={'HTTP_AUTHORIZATION':'Bearer '+token})
 def test_no_login_sender_and_private_receiver(self):
  pair=self.pair();self.assertEqual(pair['status'],200);self.assertEqual(set(pair['data']),{'id','token'})
  self.assertEqual(self.frame(pair['data']['token'])['status'],200)
  path='/sync/phone-camera/'+self.session['id'];self.assertEqual(request(path)['status'],401);self.assertEqual(request(path,cookie=self.cookies['manager'])['status'],403)
  snapshot=request(path,cookie=self.cookies['admin']);self.assertEqual(snapshot['status'],200);self.assertTrue(snapshot['data']['frame'].startswith('data:image/jpeg;base64,'));self.assertEqual(snapshot['data']['seq'],1)
  self.assertEqual(request('/public/camera/frame/'+self.session['id'])['status'],404)
 def test_one_time_code_token_revocation_and_frame_limits(self):
  pair=self.pair();token=pair['data']['token'];self.assertEqual(self.pair()['status'],404)
  self.assertEqual(self.frame('wrong')['status'],403);self.assertEqual(self.frame(token,b'bad image')['status'],400);self.assertEqual(self.frame(token,b'a'*(321*1024))['status'],413)
  self.assertEqual(self.frame(token)['status'],200);self.assertEqual(self.frame(token)['status'],429)
  self.assertEqual(request('/sync/phone-camera/'+self.session['id'],'POST',{'action':'stop'},self.cookies['admin'])['status'],200);self.assertEqual(self.frame(token)['status'],410)
  self.assertFalse((app.ROOT/'phone-camera'/(self.session['id']+'.jpg')).exists())
 def test_code_rate_limit_expiry_and_scope_revocation(self):
  for _ in range(10):self.assertEqual(self.pair('99999999')['status'],404)
  self.assertEqual(self.pair()['status'],429)
  with app.db() as c:c.execute('UPDATE phone_cameras SET code_expires=0 WHERE id=?',(self.session['id'],))
  self.ip+='new';self.assertEqual(self.pair()['status'],404)
 def test_sender_cannot_select_prints_and_notice_has_no_child_data(self):
  token=self.pair()['data']['token'];r=request('/sync/phone-camera/'+self.session['id'],'POST',{'action':'notice','notice':'recognized'},self.cookies['admin']);self.assertEqual(r['status'],200)
  r=self.frame(token);self.assertEqual(r['data'],{'received':True,'notice':'recognized'})
  self.assertEqual(request('/sync/print-selections/'+self.session['id'],'POST',{'op':str(uuid.uuid4()),'action':'ready'},headers={'HTTP_AUTHORIZATION':'Bearer '+token})['status'],401)

 def seed_picker(self):
  ref={'$syncBlob':'a'*64,'mime':'image/jpeg','size':10}
  with app.db() as c:
   for store,rid,data in [('classes','camera-g',{'id':'camera-g','projectId':'camera-project','name':'2а'}),('students','camera-child',{'id':'camera-child','classId':'camera-g','firstName':'Адам','lastName':'Ахмадов'}),('finalWorks','camera-wolf',{'id':'camera-wolf','studentId':'camera-child','title':'Страж гор и волк','image':ref}),('finalWorks','camera-tower',{'id':'camera-tower','studentId':'camera-child','title':'Джигит у башни','image':ref})]:
    c.execute('INSERT OR REPLACE INTO sync_records VALUES(?,?,?,?,0)',(store,rid,'camera-project',json.dumps(data)))
  token=self.pair()['data']['token'];self.token=token
  return ref
 def public(self,action,body=None,token=None):return request('/public/camera/'+action+'/'+self.session['id'],'POST',body,headers={'HTTP_AUTHORIZATION':'Bearer '+(token or self.token)})
 def offer(self):return request('/sync/phone-camera/'+self.session['id'],'POST',{'action':'offer','studentId':'camera-child'},self.cookies['admin'])
 def test_phone_picker_scope_idempotency_and_mac_sync(self):
  ref=self.seed_picker();self.assertEqual(self.public('state')['data']['works'],[])
  self.assertEqual(self.public('choose',{'workId':'camera-wolf'})['status'],403)
  self.assertEqual(self.offer()['status'],200);state=self.public('state')['data'];self.assertEqual(len(state['works']),2);self.assertEqual(state['student']['name'],'Ахмадов Адам')
  body={'op':str(uuid.uuid4()),'workId':'camera-wolf','imageHash':ref['$syncBlob']}
  first=self.public('choose',body);self.assertEqual(first['status'],200,first);self.assertTrue(first['data']['saved']);self.assertEqual(first['data']['count'],1)
  self.assertTrue(self.public('choose',body)['data']['duplicate']);self.assertEqual(self.public('state')['data']['count'],1)
  self.assertEqual(self.public('choose',{'op':str(uuid.uuid4()),'workId':'camera-tower','imageHash':'wrong'})['status'],409)
  self.assertEqual(self.public('choose',{'op':str(uuid.uuid4()),'workId':'camera-tower','imageHash':ref['$syncBlob']})['data']['count'],2)
  self.assertEqual(self.public('state',token='wrong')['status'],403)
  self.assertEqual(self.public('next')['data']['works'],[]);self.assertEqual(self.public('choose',body)['status'],403)
 def test_phone_code_and_revocation(self):
  self.seed_picker();self.assertEqual(self.public('code',{'code':'camera-child'})['status'],200)
  host=request('/sync/phone-camera/'+self.session['id'],cookie=self.cookies['admin'])['data'];self.assertEqual(host['code'],'camera-child');self.assertEqual(host['codeSeq'],1)
  self.assertEqual(self.public('code',{'code':'x'*4097})['status'],400)
  self.offer()
  with app.db() as c:c.execute("UPDATE users SET active=0 WHERE id='camera-admin'")
  try:self.assertEqual(self.public('state')['status'],403)
  finally:
   with app.db() as c:c.execute("UPDATE users SET active=1 WHERE id='camera-admin'")

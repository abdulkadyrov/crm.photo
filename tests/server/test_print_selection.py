import json,uuid,unittest
from test_cloud import app,request,PASSWORD

class PrintSelectionTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.cookies={}
  with app.db() as c:
   c.execute('INSERT INTO projects VALUES(?,?)',('pick-project','School'))
   c.execute('INSERT INTO sync_records VALUES(?,?,?,?,0)',('projects','pick-project','pick-project',json.dumps({'id':'pick-project','name':'School'})))
   for role in ('admin','manager','viewer'):
    uid='pick-'+role;c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(uid,uid,uid,role,app.password_hash(PASSWORD)));c.execute('INSERT INTO memberships VALUES(?,?)',(uid,'pick-project'))
  for role in ('admin','manager','viewer'):cls.cookies[role]=request('/login','POST',{'login':'pick-'+role,'password':PASSWORD})['headers']['Set-Cookie'].split(';')[0]
 def setUp(self):
  self.g='pick-g-'+uuid.uuid4().hex;self.s='pick-s-'+uuid.uuid4().hex;self.w='pick-w-'+uuid.uuid4().hex
  with app.db() as c:
   for store,id,data in [('classes',self.g,{'id':self.g,'projectId':'pick-project','name':'1а'}),('students',self.s,{'id':self.s,'classId':self.g,'firstName':'Адам','lastName':'Тестов','paidAmount':9900}),('finalWorks',self.w,{'id':self.w,'studentId':self.s,'title':'Волк','status':'printed','image':{'$syncBlob':'a'*64,'mime':'image/png','size':100}})]:c.execute('INSERT INTO sync_records VALUES(?,?,?,?,?)',(store,id,'pick-project',json.dumps(data),0))
  r=self.req('','POST',{'projectId':'pick-project','groupId':self.g});self.assertEqual(r['status'],200,r);self.id=r['data']['id']
 def req(self,id='',method='GET',body=None,role='admin',query=''):return request('/sync/print-selections'+('/'+id if id else ''),method,body,self.cookies[role],headers={'QUERY_STRING':query})
 def select(self,**kwargs):return dict(op=str(uuid.uuid4()),workId=self.w,imageHash='a'*64,selected=True,copies=1,**kwargs)
 def test_shared_selection_retries_and_copies(self):
  op=self.select();one=self.req(self.id,'POST',op);self.assertEqual(one['status'],200);two=self.req(self.id,'POST',op);self.assertEqual(len(two['data']['items']),1);self.assertEqual(two['data']['revision'],one['data']['revision']);self.assertEqual(two['data']['items'][0]['copies'],1)
  copies=self.select();copies['copies']=2;self.assertEqual(self.req(self.id,'POST',copies)['data']['items'][0]['copies'],2)
  ready={'op':str(uuid.uuid4()),'action':'ready'};self.assertTrue(self.req(self.id,'POST',ready)['data']['ready'])
  remove=self.select();remove['selected']=False;self.assertEqual(self.req(self.id,'POST',remove)['data']['items'],[])
  # Replaying an older add must not resurrect a removed pick.
  self.assertEqual(self.req(self.id,'POST',op)['data']['items'],[])
 def test_owner_project_acl_and_private_metadata(self):
  self.assertEqual(self.req(self.id,role='manager')['status'],403);self.assertEqual(self.req(self.id,role='viewer')['status'],403)
  data=self.req(self.id)['data'];self.assertNotIn('paidAmount',data['students'][0]);self.assertEqual(len(data['works']),1)
  self.assertEqual(self.req('','POST',{'projectId':'pick-project','groupId':'missing'})['status'],403)
  op=self.select();op['workId']='missing';self.assertEqual(self.req(self.id,'POST',op)['status'],403)
 def test_changed_correction_and_deleted_photo(self):
  self.req(self.id,'POST',self.select())
  with app.db() as c:
   row=json.loads(c.execute("SELECT data FROM sync_records WHERE id=? AND store='finalWorks'",(self.w,)).fetchone()[0]);row['image']['$syncBlob']='b'*64;c.execute("UPDATE sync_records SET data=? WHERE id=? AND store='finalWorks'",(json.dumps(row),self.w))
  self.assertTrue(self.req(self.id)['data']['items'][0]['stale']);self.assertEqual(self.req(self.id,'POST',self.select())['status'],409)
  with app.db() as c:c.execute("UPDATE sync_records SET data=NULL WHERE id=? AND store='finalWorks'",(self.w,))
  remove=self.select();remove['selected']=False;self.assertEqual(self.req(self.id,'POST',remove)['data']['items'],[])
 def test_revision_and_expiry(self):
  data=self.req(self.id)['data'];self.assertTrue(self.req(self.id,query='revision='+str(data['revision']))['data']['unchanged'])
  with app.db() as c:c.execute('UPDATE print_selections SET expires=0 WHERE id=?',(self.id,))
  self.assertEqual(self.req(self.id)['status'],410)
 def test_invalid_copies_and_op_collision(self):
  op=self.select();op['copies']=0;self.assertEqual(self.req(self.id,'POST',op)['status'],400)
  op['copies']=1;self.req(self.id,'POST',op);op['copies']=2;self.assertEqual(self.req(self.id,'POST',op)['status'],409)

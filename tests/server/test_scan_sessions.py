import copy,json,uuid,unittest
from test_cloud import app,request,PASSWORD

class ScanSessionsTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.cookies={}
  with app.db() as c:
   for role in ('admin','manager','photographer','viewer'):
    uid='scan-'+role;c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(uid,uid,uid,role,app.password_hash(PASSWORD)))
   c.execute('INSERT INTO projects VALUES(?,?)',('scan-project','School'))
   c.execute('INSERT INTO projects VALUES(?,?)',('scan-private','Other school'))
   for role in ('manager','photographer','viewer'):c.execute('INSERT INTO memberships VALUES(?,?)',('scan-'+role,'scan-project'))
  for role in ('admin','manager','photographer','viewer'):cls.cookies[role]=request('/login','POST',{'login':'scan-'+role,'password':PASSWORD})['headers']['Set-Cookie'].split(';')[0]
 def setUp(self):
  self.g='scan-g-'+uuid.uuid4().hex;self.s='scan-s-'+uuid.uuid4().hex;self.w='scan-w-'+uuid.uuid4().hex
  with app.db() as c:
   for store,id,data in [('classes',self.g,{'id':self.g,'projectId':'scan-project'}),('students',self.s,{'id':self.s,'classId':self.g}),('finalWorks',self.w,{'id':self.w,'studentId':self.s,'finalImageVersion':1})]:
    c.execute('INSERT INTO sync_records VALUES(?,?,?,?,?)',(store,id,'scan-project',json.dumps(data),0))
 def event(self,**values):
  return dict(id=str(uuid.uuid4()),studentId=self.s,workId=self.w,version=1,status='matched',accepted=True,extraCopy=False,comment='',at='2026-11-19T18:00:00Z',groupId=self.g,roundId='initial',**values)
 def post(self,body,role='manager'):return request('/sync/scans','POST',body,self.cookies[role])
 def get(self,role='manager',after=0):return request('/sync/scans','GET',cookie=self.cookies[role],headers={'QUERY_STRING':'after='+str(after)})
 def test_two_phones_replay_and_duplicate_normalization(self):
  one=self.event();r=self.post({'events':[one]});self.assertEqual(r['status'],200,r);self.assertTrue(r['data']['events'][0]['accepted'])
  self.assertEqual(self.post({'events':[one]})['data'],r['data'])
  two=self.event();r=self.post({'events':[two]});self.assertEqual(r['data']['events'][0]['status'],'duplicate');self.assertFalse(r['data']['events'][0]['accepted'])
  read=self.get()['data'];rows=[e for e in read['events'] if e['groupId']==self.g];self.assertEqual(sum(e['accepted'] for e in rows),1)
  copy_event=self.event();copy_event.update(status='duplicate',extraCopy=True);self.assertTrue(self.post({'events':[copy_event]})['data']['events'][0]['accepted'])
  changed={**one,'comment':'changed'};self.assertEqual(self.post({'events':[changed]})['status'],409)
 def test_authorization_binding_and_validation(self):
  self.assertEqual(self.post({'events':[self.event()]},'viewer')['status'],403)
  foreign='scan-private-'+uuid.uuid4().hex
  with app.db() as c:c.execute('INSERT INTO sync_records VALUES(?,?,?,?,?)',('classes',foreign,'scan-private',json.dumps({'id':foreign,'projectId':'scan-private'}),0))
  self.assertNotIn(foreign,self.get()['data']['rounds'])
  event=self.event();event['groupId']=foreign;self.assertEqual(self.post({'events':[event]})['status'],403)
  event=self.event();event['workId']='missing';self.assertEqual(self.post({'events':[event]})['status'],403)
  event=self.event();event['version']='1';self.assertEqual(self.post({'events':[event]})['status'],400)
  self.assertEqual(self.get('viewer')['status'],200)
  self.assertEqual(self.post({'events':[self.event()]},'photographer')['status'],200)
 def test_reset_is_idempotent_and_stale_offline_events_stay_in_history(self):
  one=self.event();self.post({'events':[one]});op=str(uuid.uuid4());reset={'op':op,'rounds':{self.g:'initial'}}
  r=self.post({'reset':reset});self.assertEqual(r['status'],200);self.assertEqual(self.post({'reset':reset})['data'],r['data'])
  stale={'op':str(uuid.uuid4()),'rounds':{self.g:'initial'}};self.assertEqual(self.post({'reset':stale})['status'],409)
  old=self.event();reply=self.post({'events':[old]})['data'];self.assertEqual(reply['archived'],[old['id']])
  fresh=self.event();fresh['roundId']=op;self.assertTrue(self.post({'events':[fresh]})['data']['events'][0]['accepted'])
  reply=self.get()['data'];self.assertEqual(reply['rounds'][self.g],op)
  active=[e for e in reply['events'] if e['groupId']==self.g and e['roundId']==op];self.assertEqual(len(active),1)
 def test_legacy_colon_ids_import_and_incremental_cursor(self):
  event=self.event();event['id']='old-session:'+uuid.uuid4().hex
  self.assertEqual(self.post({'events':[event]})['status'],200)
  first=self.get()['data'];next=self.get(after=first['cursor'])['data'];self.assertEqual(next['events'],[])
  more=self.event();more['workId']='';self.post({'events':[more]});next=self.get(after=first['cursor'])['data'];self.assertIn(more['id'],[e['id'] for e in next['events']])
 def test_batch_is_atomic(self):
  one=self.event();bad=self.event();bad['studentId']='missing'
  self.assertEqual(self.post({'events':[one,bad]})['status'],403)
  with app.db() as c:self.assertIsNone(c.execute('SELECT id FROM scan_events WHERE id=?',(one['id'],)).fetchone())
 def test_deleted_work_can_migrate_as_an_archived_unaccepted_event(self):
  with app.db() as c:
   old=c.execute("SELECT data FROM sync_records WHERE store='finalWorks' AND id=?",(self.w,)).fetchone()[0]
   c.execute('INSERT INTO sync_changes(store,id,scope,data,actor,at) VALUES(?,?,?,?,?,0)',('finalWorks',self.w,'scan-project',old,'scan-admin'))
   c.execute("UPDATE sync_records SET data=NULL WHERE store='finalWorks' AND id=?",(self.w,))
  reply=self.post({'events':[self.event()]});self.assertEqual(reply['status'],200,reply);self.assertFalse(reply['data']['events'][0]['accepted']);self.assertEqual(reply['data']['events'][0]['status'],'inconsistent')

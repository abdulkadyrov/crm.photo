import copy,hashlib,uuid,unittest
from test_cloud import app,request,PASSWORD
from sync_api import merge

class SyncTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.cookies={}
  with app.db() as c:
   for role in ('admin','manager','photographer','viewer'):
    uid='sync-'+role;c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(uid,uid,uid,role,app.password_hash(PASSWORD)))
   c.execute('INSERT INTO projects VALUES(?,?)',('sync-project','School'))
   for role in ('manager','photographer','viewer'):c.execute('INSERT INTO memberships VALUES(?,?)',('sync-'+role,'sync-project'))
  for role in ('admin','manager','photographer','viewer'):cls.cookies[role]=request('/login','POST',{'login':'sync-'+role,'password':PASSWORD})['headers']['Set-Cookie'].split(';')[0]
 def push(self,store,base,nxt,role='admin',scope='sync-project',op=None,**extra):
  rid=(nxt or base)['id'];return request('/sync/push','POST',{'store':store,'id':rid,'scope':scope,'base':base,'next':nxt,'op':op or str(uuid.uuid4()),**extra},self.cookies[role])
 def test_01_seed_and_disjoint_edits(self):
  p={'id':'sync-project','name':'School'};self.assertEqual(self.push('projects',None,p)['status'],200)
  g={'id':'sync-class','projectId':p['id'],'name':'1A'};self.assertEqual(self.push('classes',None,g)['status'],200)
  kid={'id':'sync-child','classId':g['id'],'firstName':'Иван','lastName':'Иванов','paymentStatus':'unpaid','comment':'','paidAmount':0}
  self.assertEqual(self.push('students',None,kid)['status'],200)
  local={**kid,'comment':'Снять вместе с братом'};self.assertTrue(self.push('students',kid,local)['data']['saved'])
  staff=app.strip_finance(kid);r=self.push('students',staff,{**staff,'paymentStatus':'paid'},'photographer')
  self.assertEqual(r['status'],200,r);self.assertEqual(r['data']['record']['comment'],local['comment']);self.assertEqual(r['data']['record']['paymentStatus'],'paid');self.assertNotIn('paidAmount',r['data']['record'])
 def test_02_conflict_and_idempotency(self):
  base={'id':'sync-kid2','classId':'sync-class','firstName':'Анна','lastName':'Тестовая','paymentStatus':'unpaid'};self.push('students',None,base)
  a={**base,'firstName':'Аня'};b={**base,'firstName':'Аннушка'};op=str(uuid.uuid4())
  one=self.push('students',base,a,op=op);self.assertTrue(one['data']['saved'])
  two=self.push('students',base,a,op=op);self.assertEqual(one['data'],two['data'])
  self.assertEqual(self.push('students',base,b,op=op)['status'],409)
  conflict=self.push('students',base,b)['data'];self.assertTrue(conflict['conflict']);self.assertIn('/firstName',conflict['fields']);self.assertEqual(conflict['current']['firstName'],'Аня')
  self.assertTrue(self.push('students',conflict['current'],b)['data']['saved'])
 def test_03_permissions_and_revocation(self):
  kid={'id':'sync-child','classId':'sync-class','firstName':'Иван','lastName':'Иванов','paymentStatus':'paid','comment':'Снять вместе с братом'}
  self.assertEqual(self.push('students',kid,{**kid,'firstName':'hack'},'photographer')['status'],403)
  self.assertEqual(self.push('students',kid,{**kid,'paidAmount':50},'manager')['status'],403)
  self.assertEqual(self.push('students',kid,kid,'viewer')['status'],403)
  self.assertEqual(request('/sync/changes/global',cookie=self.cookies['viewer'])['status'],200)
  self.assertEqual(request('/sync/changes/foreign',cookie=self.cookies['manager'])['status'],404)
 def test_04_delete_edit_and_tombstone(self):
  base={'id':'sync-deleted','classId':'sync-class','firstName':'Тест','lastName':'Удаление'};self.push('students',None,base)
  edited={**base,'comment':'не терять'};self.push('students',base,edited)
  self.assertTrue(self.push('students',base,None)['data']['conflict'])
  deletion=self.push('students',edited,None)['data'];self.assertTrue(deletion['saved'])
  resurrection=self.push('students',None,edited)['data'];self.assertTrue(resurrection['conflict'])
  self.assertTrue(self.push('students',None,edited,restoreSeq=deletion['seq'])['data']['saved'])
  group={'id':'sync-class','projectId':'sync-project','name':'1A'}
  self.assertIn('/children',self.push('classes',group,None)['data']['fields'])
 def test_05_binary_hash_acl_and_retries(self):
  raw=b'synthetic photo';digest=hashlib.sha256(raw).hexdigest();path='/sync/blob/sync-project/'+digest
  self.assertEqual(request(path,'POST',raw,self.cookies['photographer'])['status'],200)
  self.assertTrue(request(path,'POST',raw,self.cookies['photographer'])['data']['duplicate'])
  self.assertEqual(request('/sync/blob/global/'+digest,cookie=self.cookies['photographer'])['status'],404)
  media={'id':'sync-photo','studentId':'sync-child','blob':{'$syncBlob':digest,'kind':'blob','mime':'image/jpeg','size':len(raw)}}
  self.assertTrue(self.push('media',None,media,'photographer')['data']['saved'])
  self.assertEqual(request(path,cookie=self.cookies['viewer'])['raw'],raw)
  with app.db() as c:c.execute("DELETE FROM memberships WHERE user_id='sync-viewer'")
  self.assertEqual(request(path,cookie=self.cookies['viewer'])['status'],403)
  self.assertEqual(request('/sync/changes/sync-project',cookie=self.cookies['viewer'])['status'],403)
 def test_06_checklists_merge_different_tasks(self):
  base={'id':'sync-order','studentId':'sync-child','items':[{'type':'portrait','status':'pending','fileIds':[]},{'type':'video','status':'pending','fileIds':[]}]};self.push('orders',None,base)
  one=copy.deepcopy(base);one['items'][0]['status']='done';self.push('orders',base,one,'photographer')
  two=copy.deepcopy(base);two['items'][1]['status']='done';r=self.push('orders',base,two,'photographer')
  self.assertTrue(r['data']['saved']);self.assertEqual([i['status'] for i in r['data']['record']['items']],['done','done'])
 def test_07_receipt_does_not_duplicate_changelog(self):
  with app.db() as c:
   self.assertEqual(c.execute("SELECT count(*) FROM sync_records WHERE store='media' AND id='sync-photo'").fetchone()[0],1)
  response=request('/sync/changes/sync-project',cookie=self.cookies['manager'])['data'];self.assertGreater(response['cursor'],0);self.assertTrue(response['changes'])
  for row in response['changes']:
   if row['record']:self.assertNotIn('paidAmount',row['record'])

 def test_08_independent_photos_and_concurrent_retries(self):
  from concurrent.futures import ThreadPoolExecutor
  base={'id':'sync-thread','classId':'sync-class','firstName':'Concurrent'};op=str(uuid.uuid4())
  with ThreadPoolExecutor(max_workers=2) as pool:
   responses=list(pool.map(lambda _:self.push('students',None,base,op=op),range(2)))
  self.assertEqual(responses[0]['data'],responses[1]['data'])
  with app.db() as c:self.assertEqual(c.execute("SELECT count(*) FROM sync_changes WHERE id='sync-thread'").fetchone()[0],1)
  value,errors=merge({'fileIds':['old']},{'fileIds':['old','a']},{'fileIds':['old','b']})
  self.assertEqual(errors,[]);self.assertEqual(set(value['fileIds']),{'old','a','b'})
 def test_09_published_roster_tracks_canonical_changes(self):
  group={'id':'sync-class','projectId':'sync-project','name':'1A'}
  item={'id':'sync-public-service','name':'Photo','price':500,'type':'photo'}
  self.push('catalog',None,item,scope='global')
  request('/parents/catalog','POST',{'items':[item]},self.cookies['admin'])
  published=request('/parents/classes/sync-class','POST',{'projectId':'sync-project','name':'1A','revision':0,'children':[{'id':'sync-new-parent','name':'Before'}],'services':[item['id']]},self.cookies['admin'])
  self.assertEqual(published['status'],200,published)
  kid={'id':'sync-new-parent','classId':'sync-class','firstName':'После','lastName':'Синхронизации'}
  self.assertTrue(self.push('students',None,kid)['data']['saved'])
  self.push('catalog',item,{**item,'price':600},scope='global')
  token=published['data']['url'].split('/')[-1]
  public=request('/public/classes/'+token)['data'];self.assertEqual(public['children'][0]['public_name'],'Синхронизации После');self.assertEqual(public['catalog'][0]['price'],600)


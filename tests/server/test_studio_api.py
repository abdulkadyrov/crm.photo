import json,uuid,unittest
from test_cloud import app,request,PASSWORD
import parent_mutations
class Studio(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.cookies={}
  with app.db() as c:
   for role in ('admin','manager','viewer','photographer'):
    uid='studio-'+role;c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(uid,uid,role,role,app.password_hash(PASSWORD)))
   for pid in ('studio-project','studio-other'):
    c.execute('INSERT INTO projects VALUES(?,?)',(pid,pid));parent_mutations.write_record(c,'projects',pid,pid,{'id':pid,'name':pid})
   c.execute('INSERT INTO memberships VALUES(?,?)',('studio-manager','studio-project'))
   parent_mutations.write_record(c,'classes','studio-class','studio-project',{'id':'studio-class','projectId':'studio-project','name':'4A'})
   parent_mutations.write_record(c,'students','studio-child','studio-project',{'id':'studio-child','classId':'studio-class','firstName':'Али','lastName':'Алиев','paymentStatus':'paid','selectedServices':[{'serviceId':'s'}]})
   parent_mutations.write_record(c,'orders','order_studio-child','studio-project',{'id':'order_studio-child','studentId':'studio-child','items':[{'type':'portrait','status':'done','fileIds':['original']} ]})
  for role in ('admin','manager','viewer','photographer'):cls.cookies[role]=request('/login','POST',{'login':'studio-'+role,'password':PASSWORD})['headers']['Set-Cookie'].split(';')[0]
 def call(self,action,args=[],role='admin',**extra):return request('/studio/call','POST',{'action':action,'args':args,**extra},self.cookies[role],origin='https://zakaz.khanzama.ru')
 def test_acl_and_automatic_canonical_roster(self):
  for role in ('viewer','photographer'):self.assertEqual(self.call('loadSchools',role=role)['status'],403)
  self.assertEqual(self.call('loadSchool',['studio-other'],role='manager')['status'],403)
  self.assertEqual(self.call('deleteAll')['status'],501)
  result=self.call('loadClass',['studio-class']);self.assertEqual(result['status'],200,result);self.assertEqual(result['data']['children'][0]['id'],'studio-child')
 def test_update_preserves_payment_and_progress_revisions_and_receipt(self):
  kid=next(k for k in self.call('loadClass',['studio-class'])['data']['children'] if k['id']=='studio-child');key=str(uuid.uuid4());body={'requestKey':key,'revisions':{kid['id']:kid['revision']}}
  update=self.call('updateChild',[kid['id'],{'first_name':'Али Новый'}],**body);self.assertEqual(update['status'],200,update)
  self.assertEqual(self.call('updateChild',[kid['id'],{'first_name':'Али Новый'}],**body)['data'],update['data'])
  self.assertEqual(self.call('updateChild',[kid['id'],{'first_name':'Конфликт'}],requestKey=str(uuid.uuid4()),revisions={kid['id']:kid['revision']})['status'],409)
  with app.db() as c:
   child=json.loads(c.execute("SELECT data FROM sync_records WHERE store='students' AND id=?",(kid['id'],)).fetchone()[0]);self.assertEqual(child['paymentStatus'],'paid')
   order=json.loads(c.execute("SELECT data FROM sync_records WHERE store='orders' AND id='order_studio-child'").fetchone()[0]);self.assertEqual(order['items'][0]['fileIds'],['original'])
 def test_create_import_idempotency_and_cross_origin_guard(self):
  group=self.call('loadClass',['studio-class'])['data']['schoolClass'];body={'requestKey':str(uuid.uuid4()),'revisions':{group['id']:group['revision']}}
  args=[group['id'],[{'first_name':'Иван','last_name':'Иванов'},{'first_name':'Иван','last_name':'Иванов'}]]
  result=self.call('importChildren',args,**body);self.assertEqual(result['status'],200,result);self.assertEqual(result['data'],{'added':1,'skipped':1});self.assertEqual(self.call('importChildren',args,**body)['data'],result['data'])
  denied=request('/projects','POST',{'id':'injected','name':'bad'},self.cookies['admin'],origin='https://zakaz.khanzama.ru');self.assertEqual(denied['status'],403)
 def test_receipt_retry_rechecks_revoked_project_access(self):
  group=self.call('loadClass',['studio-class'],role='manager')['data']['schoolClass'];body={'requestKey':str(uuid.uuid4()),'revisions':{group['id']:group['revision']}};args=['studio-class',{'first_name':'Проверка','last_name':'Доступа'}]
  self.assertEqual(self.call('createChild',args,role='manager',**body)['status'],200)
  with app.db() as c:c.execute("DELETE FROM memberships WHERE user_id='studio-manager'")
  try:self.assertEqual(self.call('createChild',args,role='manager',**body)['status'],403)
  finally:
   with app.db() as c:c.execute("INSERT INTO memberships VALUES('studio-manager','studio-project')")
 def test_finance_fields_are_not_child_mutations(self):
  kid=next(k for k in self.call('loadClass',['studio-class'])['data']['children'] if k['id']=='studio-child')
  denied=self.call('updateChild',[kid['id'],{'paymentStatus':'unpaid'}],requestKey=str(uuid.uuid4()),revisions={kid['id']:kid['revision']});self.assertEqual(denied['status'],400)
  self.assertEqual(self.call('updateCatalogItem',['any',{'price':1}],role='manager',requestKey=str(uuid.uuid4()))['status'],403)
 def test_private_media_requires_current_membership_and_never_public_cache(self):
  import hashlib
  raw=b'\xff\xd8\xffstaff-private';digest=hashlib.sha256(raw).hexdigest();folder=app.ROOT/'sync-blobs';folder.mkdir(exist_ok=True);(folder/digest).write_bytes(raw)
  with app.db() as c:
   parent_mutations.write_record(c,'media','studio-private-media','studio-project',{'id':'studio-private-media','studentId':'studio-child','fileName':'private.jpg','blob':{'$syncBlob':digest,'mime':'image/jpeg','size':len(raw)}})
  result=self.call('getPrivateMediaUrls',[['studio-private-media']],role='manager');self.assertEqual(result['status'],200,result)
  response=request('/studio/file',cookie=self.cookies['manager'],headers={'QUERY_STRING':'path=studio-private-media'});self.assertEqual(response['status'],200,response);self.assertEqual(response['raw'],raw);self.assertEqual(response['headers']['Cache-Control'],'private, no-store');self.assertEqual(response['headers']['Content-Type'],'image/jpeg')
  with app.db() as c:c.execute("DELETE FROM memberships WHERE user_id='studio-manager'")
  try:
   self.assertEqual(request('/studio/file',cookie=self.cookies['manager'],headers={'QUERY_STRING':'path=studio-private-media'})['status'],403)
   self.assertEqual(self.call('getPrivateMediaUrls',[['studio-private-media']],role='manager')['status'],403)
  finally:
   with app.db() as c:c.execute("INSERT INTO memberships VALUES('studio-manager','studio-project')")
  self.assertEqual(request('/studio/file',headers={'QUERY_STRING':'path=studio-private-media'})['status'],401)
  self.assertEqual(request('/studio/file',cookie=self.cookies['admin'],headers={'QUERY_STRING':'path=../../etc/passwd'})['status'],400)
 def test_created_class_has_stable_parent_link_and_child_projection(self):
  project=next(s for s in self.call('loadSchools')['data'] if s['id']=='studio-project')
  response=self.call('createClass',[{'school_id':project['id'],'name':'Новый класс'}],requestKey=str(uuid.uuid4()),revisions={project['id']:project['revision']});self.assertEqual(response['status'],200,response)
  group=response['data'];self.assertTrue(group['public_token'])
  created=self.call('createChild',[group['id'],{'first_name':'Пётр','last_name':'Петров'}],requestKey=str(uuid.uuid4()),revisions={group['id']:group['revision']});self.assertEqual(created['status'],200,created)
  public=request('/public/classes/'+group['public_token']);self.assertEqual(public['status'],200,public);self.assertEqual(public['data']['children'][0]['id'],created['data']['id'])
  self.assertEqual(self.call('loadClass',[group['id']])['data']['schoolClass']['public_token'],group['public_token'])
 def test_public_catalog_contains_only_published_fields_and_hides_inactive(self):
  with app.db() as c:
   c.execute('INSERT OR REPLACE INTO parent_catalog VALUES(?,?)',('studio-public',json.dumps({'id':'studio-public','name':'Печать','price':350,'original_url':'PRIVATE','owner_id':'SECRET','referenceMediaId':'PRIVATE'})))
   parent_mutations.write_record(c,'catalog','studio-public','global',{'id':'studio-public','name':'Печать','price':350,'isActive':True})
  public=request('/public/catalog');self.assertEqual(public['status'],200,public)
  item=next(item for item in public['data']['catalog'] if item['id']=='studio-public');self.assertEqual(item,{'id':'studio-public','name':'Печать','price':350})
  with app.db() as c:parent_mutations.write_record(c,'catalog','studio-public','global',{'id':'studio-public','isActive':False})
  self.assertFalse(any(item['id']=='studio-public' for item in request('/public/catalog')['data']['catalog']))
  self.assertIsNone(self.call('getPublicCatalog',['unrecognized-token'])['data'])
 def test_catalog_import_is_additive_idempotent_and_soft_delete_preserves_record(self):
  def upload(metadata,role='admin'):
   boundary='studio-test-boundary';raw=('--'+boundary+'\r\nContent-Disposition: form-data; name="metadata"\r\n\r\n'+json.dumps(metadata)+'\r\n--'+boundary+'--\r\n').encode()
   return request('/studio/import-catalog','POST',raw,self.cookies[role],origin='https://zakaz.khanzama.ru',headers={'CONTENT_TYPE':'multipart/form-data; boundary='+boundary})
  metadata={'userId':'studio-admin','requestKey':str(uuid.uuid4()),'items':[{'sourceId':'studio-imported','name':'Ламинация','price':500}]}
  result=upload(metadata);self.assertEqual(result['status'],200,result);self.assertEqual(result['data'],1);self.assertEqual(upload(metadata)['data'],1)
  metadata['requestKey']=str(uuid.uuid4());metadata['items'][0]['price']=1
  self.assertEqual(upload(metadata)['data'],0)
  item=next(item for item in self.call('loadCatalog')['data'] if item['id']=='studio-imported');self.assertEqual(item['price'],500)
  deleted=self.call('deleteCatalogItems',[[item['id']]],requestKey=str(uuid.uuid4()),revisions={item['id']:item['revision']});self.assertEqual(deleted['status'],200,deleted)
  with app.db() as c:self.assertFalse(json.loads(c.execute("SELECT data FROM sync_records WHERE store='catalog' AND id='studio-imported'").fetchone()[0])['isActive'])
  self.assertFalse(any(item['id']=='studio-imported' for item in request('/public/catalog')['data']['catalog']))
  self.assertEqual(upload(metadata,role='manager')['status'],403)
 def test_inquiries_membership_revision_and_retry(self):
  import studio_api
  with app.db() as c:
   studio_api.initialize(c)
   for iid,pid in [('studio-inquiry','studio-project'),('studio-foreign-inquiry','studio-other'),('studio-unassigned',None)]:c.execute('INSERT OR REPLACE INTO studio_inquiries VALUES(?,?,?,?)',(iid,pid,json.dumps({'status':'new','note':'Ламинация'}),1))
  rows=self.call('loadInquiries',role='manager')['data'];self.assertEqual([row['id'] for row in rows],['studio-inquiry'])
  body={'requestKey':str(uuid.uuid4()),'revisions':{'studio-inquiry':1}}
  response=self.call('updateInquiryStatus',['studio-inquiry','contacted'],role='manager',**body);self.assertEqual(response['status'],200,response)
  self.assertEqual(self.call('updateInquiryStatus',['studio-inquiry','contacted'],role='manager',**body)['status'],200)
  self.assertEqual(self.call('updateInquiryStatus',['studio-foreign-inquiry','closed'],role='manager',requestKey=str(uuid.uuid4()),revisions={'studio-foreign-inquiry':1})['status'],403)
  self.assertEqual(self.call('updateInquiryStatus',['studio-inquiry','closed'],requestKey=str(uuid.uuid4()),revisions={'studio-inquiry':1})['status'],409)
 def test_directory_projects_canonical_roster_without_contacts_media_or_payments(self):
  with app.db() as c:
   parent_mutations.write_record(c,'projects','directory-school','directory-school',{'id':'directory-school','name':'Школа каталога','city':'Грозный','contactName':'PRIVATE','phone':'SECRET'})
   parent_mutations.write_record(c,'classes','directory-class','directory-school',{'id':'directory-class','projectId':'directory-school','name':'6A','teacher':{'phone':'SECRET'}})
   parent_mutations.write_record(c,'students','directory-child','directory-school',{'id':'directory-child','classId':'directory-class','firstName':'Али','lastName':'Алиев','paymentStatus':'paid','mediaIds':['SECRET']})
  response=request('/public/directory',headers={'QUERY_STRING':'query=Грозный'});self.assertEqual(response['status'],200,response)
  school=next(item for item in response['data']['schools'] if item['id']=='directory-school');self.assertEqual(set(school),{'id','name','city','classes'});group=school['classes'][0];self.assertEqual(set(group),{'id','name','token'})
  self.assertNotIn('SECRET',response['raw'].decode());self.assertNotIn('PRIVATE',response['raw'].decode())
  public=request('/public/classes/'+group['token']);self.assertEqual(public['status'],200,public);self.assertEqual(public['data']['children'][0]['public_name'],'Алиев Али');self.assertNotIn('paid',public['raw'].decode())
  again=request('/public/directory',headers={'QUERY_STRING':'query=Грозный'});self.assertEqual(again['data'],response['data'])
  with app.db() as c:c.execute('UPDATE parent_classes SET enabled=0 WHERE id=?',('directory-class',))
  closed=request('/public/directory',headers={'QUERY_STRING':'query=Грозный'});school=next(item for item in closed['data']['schools'] if item['id']=='directory-school');self.assertEqual(school['classes'],[])
  self.assertEqual(request('/public/classes/'+group['token'])['status'],404)
 def test_project_zip_additive_retry_archive_acl_and_traversal(self):
  import io,zipfile
  def zipbody(data,unsafe=False):
   output=io.BytesIO()
   with zipfile.ZipFile(output,'w') as archive:
    archive.writestr('manifest.json',json.dumps({'app':'Vakha Studio','schemaVersion':1,'exportType':'project'}));archive.writestr('data.json',json.dumps(data))
    if unsafe:archive.writestr('../escape','bad')
   return output.getvalue()
  def upload(raw,key,role='admin'):
   boundary='project-studio-boundary';parts=[]
   for name,value in [('city','Грозный'),('year','2026'),('requestKey',key)]:parts.append(('--'+boundary+'\r\nContent-Disposition: form-data; name="'+name+'"\r\n\r\n'+value+'\r\n').encode())
   parts.append(('--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="project.zip"\r\nContent-Type: application/zip\r\n\r\n').encode()+raw+b'\r\n');parts.append(('--'+boundary+'--\r\n').encode())
   return request('/studio/import-project','POST',b''.join(parts),self.cookies[role],origin='https://zakaz.khanzama.ru',headers={'CONTENT_TYPE':'multipart/form-data; boundary='+boundary})
  data={'projects':[{'id':'zip-school','name':'Школа ZIP'}],'classes':[{'id':'zip-class','projectId':'zip-school','name':'7A'}],'students':[{'id':'zip-student','classId':'zip-class','firstName':'Али','lastName':'Алиев','paymentStatus':'paid'}],'orders':[{'id':'zip-order','studentId':'zip-student','items':[{'fileIds':['source-photo'],'status':'done'}]}]}
  raw=zipbody(data);key=str(uuid.uuid4());response=upload(raw,key);self.assertEqual(response['status'],200,response);self.assertEqual(response['data']['added']['students'],1);self.assertEqual(upload(raw,key)['data'],response['data'])
  path=response['data']['archivePath'];download=request('/studio/file',cookie=self.cookies['admin'],headers={'QUERY_STRING':'path='+path});self.assertEqual(download['raw'],raw);self.assertEqual(download['headers']['Content-Type'],'application/zip')
  self.assertEqual(request('/studio/file',cookie=self.cookies['manager'],headers={'QUERY_STRING':'path='+path})['status'],403)
  data['students'][0]['paymentStatus']='unpaid';again=upload(zipbody(data),str(uuid.uuid4()));self.assertEqual(again['data']['added']['students'],0)
  with app.db() as c:self.assertEqual(json.loads(c.execute("SELECT data FROM sync_records WHERE store='students' AND id='zip-student'").fetchone()[0])['paymentStatus'],'paid')
  self.assertEqual(upload(zipbody(data,True),str(uuid.uuid4()))['status'],400)
  self.assertEqual(upload(raw,str(uuid.uuid4()),'manager')['status'],403)
 def test_expired_class_cannot_be_opened_or_mutated_and_analytics_is_scoped(self):
  with app.db() as c:
   parent_mutations.write_record(c,'classes','expired-class','studio-project',{'id':'expired-class','projectId':'studio-project','name':'Expired','parentCatalogExpiresAt':'2020-01-01T00:00:00Z'})
   c.execute('INSERT OR REPLACE INTO parent_classes VALUES(?,?,?,?,?,?,?)',('expired-class','studio-project','Expired','E'*40,1,1,'[]'))
  self.assertEqual(request('/public/classes/'+'E'*40)['status'],404)
  self.assertEqual(request('/public/classes/'+'E'*40,'POST',{},origin='https://zakaz.khanzama.ru')['status'],404)
  request('/public/catalog',headers={'HTTP_USER_AGENT':'PRIVATE USER AGENT'})
  analytics=self.call('loadVisitAnalytics')['data'];self.assertTrue(analytics);self.assertNotIn('PRIVATE USER AGENT',json.dumps(analytics));self.assertNotIn('test',json.dumps(analytics))
  self.assertTrue(all(row['school_id']=='studio-project' for row in self.call('loadVisitAnalytics',role='manager')['data']))
 def test_catalog_seed_uses_source_ids_and_does_not_overwrite_existing_prices(self):
  import tempfile,zipfile,studio_imports,studio_api
  from types import SimpleNamespace
  with tempfile.NamedTemporaryFile(suffix='.zip') as output:
   with zipfile.ZipFile(output.name,'w') as archive:archive.writestr('catalog.json',json.dumps({'services':[{'id':'seed-service','name':'Печать','price':'350.00','previewImage':'','originalImage':''}]}))
   with app.db() as c:
    studio_api.initialize(c);user=c.execute("SELECT * FROM users WHERE id='studio-admin'").fetchone()
    def save(store,value,scope):parent_mutations.write_record(c,store,value['id'],scope,value)
    a=SimpleNamespace(**vars(app));self.assertEqual(studio_imports.seed_catalog_zip(output.name,c,user,a,save),1)
   with app.db() as c:self.assertEqual(studio_imports.seed_catalog_zip(output.name,c,user,a,save),1)
   with app.db() as c:self.assertEqual(json.loads(c.execute("SELECT data FROM sync_records WHERE store='catalog' AND id='seed-service'").fetchone()[0])['price'],350)
 def test_public_note_reaches_parent_order_and_canonical_order_without_overwriting_task_files(self):
  token='N'*40
  with app.db() as c:
   c.execute('INSERT OR REPLACE INTO parent_classes VALUES(?,?,?,?,?,?,?)',('studio-class','studio-project','Note',token,1,1,json.dumps(['note-service'])))
   c.execute('INSERT OR REPLACE INTO parent_children VALUES(?,?,?,?)',('studio-child','studio-class','Али Алиев',1))
   c.execute('INSERT OR REPLACE INTO parent_catalog VALUES(?,?)',('note-service',json.dumps({'id':'note-service','name':'Печать','price':350})))
  response=request('/public/classes/'+token,'POST',{'childId':'studio-child','itemIds':['note-service'],'requestKey':str(uuid.uuid4()),'revision':0,'note':'Позвонить перед печатью','itemPreferences':{'note-service':{'comment':'Ламинация'}}},origin='https://zakaz.khanzama.ru');self.assertEqual(response['status'],200,response);self.assertEqual(response['data']['parent_note'],'Позвонить перед печатью')
  with app.db() as c:
   order=json.loads(c.execute("SELECT data FROM sync_records WHERE store='orders' AND id='order_studio-child'").fetchone()[0]);self.assertEqual(order['parentNote'],'Позвонить перед печатью');self.assertEqual(order['items'][0]['fileIds'],['original'])
 def test_tombstones_and_student_move_close_old_public_access_without_breaking_directory(self):
  with app.db() as c:
   parent_mutations.write_record(c,'projects','deletion-school','deletion-school',{'id':'deletion-school','name':'Удаления'})
   for cid in ('deletion-a','deletion-b'):parent_mutations.write_record(c,'classes',cid,'deletion-school',{'id':cid,'projectId':'deletion-school','name':cid})
   parent_mutations.write_record(c,'students','deletion-child','deletion-school',{'id':'deletion-child','classId':'deletion-a','firstName':'Иван','lastName':'Иванов'})
  directory=request('/public/directory');self.assertEqual(directory['status'],200,directory);school=next(s for s in directory['data']['schools'] if s['id']=='deletion-school');tokens={g['id']:g['token'] for g in school['classes']}
  with app.db() as c:c.execute("UPDATE sync_records SET data=NULL WHERE store='students' AND id='deletion-child'")
  deleted=request('/public/classes/'+tokens['deletion-a']);self.assertEqual(deleted['status'],200,deleted);self.assertEqual(deleted['data']['children'],[])
  denied=request('/public/classes/'+tokens['deletion-a'],'POST',{'childId':'deletion-child','requestKey':str(uuid.uuid4()),'itemIds':['unused']},origin='https://zakaz.khanzama.ru');self.assertEqual(denied['status'],400,denied)
  with app.db() as c:parent_mutations.write_record(c,'students','deletion-child','deletion-school',{'id':'deletion-child','classId':'deletion-b','firstName':'Иван','lastName':'Иванов'})
  moved=request('/public/directory');self.assertEqual(moved['status'],200,moved)
  self.assertEqual(request('/public/classes/'+tokens['deletion-a'])['data']['children'],[])
  self.assertEqual([kid['id'] for kid in request('/public/classes/'+tokens['deletion-b'])['data']['children']],['deletion-child'])
  with app.db() as c:c.execute("UPDATE sync_records SET data=NULL WHERE store='classes' AND id='deletion-a'")
  self.assertEqual(request('/public/classes/'+tokens['deletion-a'])['status'],404)
  self.assertEqual(request('/public/classes/'+tokens['deletion-a'],'POST',{},origin='https://zakaz.khanzama.ru')['status'],404)
  with app.db() as c:c.execute("UPDATE sync_records SET data=NULL WHERE store='projects' AND id='deletion-school'")
  self.assertEqual(request('/public/classes/'+tokens['deletion-b'])['status'],404)
  after=request('/public/directory');self.assertEqual(after['status'],200,after);self.assertFalse(any(s['id']=='deletion-school' for s in after['data']['schools']))

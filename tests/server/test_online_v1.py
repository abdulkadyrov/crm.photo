import hashlib,json,uuid,unittest
from unittest.mock import Mock
from test_cloud import app, request, PASSWORD
import ar_jobs, parent_mutations

class OnlineV1(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  with app.db() as c:
   for role in ('admin','manager','photographer','viewer'):
    uid='v1-'+role;c.execute('INSERT OR REPLACE INTO users VALUES(?,?,?,?,?,1)',(uid,uid,uid,role,app.password_hash(PASSWORD)))
   c.execute("INSERT OR REPLACE INTO projects VALUES('v1-project','School')")
   c.execute("INSERT OR REPLACE INTO projects VALUES('v1-other','Other')")
   for role in ('manager','photographer','viewer'):c.execute('INSERT OR IGNORE INTO memberships VALUES(?,?)',('v1-'+role,'v1-project'))
   parent_mutations.write_record(c,'projects','v1-project','v1-project',{'id':'v1-project','name':'School'})
   parent_mutations.write_record(c,'classes','v1-class','v1-project',{'id':'v1-class','projectId':'v1-project','name':'1A'})
   cls.token='v1_token_'+'a'*32
   c.execute('INSERT OR REPLACE INTO parent_classes VALUES(?,?,?,?,?,?,?)',('v1-class','v1-project','1A',cls.token,1,1,'[]'))
  cls.cookies={role:request('/login','POST',{'login':'v1-'+role,'password':PASSWORD})['headers']['Set-Cookie'].split(';')[0] for role in ('admin','manager','photographer','viewer')}
 def public(self,suffix,body):
  return request('/public/classes/'+self.token+suffix,'POST',body,origin='https://zakaz.khanzama.ru')
 def test_parent_identity_receipts_attachment_optional_and_conflict(self):
  key=str(uuid.uuid4());body={'requestKey':key,'firstName':'Анна','lastName':'Тестовая'}
  child=self.public('/children',body);self.assertEqual(child['status'],200,child);cid=child['data']['child']['id']
  self.assertEqual(self.public('/children',body)['data']['child']['id'],cid)
  self.assertEqual(self.public('/children',{**body,'firstName':'Другая'})['status'],409)
  preview=self.public('/children/preview',{'firstName':'Анна','lastName':'Тестовая'});self.assertEqual(preview['data']['matches'][0]['id'],cid)
  with app.db() as c:
   kid=json.loads(c.execute("SELECT data FROM sync_records WHERE store='students' AND id=?",(cid,)).fetchone()[0]);kid['paymentStatus']='paid'
   parent_mutations.write_record(c,'students',cid,'v1-project',kid)
  payload={'requestKey':str(uuid.uuid4()),'message':'Без фото','revision':0}
  order=self.public('/children/'+cid+'/custom-request',payload);self.assertEqual(order['status'],200,order)
  self.assertEqual(self.public('/children/'+cid+'/custom-request',payload)['data']['id'],order['data']['id'])
  self.assertEqual(self.public('/children/'+cid+'/custom-request',{**payload,'requestKey':str(uuid.uuid4())})['status'],409)
  with app.db() as c:
   stored=json.loads(c.execute("SELECT data FROM sync_records WHERE store='students' AND id=?",(cid,)).fetchone()[0]);self.assertEqual(stored['paymentStatus'],'paid')
   tasks=json.loads(c.execute("SELECT data FROM sync_records WHERE store='orders' AND id=?",('order_'+cid,)).fetchone()[0]);self.assertEqual(len(tasks['items']),1)
 def test_ar_acl_idempotency_and_retry_with_stable_viewer(self):
  with app.db() as c:
   assets=[]
   for name,mime,raw in [('marker','image/jpeg',b'photo'),('video','video/mp4',b'video')]:
    digest=hashlib.sha256(raw).hexdigest();mid='v1-'+name
    c.execute('INSERT OR IGNORE INTO sync_blobs VALUES(?,?,?,?)',('v1-project',digest,len(raw),'v1-admin'))
    parent_mutations.write_record(c,'media',mid,'v1-project',{'id':mid,'studentId':'v1-child','blob':{'$syncBlob':digest,'mime':mime}})
   work={'id':'v1-work','studentId':'v1-child','arPublication':{'requestKey':str(uuid.uuid4()),'markerMediaId':'v1-marker','videoMediaId':'v1-video'}}
   a=type('API',(),{'fail':staticmethod(app.fail),'identifier':staticmethod(app.identifier)})
   for role in ('viewer','photographer'):
    with self.assertRaises(app.Error):ar_jobs.enqueue(a,c,{'role':role},work,'v1-project')
   one=ar_jobs.enqueue(a,c,{'role':'manager'},work,'v1-project');two=ar_jobs.enqueue(a,c,{'role':'manager'},work,'v1-project');self.assertEqual(one['id'],two['id'])
   with self.assertRaises(app.Error):ar_jobs.enqueue(a,c,{'role':'admin'},work,'v1-other')
   parent_mutations.write_record(c,'finalWorks',work['id'],'v1-project',work)
  adapter=Mock();adapter.publish.side_effect=OSError('offline');self.assertTrue(ar_jobs.run_one(app,adapter,now=1000))
  with app.db() as c:self.assertEqual(c.execute('SELECT state FROM ar_jobs WHERE id=?',(one['id'],)).fetchone()[0],'retry')
  adapter.publish.side_effect=None;adapter.publish.return_value={'arWorkId':'stable','viewerUrl':'https://khanzama.ru/ar.photo/view/stable'}
  self.assertTrue(ar_jobs.run_one(app,adapter,now=10000));self.assertEqual(adapter.publish.call_args.args[1],work['arPublication']['requestKey'])
  with app.db() as c:
   final=json.loads(c.execute("SELECT data FROM sync_records WHERE store='finalWorks' AND id=?",(work['id'],)).fetchone()[0]);self.assertEqual(final['qrPayload'],adapter.publish.return_value['viewerUrl'])
  self.assertEqual(request('/ar/jobs/'+one['id'],cookie=self.cookies['viewer'])['status'],200)
 def test_a4_marker_is_pinned_to_request_and_status_lookup_checks_scope(self):
  raw=b'a4-cropped-print';digest=hashlib.sha256(raw).hexdigest()
  with app.db() as c:
   c.execute('INSERT OR IGNORE INTO sync_blobs VALUES(?,?,?,?)',('v1-project',digest,len(raw),'v1-admin'))
   video=hashlib.sha256(b'v-a4').hexdigest()
   c.execute('INSERT OR IGNORE INTO sync_blobs VALUES(?,?,?,?)',('v1-project',video,4,'v1-admin'))
   parent_mutations.write_record(c,'media','v1-a4-video','v1-project',{'id':'v1-a4-video','studentId':'v1-child','blob':{'$syncBlob':video,'mime':'video/mp4'}})
   marker={'$syncBlob':digest,'mime':'image/jpeg'}
   work={'id':'v1-a4-work','studentId':'v1-child','a4PrintImage':{'$syncBlob':'f'*64},'arPublication':{'requestKey':str(uuid.uuid4()),'markerSource':'a4','markerA4Image':marker,'markerMediaId':'v1-a4-work','videoMediaId':'v1-a4-video','frame':'a4-portrait'}}
   job=ar_jobs.enqueue(app,c,{'role':'admin'},work,'v1-project')
   payload=json.loads(job['payload']);self.assertEqual(payload['assets']['marker']['sha256'],digest);self.assertEqual(payload['frame'],'a4-portrait')
   work['a4PrintImage']={'$syncBlob':'e'*64}
   self.assertEqual(ar_jobs.enqueue(app,c,{'role':'admin'},work,'v1-project')['id'],job['id'])
  result=request('/ar/jobs/by-work/v1-a4-work',cookie=self.cookies['manager']);self.assertEqual(result['status'],200);self.assertEqual(result['data']['id'],job['id'])
  with app.db() as c:c.execute('DELETE FROM ar_jobs WHERE id=?',(job['id'],))
 def test_storage_adapter_is_private_and_retains_spool_on_failure(self):
  import private_storage,os,tempfile
  from pathlib import Path
  from unittest.mock import patch
  with patch.dict(os.environ,{'CRM_S3_BUCKET':'private-test'}):
   client=Mock();storage=private_storage.PrivateS3(client)
   with tempfile.TemporaryDirectory() as folder:
    path=Path(folder)/'blob';path.write_bytes(b'keep');digest=hashlib.sha256(b'keep').hexdigest()
    storage.upload('scope',digest,path);args=client.upload_fileobj.call_args.kwargs
    self.assertNotIn('ACL',args['ExtraArgs']);self.assertTrue(path.exists())
    client.upload_fileobj.side_effect=OSError('provider down')
    with self.assertRaises(OSError):storage.upload('scope',digest,path)
    self.assertEqual(path.read_bytes(),b'keep')
   with self.assertRaises(ValueError):storage.key('../other','x')
 def test_ordinary_order_revision_preferences_and_no_duplicate_task(self):
  child=self.public('/children',{'requestKey':str(uuid.uuid4()),'firstName':'Иван','lastName':'Цены'})['data']['child']['id']
  with app.db() as c:
   c.execute('INSERT OR REPLACE INTO parent_catalog VALUES(?,?)',('v1-service',json.dumps({'id':'v1-service','name':'Портрет','price':350,'type':'photo'})))
   c.execute('UPDATE parent_classes SET services=? WHERE id=?',(json.dumps(['v1-service']),'v1-class'))
  b={'childId':child,'requestKey':str(uuid.uuid4()),'itemIds':['v1-service'],'withoutLaminationIds':['v1-service'],'itemPreferences':{'v1-service':{'comment':'В обнимку','videoAddonRequested':True}},'revision':0}
  one=self.public('',b);self.assertEqual(one['status'],200,one);self.assertEqual(one['data']['total_amount'],800)
  self.assertEqual(one['data']['selected_items'][0]['parentComment'],'В обнимку')
  self.assertEqual(self.public('',b)['data']['id'],one['data']['id'])
  updated=self.public('',{**b,'requestKey':str(uuid.uuid4()),'revision':1,'itemPreferences':{'v1-service':{'comment':'Новое пожелание','videoAddonRequested':False}}});self.assertEqual(updated['status'],200,updated);self.assertEqual(updated['data']['total_amount'],300)
  self.assertEqual(self.public('',{**b,'requestKey':str(uuid.uuid4()),'revision':1})['status'],409)
  with app.db() as c:
   order=json.loads(c.execute("SELECT data FROM sync_records WHERE store='orders' AND id=?",('order_'+child,)).fetchone()[0]);self.assertEqual(len(order['items']),1);self.assertIn('Новое пожелание',order['items'][0]['comment'])
  get=request('/public/classes/'+self.token);kid=next(k for k in get['data']['children'] if k['id']==child);self.assertEqual(kid['orders'][0]['revision'],2);self.assertNotIn('public_token',kid['orders'][0])
 def test_private_multipart_video_retry_and_child_scope(self):
  child=self.public('/children',{'requestKey':str(uuid.uuid4()),'firstName':'Видео','lastName':'Тест'})['data']['child']['id']
  with app.db() as c:
   c.execute('INSERT OR REPLACE INTO parent_catalog VALUES(?,?)',('v1-video-service',json.dumps({'id':'v1-video-service','name':'Фото','price':350})))
   c.execute('UPDATE parent_classes SET services=? WHERE id=?',(json.dumps(['v1-video-service']),'v1-class'))
  first=self.public('',{'childId':child,'requestKey':str(uuid.uuid4()),'revision':0,'itemIds':['v1-video-service'],'itemPreferences':{'v1-video-service':{'videoAddonRequested':True}}});self.assertEqual(first['status'],200,first)
  key=str(uuid.uuid4());boundary='test-boundary';video=b'\x00\x00\x00\x18ftypisom'+b'video'
  fields={'requestKey':key,'revision':'1','itemId':'v1-video-service'}
  raw=b''.join((f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n').encode() for k,v in fields.items())
  raw+=(f'--{boundary}\r\nContent-Disposition: form-data; name="video"; filename="own.mp4"\r\nContent-Type: video/mp4\r\n\r\n').encode()+video+f'\r\n--{boundary}--\r\n'.encode()
  def send(cid):return request('/public/classes/'+self.token+'/children/'+cid+'/service-video','POST',raw,origin='https://zakaz.khanzama.ru',headers={'CONTENT_TYPE':'multipart/form-data; boundary='+boundary})
  result=send(child);self.assertEqual(result['status'],200,result);self.assertEqual(result['data']['revision'],2)
  mid=result['data']['selected_items'][0]['parentVideoMediaId'];self.assertEqual(send(child)['data']['selected_items'][0]['parentVideoMediaId'],mid)
  self.assertEqual(send('foreign-child')['status'],409) # same request key is bound to original path
  with app.db() as c:
   media=json.loads(c.execute("SELECT data FROM sync_records WHERE store='media' AND id=?",(mid,)).fetchone()[0]);self.assertEqual(media['studentId'],child);self.assertEqual(media['type'],'video')
   self.assertEqual(c.execute("SELECT COUNT(*) FROM sync_records WHERE store='media' AND id=?",(mid,)).fetchone()[0],1)
 def test_publication_link_and_sibling_denial(self):
  u={'id':'v1-manager','role':'manager'}
  with app.db() as c:
   parent_mutations.write_record(c,'finalWorks','foreign-work','v1-other',{'id':'foreign-work','studentId':'foreign'})
   c.execute("INSERT INTO ar_jobs(id,scope,work_id,request_key,payload,state,created,updated) VALUES('foreign-job','v1-other','foreign-work','foreign-key','{}','queued',0,0)")
  self.assertEqual(request('/ar/jobs/foreign-job',cookie=self.cookies['manager'])['status'],403)
  with app.db() as c:c.execute("DELETE FROM ar_jobs WHERE id='foreign-job'")
 def test_custom_request_survives_ordinary_cart_update(self):
  child=self.public('/children',{'requestKey':str(uuid.uuid4()),'firstName':'Особый','lastName':'Заказ'})['data']['child']['id']
  boundary='custom-boundary';fields={'requestKey':str(uuid.uuid4()),'revision':'0','message':'Индивидуальный фон'}
  raw=b''.join((f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n').encode() for k,v in fields.items())
  raw+=(f'--{boundary}\r\nContent-Disposition: form-data; name="reference"; filename="reference.jpg"\r\nContent-Type: image/jpeg\r\n\r\n').encode()+b'\xff\xd8\xffreference'+f'\r\n--{boundary}--\r\n'.encode()
  custom=request('/public/classes/'+self.token+'/children/'+child+'/custom-request','POST',raw,origin='https://zakaz.khanzama.ru',headers={'CONTENT_TYPE':'multipart/form-data; boundary='+boundary});self.assertEqual(custom['status'],200,custom)
  entry=custom['data']['selected_items'][0];self.assertTrue(entry.get('referenceMediaId'))
  with app.db() as c:
   c.execute('INSERT OR REPLACE INTO parent_catalog VALUES(?,?)',('v1-normal',json.dumps({'id':'v1-normal','name':'Обычная услуга','price':350})))
   c.execute('UPDATE parent_classes SET services=? WHERE id=?',(json.dumps(['v1-normal']),'v1-class'))
  update=self.public('',{'childId':child,'requestKey':str(uuid.uuid4()),'revision':1,'itemIds':['v1-normal']});self.assertEqual(update['status'],200,update)
  retained=next(item for item in update['data']['selected_items'] if item.get('requestType')=='custom');self.assertEqual(retained,entry)
  with app.db() as c:
   order=json.loads(c.execute("SELECT data FROM sync_records WHERE store='orders' AND id=?",('order_'+child,)).fetchone()[0]);self.assertEqual(len(order['items']),2)
 def test_materialize_matches_existing_selection_without_resetting_payment_or_files(self):
  with app.db() as c:
   child='v1-existing';service='v1-existing-service'
   parent_mutations.write_record(c,'students',child,'v1-project',{'id':child,'classId':'v1-class','paymentStatus':'paid','catalogIds':[service],'selectedServices':[{'serviceId':service,'quantity':1}]})
   parent_mutations.write_record(c,'orders','order_'+child,'v1-project',{'id':'order_'+child,'studentId':child,'items':[{'type':'original-task','status':'done','fileIds':['local-photo']}]})
   group=c.execute("SELECT * FROM parent_classes WHERE id='v1-class'").fetchone()
   order={'id':'v1-existing-order','child_id':child,'status':'new','selected_items':[{'id':service,'name':'Фото','price':350,'comment':'Пожелание'}]}
   parent_mutations.materialize(c,group,order);parent_mutations.materialize(c,group,order)
   kid=json.loads(c.execute("SELECT data FROM sync_records WHERE store='students' AND id=?",(child,)).fetchone()[0]);self.assertEqual(len(kid['selectedServices']),1);self.assertEqual(kid['paymentStatus'],'paid')
   tasks=json.loads(c.execute("SELECT data FROM sync_records WHERE store='orders' AND id=?",('order_'+child,)).fetchone()[0])['items'];self.assertEqual(tasks[0]['status'],'done');self.assertEqual(tasks[0]['fileIds'],['local-photo']);self.assertEqual(len(tasks),2)

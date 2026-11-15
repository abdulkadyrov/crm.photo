"""Strict staff facade over canonical CRM records. No parallel school/child database."""
import hashlib,json,secrets,time,uuid
import studio_media,studio_public_catalog,studio_imports
from urllib.parse import parse_qs
from datetime import datetime,timezone

READ={'loadSchools','loadSchool','loadClass','loadCatalog','loadOrders','loadOrdersWorkspace','getProfile','getPrivateMediaUrls','getPublicCatalog','loadInquiries','loadVisitAnalytics'}
WRITE={'createSchool','updateSchool','createClass','updateClass','createChild','updateChild','importChildren','updateCatalogItem','updateOrderStatus','updateProfile','deleteCatalogItems','updateInquiryStatus'}
MAP={'projects':{'name':'name','city':'city','address':'address','contact_name':'contactName','status':'studioStatus'},'classes':{'name':'name','academic_year':'academicYear','teacher_name':'teacherName','photo_session_name':'photoSessionName','public_expires_at':'parentCatalogExpiresAt','status':'studioStatus'},'students':{'first_name':'firstName','last_name':'lastName','public_name':'publicName','status':'studioStatus'},'catalog':{'name':'name','description':'description','short_description':'shortDescription','category':'category','gender':'gender','price':'price','type':'type','popular':'popular','is_active':'isActive','sort_order':'orderIndex','parent_preview_mode':'parentPreviewMode'}}

def initialize(c):
 c.executescript('CREATE TABLE IF NOT EXISTS studio_receipts(actor TEXT,key TEXT,hash TEXT,result TEXT,PRIMARY KEY(actor,key)); CREATE TABLE IF NOT EXISTS studio_profiles(actor TEXT PRIMARY KEY,data TEXT,revision INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS studio_archives(id TEXT,project_id TEXT,digest TEXT,PRIMARY KEY(id,project_id)); CREATE TABLE IF NOT EXISTS studio_inquiries(id TEXT PRIMARY KEY,project_id TEXT,data TEXT,revision INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS studio_visits(id INTEGER PRIMARY KEY,project_id TEXT,data TEXT);')

def route(r,c,u,path,a):
 a.fail(u['role'] not in ('admin','manager'),403,'Только администратор или менеджер')
 initialize(c)
 if path=='/studio/file':
  a.fail(r.method!='GET',405,'Метод не поддерживается')
  opaque=parse_qs(r.e.get('QUERY_STRING','')).get('path',[''])[0]
  value,target,mime=studio_media.resolve(c,u,opaque,a)
  return a.Media(target,mime=mime,private=True)
 project_import=path=='/studio/import-project'
 catalog_import=path=='/studio/import-catalog'
 a.fail(path not in ('/studio/call','/studio/import-catalog','/studio/import-project') or r.method!='POST',404,'Не найдено')
 b={} if catalog_import or project_import else r.json();action='importCatalog' if catalog_import else 'importProject' if project_import else b.get('action');args=b.get('args',[]);revisions=b.get('revisions',{})
 a.fail(not isinstance(action,str) or not isinstance(args,list) or len(args)>8 or not isinstance(revisions,dict))
 a.fail(any(type(value) is not int or value<0 for value in revisions.values()))
 arity={'loadSchools':(0,0),'loadSchool':(1,1),'loadClass':(1,1),'loadCatalog':(0,0),'loadOrders':(0,0),'loadOrdersWorkspace':(0,0),'getProfile':(0,1),'getPrivateMediaUrls':(1,1),'getPublicCatalog':(1,1),'loadInquiries':(0,0),'loadVisitAnalytics':(0,0),'updateInquiryStatus':(2,2),'createSchool':(1,1),'createClass':(1,1),'createChild':(2,2),'updateSchool':(2,2),'updateClass':(2,2),'updateChild':(2,2),'importChildren':(2,2),'updateCatalogItem':(2,2),'updateOrderStatus':(2,2),'updateProfile':(2,2),'deleteCatalogItems':(1,1)}
 if action in arity:a.fail(not arity[action][0]<=len(args)<=arity[action][1])
 a.fail(not catalog_import and not project_import and action not in READ|WRITE,501,'Действие staff API не реализовано')
 initialize(c)
 if action in WRITE:
  c.execute('BEGIN IMMEDIATE');key=a.identifier(b.get('requestKey'));digest=hashlib.sha256(json.dumps({'action':action,'args':args,'revisions':revisions},sort_keys=True).encode()).hexdigest()
  receipt=c.execute('SELECT * FROM studio_receipts WHERE actor=? AND key=?',(u['id'],key)).fetchone()
  if receipt:
   a.fail(receipt['hash']!=digest,409,'requestKey конфликт')
 def row(store,rid):
  rid=a.identifier(rid);record=c.execute('SELECT * FROM sync_records WHERE store=? AND id=? AND data IS NOT NULL',(store,rid)).fetchone();a.fail(not record,404,'Запись не найдена');return record,json.loads(record['data'])
 def access(record):
  if record['scope']=='global':a.fail(u['role']!='admin' and not c.execute('SELECT 1 FROM memberships WHERE user_id=?',(u['id'],)).fetchone(),403,'Нет проектов')
  else:a.access(c,u,record['scope'])
 def checked(store,rid):
  record,value=row(store,rid);access(record);return record,value
 def expected(record):a.fail(revisions.get(record['id'])!=record['seq'],409,'version_conflict')
 def records(store):
  return [(record,json.loads(record['data'])) for record in c.execute('SELECT * FROM sync_records WHERE store=? AND data IS NOT NULL',(store,)) if u['role']=='admin' or record['scope']=='global' or c.execute('SELECT 1 FROM memberships WHERE user_id=? AND project_id=?',(u['id'],record['scope'])).fetchone()]
 def save(store,value,scope):
  encoded=json.dumps(value,ensure_ascii=False);seq=c.execute('INSERT INTO sync_changes(store,id,scope,data,actor,at) VALUES(?,?,?,?,?,?)',(store,value['id'],scope,encoded,u['id'],time.time())).lastrowid
  c.execute('INSERT INTO sync_records VALUES(?,?,?,?,?) ON CONFLICT(store,id) DO UPDATE SET data=excluded.data,seq=excluded.seq',(store,value['id'],scope,encoded,seq))
  if store=='projects':c.execute('INSERT INTO projects VALUES(?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name',(value['id'],value.get('name','Школа')))
  if store=='classes' and not c.execute('SELECT 1 FROM parent_classes WHERE id=?',(value['id'],)).fetchone():
   token=secrets.token_urlsafe(32);services=[row[0] for row in c.execute('SELECT id FROM parent_catalog')]
   c.execute('INSERT INTO parent_classes VALUES(?,?,?,?,?,?,?)',(value['id'],scope,value['name'],token,1,1,json.dumps(services)))
  a.sync_api.update_public_projection(a,c,store,value['id'],value,None)
  if value.get('studioStatus')=='archived':
   if store=='students':c.execute('UPDATE parent_children SET active=0 WHERE id=?',(value['id'],))
   elif store=='classes':c.execute('UPDATE parent_classes SET enabled=0 WHERE id=?',(value['id'],))
   elif store=='projects':c.execute('UPDATE parent_classes SET enabled=0 WHERE project_id=?',(value['id'],))
  return checked(store,value['id'])
 if catalog_import:return studio_imports.catalog(r,c,u,a,save)
 if project_import:return studio_imports.project(r,c,u,a,save)
 def view(store,record,value):
  out={'id':value['id'],'crm_source_id':value['id'],'owner_id':value.get('createdBy',''),'created_at':value.get('createdAt',''),'updated_at':value.get('updatedAt',''),'revision':record['seq'],'status':value.get('studioStatus','active')}
  if store=='projects':
   out.update(name=value.get('name',''),city=value.get('city',''),address=value.get('address',''),contact_name=value.get('contactName',''))
   archive=c.execute('SELECT id FROM studio_archives WHERE project_id=? ORDER BY rowid DESC LIMIT 1',(value['id'],)).fetchone()
   if archive:out['crm_archive_path']=archive['id']
  elif store=='classes':
   published=c.execute('SELECT token FROM parent_classes WHERE id=?',(value['id'],)).fetchone()
   out.update(school_id=value['projectId'],name=value.get('name',''),academic_year=value.get('academicYear',''),teacher_name=(value.get('teacher') or {}).get('name',value.get('teacherName','')),photo_session_name=value.get('photoSessionName',''),public_token=published['token'] if published else '',public_expires_at=value.get('parentCatalogExpiresAt'))
  elif store=='students':out.update(class_id=value['classId'],first_name=value.get('firstName',''),last_name=value.get('lastName',''),public_name=value.get('publicName') or (value.get('lastName','')+' '+value.get('firstName','')).strip())
  else:
   out.update(source_id=value['id'],source='crm',original_url='/api/v1/studio/file?path=catalog_'+value['id'] if value.get('originalDataUrl') or value.get('originalImageDataUrl') else '',preview_url='',preview_video_url='')
   for external,internal in MAP['catalog'].items():out[external]=value.get(internal,False if external=='popular' else True if external=='is_active' else 0 if external in ('price','sort_order') else '')
   published=c.execute('SELECT data FROM parent_catalog WHERE id=?',(value['id'],)).fetchone()
   if published:
    public=json.loads(published['data']);out.update(preview_url=public.get('preview_url',''),preview_video_url=public.get('preview_video_url',''))
   if u['role']!='admin':out['price_hidden']=True
  return out
 def all_view(store):return [view(store,record,a.strip_finance(value) if u['role']!='admin' and store=='catalog' else value) for record,value in records(store)]
 def orders():
  output=[]
  for entry in c.execute('SELECT o.*,g.project_id FROM parent_orders o JOIN parent_classes g ON g.id=o.class_id'):
   if u['role']!='admin' and not c.execute('SELECT 1 FROM memberships WHERE user_id=? AND project_id=?',(u['id'],entry['project_id'])).fetchone():continue
   data=json.loads(entry['data']);data.pop('public_token',None);data.update(revision=data.get('revision',1),parent_note=data.get('parent_note',''),owner_id='')
   if u['role']!='admin':data=a.strip_finance(data)
   child_record=c.execute("SELECT data FROM sync_records WHERE store='students' AND id=? AND data IS NOT NULL",(entry['child_id'],)).fetchone();child=json.loads(child_record[0]) if child_record else {}
   group_record=c.execute('SELECT name FROM parent_classes WHERE id=?',(entry['class_id'],)).fetchone();school_record=c.execute('SELECT name FROM projects WHERE id=?',(entry['project_id'],)).fetchone()
   data.update(child={'first_name':child.get('firstName',''),'last_name':child.get('lastName',''),'public_name':child.get('publicName') or data.get('child_name','')},**{'class':{'name':group_record['name'],'school_id':entry['project_id'],'school':{'name':school_record['name']}}})
   data['selected_items']=[studio_media.aliases(c,u,item,a) for item in data.get('selected_items',[])]
   output.append(data)
  return output
 def stats_schools():
  schools=all_view('projects');groups=all_view('classes');kids=all_view('students');requests=orders()
  for school in schools:
   ids={g['id'] for g in groups if g['school_id']==school['id'] and g['status']=='active'};school.update(classes_count=len(ids),children_count=sum(k['class_id'] in ids and k['status']=='active' for k in kids),orders_count=sum(o['class_id'] in ids and o['status']!='cancelled' for o in requests))
  return schools
 def profile():
  record=c.execute('SELECT * FROM studio_profiles WHERE actor=?',(u['id'],)).fetchone()
  value={'id':u['id'],'full_name':u['name'],'role':u['role'],'company_name':'','manager_name':'','whatsapp_phone':'','whatsapp_template':'','watermark_text':'','watermark_image':'','watermark_opacity':.2,'public_catalog_token':'','revision':record['revision'] if record else 0,**(json.loads(record['data']) if record else {})}
  value.update(id=u['id'],full_name=u['name'],role=u['role']);return value
 if action in WRITE:
  if action in ('createSchool','updateCatalogItem','deleteCatalogItems'):a.fail(u['role']!='admin',403,'Только администратор')
  if action=='createClass':a.fail(not isinstance(args[0],dict));checked('projects',args[0].get('school_id'))
  if action in ('createChild','importChildren'):checked('classes',args[0])
  if action in ('updateSchool','updateClass','updateChild'):checked({'updateSchool':'projects','updateClass':'classes','updateChild':'students'}[action],args[0])
  if action=='updateProfile':a.fail(args[0]!=u['id'],403,'Чужой профиль')
  if action=='updateInquiryStatus':
   inquiry=c.execute('SELECT * FROM studio_inquiries WHERE id=?',(a.identifier(args[0]),)).fetchone();a.fail(not inquiry,404,'Обращение не найдено')
   if inquiry['project_id']:a.access(c,u,inquiry['project_id'])
   else:a.fail(u['role']!='admin',403,'Обращение без проекта доступно администратору')
  if action=='updateOrderStatus':
   target=c.execute('SELECT g.project_id FROM parent_orders o JOIN parent_classes g ON g.id=o.class_id WHERE o.id=?',(a.identifier(args[0]),)).fetchone();a.fail(not target,404,'Заказ не найден');a.access(c,u,target['project_id'])
  if action=='deleteCatalogItems':
   a.fail(not isinstance(args[0],list) or len(args[0])>1000)
   for rid in args[0]:checked('catalog',rid)
  if receipt:
   cached=json.loads(receipt['result'])
   if action=='updateProfile':cached.update(id=u['id'],role=u['role'],full_name=u['name'])
   return cached if u['role']=='admin' else a.strip_finance(cached)
 if action in ('loadInquiries','loadVisitAnalytics'):
  table='studio_inquiries' if action=='loadInquiries' else 'studio_visits';result=[]
  for entry in c.execute('SELECT * FROM '+table):
   if u['role']!='admin' and (not entry['project_id'] or not c.execute('SELECT 1 FROM memberships WHERE user_id=? AND project_id=?',(u['id'],entry['project_id'])).fetchone()):continue
   value=json.loads(entry['data']);value['id']=entry['id']
   if action=='loadInquiries':value['revision']=entry['revision']
   result.append(value if u['role']=='admin' else a.strip_finance(value))
 elif action=='updateInquiryStatus':
  a.fail(revisions.get(inquiry['id'])!=inquiry['revision'],409,'version_conflict');a.fail(args[1] not in ('new','contacted','closed'))
  value=json.loads(inquiry['data']);value['status']=args[1];c.execute('UPDATE studio_inquiries SET data=?,revision=revision+1 WHERE id=?',(json.dumps(value),inquiry['id']));result=None
 elif action=='getPublicCatalog':
  a.fail(not isinstance(args[0],str) or len(args[0])>100);result=studio_public_catalog.payload(c,args[0])
 elif action=='getPrivateMediaUrls':result=studio_media.urls(c,u,args[0],a)
 elif action=='loadSchools':result=stats_schools()
 elif action=='loadSchool':
  checked('projects',args[0]);school=next(s for s in stats_schools() if s['id']==args[0]);groups=[g for g in all_view('classes') if g['school_id']==args[0]];kids=all_view('students');requests=orders()
  for group in groups:
   children=[k for k in kids if k['class_id']==group['id'] and k['status']=='active'];chosen={o['child_id'] for o in requests if o['class_id']==group['id'] and o['status']!='cancelled'};group.update(children_count=len(children),orders_count=sum(o['class_id']==group['id'] and o['status']!='cancelled' for o in requests),missing_orders_count=sum(k['id'] not in chosen for k in children))
  result={'school':school,'classes':groups}
 elif action=='loadClass':
  record,value=checked('classes',args[0]);p,pv=checked('projects',value['projectId']);result={'schoolClass':view('classes',record,value),'school':view('projects',p,pv),'children':[k for k in all_view('students') if k['class_id']==args[0]],'orders':[o for o in orders() if o['class_id']==args[0]]}
 elif action=='loadCatalog':result=all_view('catalog')
 elif action in ('loadOrders','loadOrdersWorkspace'):result=orders() if action=='loadOrders' else {'orders':orders(),'schools':all_view('projects'),'classes':all_view('classes')}
 elif action=='getProfile':
  a.fail(args and args[0] and args[0]!=u['id'],403,'Чужой профиль');result=profile()
 elif action=='deleteCatalogItems':
  targets=[checked('catalog',rid) for rid in args[0]]
  for record,value in targets:expected(record)
  for record,value in targets:save('catalog',{**value,'isActive':False},'global')
  result=None
 elif action=='updateProfile':
  a.fail(args[0]!=u['id'],403,'Чужой профиль');previous=profile();a.fail(revisions.get(u['id'])!=previous['revision'],409,'version_conflict');allowed={'company_name','manager_name','whatsapp_phone','whatsapp_template','watermark_text','watermark_image','watermark_opacity'};a.fail(not isinstance(args[1],dict) or set(args[1])-allowed)
  for field,v in args[1].items():
   if field=='watermark_opacity':a.fail(type(v) not in (int,float) or not 0<=v<=1)
   else:a.fail(not isinstance(v,str) or len(v)>10000)
  value={**previous,**args[1]};value['public_catalog_token']=previous.get('public_catalog_token') or secrets.token_urlsafe(32);value['revision']+=1;c.execute('INSERT INTO studio_profiles VALUES(?,?,?) ON CONFLICT(actor) DO UPDATE SET data=excluded.data,revision=excluded.revision',(u['id'],json.dumps(value),value['revision']));result=value
 elif action=='updateOrderStatus':
  rid=a.identifier(args[0]);entry=c.execute('SELECT o.*,g.project_id FROM parent_orders o JOIN parent_classes g ON g.id=o.class_id WHERE o.id=?',(rid,)).fetchone();a.fail(not entry,404,'Заказ не найден');a.access(c,u,entry['project_id']);value=json.loads(entry['data']);a.fail(revisions.get(rid)!=value.get('revision',1),409,'version_conflict');a.fail(args[1] not in ('new','confirmed','in_progress','ready','cancelled'));value.update(status=args[1],revision=value.get('revision',1)+1);c.execute('UPDATE parent_orders SET data=? WHERE id=?',(json.dumps(value),rid));result=value;result.pop('public_token',None)
 else:
  store='projects' if 'School' in action else 'classes' if 'Class' in action else 'catalog' if 'Catalog' in action else 'students'
  a.fail(store=='catalog' and u['role']!='admin',403,'Каталог изменяет администратор')
  creating=action.startswith('create');importing=action=='importChildren';payload=args[-1]
  if creating:
   a.fail(store=='projects' and u['role']!='admin',403,'Школы создаёт администратор');rid=str(uuid.uuid4());value={'id':rid,'createdBy':u['id'],'createdAt':datetime.now(timezone.utc).isoformat()};scope=rid
   if store=='classes':p,pv=checked('projects',payload['school_id']);expected(p);scope=p['scope'];value['projectId']=pv['id']
   if store=='students':g,gv=checked('classes',args[0]);expected(g);scope=g['scope'];value.update(classId=gv['id'],paymentStatus='unpaid',catalogIds=[],selectedServices=[])
  elif importing:
   g,gv=checked('classes',args[0]);expected(g);a.fail(not isinstance(payload,list) or len(payload)>1000);added=0;skipped=0
   existing={(v.get('firstName','').strip().casefold(),v.get('lastName','').strip().casefold()) for rec,v in records('students') if v['classId']==gv['id']}
   for item in payload:
    first=a.text(item.get('first_name'));last=a.text(item.get('last_name'));identity=(first.casefold(),last.casefold())
    if identity in existing:skipped+=1;continue
    value={'id':str(uuid.uuid4()),'classId':gv['id'],'firstName':first,'lastName':last,'paymentStatus':'unpaid','catalogIds':[],'selectedServices':[]};save('students',value,g['scope']);existing.add(identity);added+=1
   result={'added':added,'skipped':skipped}
  else:record,value=checked(store,args[0]);expected(record);scope=record['scope']
  if not importing:
   a.fail(not isinstance(payload,dict))
   if payload.get('public_expires_at') is not None:
    try:
     expiry=datetime.fromisoformat(payload['public_expires_at'].replace('Z','+00:00'));a.fail(expiry.tzinfo is None)
    except (ValueError,TypeError,AttributeError):raise a.Error(400,'Некорректный срок ссылки')
   allowed=set(MAP[store])|({'school_id'} if creating and store=='classes' else set());a.fail(set(payload)-allowed,400,'Поля вне whitelist')
   for field,input_value in payload.items():
    if field=='school_id':continue
    if field=='price':a.fail(type(input_value) not in (int,float) or not 0<=input_value<=10000000)
    if field in ('popular','is_active'):a.fail(type(input_value) is not bool)
    if field=='sort_order':a.fail(type(input_value) is not int)
    if field=='status':a.fail(input_value not in ('active','archived'))
    if field in ('name','first_name','last_name'):input_value=a.text(input_value)
    elif isinstance(input_value,str):a.fail(len(input_value)>10000)
    value[MAP[store][field]]=input_value
    if store=='classes' and field=='teacher_name':value['teacher']={**(value.get('teacher') or {}),'name':input_value}
   if store in ('projects','classes'):a.fail(not isinstance(value.get('name'),str) or not value['name'].strip())
   if store=='students':
    a.fail(not value.get('firstName') or not value.get('lastName'))
    a.fail(any(v['id']!=value['id'] and v['classId']==value['classId'] and v.get('firstName','').casefold()==value['firstName'].casefold() and v.get('lastName','').casefold()==value['lastName'].casefold() and v.get('studioStatus','active')=='active' for rec,v in records('students')),409,'children_active_name_unique')
   value['updatedAt']=datetime.now(timezone.utc).isoformat();record,value=save(store,value,scope);result=view(store,record,value)
 if action in WRITE:
  if u['role']!='admin':result=a.strip_finance(result)
  a.audit(c,u,'studio_'+action);c.execute('INSERT INTO studio_receipts VALUES(?,?,?,?)',(u['id'],key,digest,json.dumps(result)))
 return result

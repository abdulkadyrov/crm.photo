"""Explicitly public school/class directory, backed by canonical CRM roster only."""
import json,secrets,time
from datetime import datetime,timezone
from urllib.parse import parse_qs

def active(value):
 return value.get('studioStatus')!='archived' and value.get('archived') is not True

def expired(value):
 stamp=value.get('parentCatalogExpiresAt')
 if not stamp:return False
 try:return datetime.fromisoformat(stamp.replace('Z','+00:00')).astimezone(timezone.utc)<=datetime.now(timezone.utc)
 except (ValueError,TypeError):return True

def project_roster(c,a):
 """Publish only absent class links; synchronize names without reopening closed links."""
 projects={}
 for row in c.execute("SELECT id,data FROM sync_records WHERE store='projects' AND data IS NOT NULL"):
  value=json.loads(row['data'])
  if active(value):
   projects[row['id']]=value
   c.execute('INSERT INTO projects VALUES(?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name',(row['id'],str(value.get('name') or 'Школа')))
 services=[]
 for row in c.execute('SELECT id,data FROM parent_catalog'):
  if json.loads(row['data']).get('is_active') is not False:services.append(row['id'])
 groups={}
 for row in list(c.execute("SELECT id,scope,data FROM sync_records WHERE store='classes' AND data IS NOT NULL")):
  value=json.loads(row['data']);pid=value.get('projectId')
  if pid not in projects or row['scope']!=pid or not active(value) or expired(value):continue
  cid=row['id'];name=value.get('name')
  if not isinstance(name,str) or not name.strip():continue
  published=c.execute('SELECT * FROM parent_classes WHERE id=?',(cid,)).fetchone()
  if published and published['project_id']!=pid:
   c.execute('UPDATE parent_classes SET enabled=0,revision=revision+1 WHERE id=? AND enabled=1',(cid,))
   continue
  if not published:
   c.execute('INSERT INTO parent_classes VALUES(?,?,?,?,?,?,?)',(cid,pid,name,secrets.token_urlsafe(32),1,1,json.dumps(services)))
   published=c.execute('SELECT * FROM parent_classes WHERE id=?',(cid,)).fetchone()
  elif published['name']!=name:
   c.execute('UPDATE parent_classes SET name=?,revision=revision+1 WHERE id=?',(name,cid))
  publish_canonical_link(c,cid,pid,value,published['token'])
  if published['enabled']:groups[cid]={'id':cid,'name':name,'token':published['token'],'projectId':pid}
 refresh_children(c)
 for row in list(c.execute("SELECT id,scope,data FROM sync_records WHERE store='students' AND data IS NOT NULL")):
  value=json.loads(row['data']);cid=value.get('classId')
  if cid not in groups or row['scope']!=groups[cid]['projectId']:continue
  name=(value.get('lastName','')+' '+value.get('firstName','')).strip()
  if not name:continue
  previous=c.execute('SELECT * FROM parent_children WHERE id=?',(row['id'],)).fetchone()
  if previous and previous['class_id']!=cid:
   c.execute('UPDATE parent_classes SET revision=revision+1 WHERE id=?',(previous['class_id'],))
  enabled=int(active(value))
  if not previous or previous['name']!=name or previous['active']!=enabled or previous['class_id']!=cid:
   c.execute('INSERT INTO parent_children VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET class_id=excluded.class_id,name=excluded.name,active=excluded.active',(row['id'],cid,name,enabled))
   c.execute('UPDATE parent_classes SET revision=revision+1 WHERE id=?',(cid,))
 return projects,groups

def route(r,c,a):
 a.fail(r.method!='GET',405,'Метод не поддерживается')
 query=parse_qs(r.e.get('QUERY_STRING','')).get('query',[''])[0].strip().casefold();a.fail(len(query)>200)
 c.execute('BEGIN IMMEDIATE')
 projects,groups=project_roster(c,a)
 schools=[]
 for pid,value in projects.items():
  name=str(value.get('name') or '');city=str(value.get('city') or '')
  classes=[{key:group[key] for key in ('id','name','token')} for group in groups.values() if group['projectId']==pid]
  if query and query not in (name+' '+city+' '+' '.join(group['name'] for group in classes)).casefold():continue
  schools.append({'id':pid,'name':name,'city':city,'classes':sorted(classes,key=lambda group:group['name'].casefold())})
 return {'schools':sorted(schools,key=lambda school:school['name'].casefold())}

def assert_available(c,token,a):
 group=c.execute('SELECT id,project_id FROM parent_classes WHERE token=?',(token,)).fetchone()
 if not group:return
 for store,rid in (('classes',group['id']),('projects',group['project_id'])):
  row=c.execute('SELECT scope,data FROM sync_records WHERE store=? AND id=?',(store,rid)).fetchone()
  if row:
   a.fail(row['data'] is None or row['scope']!=group['project_id'],404,'Приём заказов закрыт')
   value=json.loads(row['data']);a.fail(not active(value) or store=='classes' and (expired(value) or value.get('projectId')!=group['project_id']),404,'Приём заказов закрыт')


def refresh_children(c,class_id=None):
 query='SELECT * FROM parent_children WHERE active=1'
 rows=list(c.execute(query+(' AND class_id=?' if class_id else ''),(class_id,) if class_id else ()))
 for child in rows:
  row=c.execute("SELECT scope,data FROM sync_records WHERE store='students' AND id=?",(child['id'],)).fetchone()
  if not row:continue # Legacy published roster without a canonical record remains supported.
  value=json.loads(row['data']) if row['data'] is not None else None
  group=c.execute('SELECT project_id FROM parent_classes WHERE id=?',(child['class_id'],)).fetchone()
  if value is None or not active(value) or value.get('classId')!=child['class_id'] or not group or row['scope']!=group['project_id']:
   c.execute('UPDATE parent_children SET active=0 WHERE id=?',(child['id'],))
   c.execute('UPDATE parent_classes SET revision=revision+1 WHERE id=?',(child['class_id'],))

def publish_canonical_link(c,cid,pid,value,token):
 """Replace obsolete export links using the existing server token, without changing the roster."""
 url='https://zakaz.khanzama.ru/p/'+token
 if value.get('parentCatalogUrl')==url and value.get('parentCatalogToken')==token:return False
 updated={**value,'parentCatalogUrl':url,'parentCatalogToken':token}
 encoded=json.dumps(updated,ensure_ascii=False)
 seq=c.execute('INSERT INTO sync_changes(store,id,scope,data,actor,at) VALUES(?,?,?,?,?,?)',('classes',cid,pid,encoded,'parent-directory',time.time())).lastrowid
 c.execute("UPDATE sync_records SET data=?,seq=? WHERE store='classes' AND id=? AND scope=?",(encoded,seq,cid,pid))
 return True

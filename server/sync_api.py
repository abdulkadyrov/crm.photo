"""Durable, idempotent record synchronization with three-way merges and private blobs."""
import hashlib,json,os,re,secrets,shutil,tempfile,time
from pathlib import Path
from urllib.parse import parse_qs

STORES={'projects','classes','students','orders','media','catalog','templates','finalWorks','documents','albumProjects','albumClasses','albumStudents','albumGroupMedia','albumTeachers','albumMedia'}
GLOBAL={'catalog','templates'}
MISSING=object()

def initialize(c):
 c.executescript('''
 CREATE TABLE IF NOT EXISTS sync_records(store TEXT NOT NULL,id TEXT NOT NULL,scope TEXT NOT NULL,data TEXT,seq INTEGER NOT NULL,PRIMARY KEY(store,id));
 CREATE TABLE IF NOT EXISTS sync_changes(seq INTEGER PRIMARY KEY AUTOINCREMENT,store TEXT NOT NULL,id TEXT NOT NULL,scope TEXT NOT NULL,data TEXT,actor TEXT NOT NULL,at REAL NOT NULL);
 CREATE INDEX IF NOT EXISTS sync_scope_changes ON sync_changes(scope,seq);
 CREATE TABLE IF NOT EXISTS sync_receipts(actor TEXT NOT NULL,op TEXT NOT NULL,hash TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(actor,op));
 CREATE TABLE IF NOT EXISTS sync_blobs(scope TEXT NOT NULL,digest TEXT NOT NULL,size INTEGER NOT NULL,actor TEXT NOT NULL,PRIMARY KEY(scope,digest));
 ''')

def merge(base,local,remote,path=''):
 """Merge disjoint edits; conflicting values remain untouched until explicit review."""
 if local==base:return remote,[]
 if remote==base or local==remote:return local,[]
 if all(isinstance(v,dict) for v in (base,local,remote)):
  out={};conflicts=[]
  for key in sorted(set(base)|set(local)|set(remote)):
   if key in ('updatedAt','updatedBy','modifiedAt'):
    v=local.get(key,remote.get(key,MISSING));errors=[]
   else:v,errors=merge(base.get(key,MISSING),local.get(key,MISSING),remote.get(key,MISSING),path+'/'+key)
   if v is not MISSING:out[key]=v
   conflicts+=errors
  return out,conflicts
 if all(isinstance(v,list) for v in (base,local,remote)):
  if path.endswith('/fileIds') and all(all(isinstance(x,str) for x in v) for v in (base,local,remote)):
   removed=(set(base)-set(local))|(set(base)-set(remote))
   return list(dict.fromkeys(x for x in remote+local if x not in removed)),[]
  key=next((k for k in ('id','serviceId','taskId','type') if all(all(isinstance(i,dict) and isinstance(i.get(k),str) for i in a) and len({i[k] for i in a})==len(a) for a in (base,local,remote))),None)
  if key:
   maps=[{v[key]:v for v in a} for a in (base,local,remote)]
   values,errors=merge(*maps,path)
   common=set(maps[0])&set(maps[1])&set(maps[2]);orders=[[v[key] for v in a if v[key] in common] for a in (base,local,remote)]
   if orders[1]!=orders[0] and orders[2]!=orders[0] and orders[1]!=orders[2]:errors.append(path+'/order')
   preferred=local if orders[1]!=orders[0] else remote
   ids=list(dict.fromkeys([v[key] for v in preferred]+[v[key] for v in local+remote]))
   return [values[i] for i in ids if i in values],errors
 return remote,[path or '/']

def visible(a,u,store,data):
 if data is None:return None
 return data if u['role']=='admin' else a.strip_finance(data)

def scope_access(a,c,u,scope):
 if scope=='global':
  a.fail(u['role']!='admin' and not c.execute('SELECT 1 FROM memberships WHERE user_id=?',(u['id'],)).fetchone(),403,'Нет назначенных проектов')
 else:a.access(c,u,scope)

def record(c,store,rid):
 row=c.execute('SELECT * FROM sync_records WHERE store=? AND id=?',(store,rid)).fetchone()
 return row

def parent_scope(a,c,stores,rid):
 a.identifier(rid)
 for store in stores:
  row=record(c,store,rid)
  if row and row['data'] is not None:return row['scope']
 if any(record(c,store,rid) for store in stores):raise a.Error(409,'Родительская запись удалена')
 raise a.Error(425,'Ожидаем отправку родительской записи')

def scope_for(a,c,store,data):
 if store in GLOBAL:return 'global'
 if store in ('projects','albumProjects'):return data['id']
 if store=='classes':return parent_scope(a,c,['projects'],data.get('projectId'))
 if store=='albumClasses':return parent_scope(a,c,['albumProjects'],data.get('albumProjectId'))
 if store=='students':return parent_scope(a,c,['classes'],data.get('classId'))
 if store in ('albumStudents','albumGroupMedia','albumTeachers'):return parent_scope(a,c,['albumClasses'],data.get('albumClassId'))
 if store=='albumMedia':return parent_scope(a,c,['albumStudents','albumGroupMedia','albumTeachers'],data.get('ownerId'))
 if store in ('orders','media','finalWorks'):return parent_scope(a,c,['students'],data.get('studentId'))
 if store=='documents':
  if data.get('studentId'):return parent_scope(a,c,['students'],data['studentId'])
  if data.get('classId') or data.get('groupId'):return parent_scope(a,c,['classes'],data.get('classId') or data.get('groupId'))
  return parent_scope(a,c,['projects'],data.get('projectId'))
 raise a.Error(400,'Неизвестный раздел')

def validate_write(a,u,store,base,nxt,current):
 a.fail(u['role']=='viewer',403,'Просмотр не позволяет менять записи')
 if u['role']=='admin':return
 a.fail(store in GLOBAL or store=='documents',403,'Раздел изменяет только администратор')
 a.fail(nxt is not None and a.strip_finance(nxt)!=nxt,403,'Финансовые поля доступны только администратору')
 if u['role']!='photographer':return
 a.fail(nxt is None or store not in ('students','orders','media'),403,'Фотограф сохраняет съёмки, чеклист и отметки оплаты')
 if store=='media':
  a.fail(current and current.get('studentId')!=nxt.get('studentId'),403,'Нельзя переносить съёмку другому ребёнку');return
 a.fail(current is None,403,'Сначала получите карточку ребёнка от администратора')
 before=base or {};changed={k for k in set(before)|set(nxt) if before.get(k,MISSING)!=nxt.get(k,MISSING)}
 allowed={'paymentStatus','updatedAt','updatedBy'} if store=='students' else {'items','updatedAt','updatedBy'}
 a.fail(bool(changed-allowed),403,'Эти поля фотограф изменять не может')
 if store=='students':a.fail(nxt.get('paymentStatus') not in ('paid','unpaid'));return
 baseline={v.get('type'):v for v in (base or current).get('items',[])}
 incoming=nxt.get('items',[]);a.fail(not isinstance(incoming,list) or len(incoming)!=len(baseline),403,'Нельзя менять состав чеклиста')
 a.fail(len({v.get('type') for v in incoming})!=len(incoming),403,'Повтор задачи')
 for item in incoming:
  old=baseline.get(item.get('type'));a.fail(not old,403,'Неизвестная задача')
  a.fail(any(old.get(k,MISSING)!=item.get(k,MISSING) for k in set(old)|set(item) if k not in ('status','fileIds','completedAt','completedBy')),403,'Нельзя менять описание задачи')

def blob_refs(data):
 if isinstance(data,dict):
  if '$syncBlob' in data:yield data
  else:
   for value in data.values():yield from blob_refs(value)
 elif isinstance(data,list):
  for value in data:yield from blob_refs(value)

def conflict_result(a,u,store,rid,current,seq,fields,message='Одна запись изменена на разных устройствах'):
 return {'conflict':True,'store':store,'id':rid,'current':visible(a,u,store,current),'seq':seq,'fields':fields,'message':message}

class BlobFile:
 def __init__(self,path):self.path=path

def route(r,c,u,path,a):
 parts=path.strip('/').split('/');kind=parts[1] if len(parts)>1 else ''
 if kind=='blob' and len(parts)==4:
  scope=a.identifier(parts[2]);digest=parts[3];a.fail(not re.fullmatch('[a-f0-9]{64}',digest))
  scope_access(a,c,u,scope)
  row=c.execute('SELECT * FROM sync_blobs WHERE scope=? AND digest=?',(scope,digest)).fetchone()
  folder=a.ROOT/'sync-blobs';folder.mkdir(exist_ok=True,mode=0o700);target=folder/digest
  query=parse_qs(r.e.get('QUERY_STRING',''))
  if r.method=='GET':
   if 'check' in query:return {'exists':bool(row and target.exists())}
   a.fail(not row or not target.exists(),404,'Файл не найден')
   a.fail(u['role']!='admin' and not c.execute("SELECT 1 FROM sync_records WHERE scope=? AND store!='documents' AND data IS NOT NULL AND instr(data,?)>0",(scope,digest)).fetchone() and (row['actor']!=u['id'] or c.execute("SELECT 1 FROM sync_records WHERE scope=? AND data IS NOT NULL AND instr(data,?)>0",(scope,digest)).fetchone()),403,'Нет доступа к файлу')
   return BlobFile(target)
  a.fail(r.method!='POST',404,'Не найдено');a.fail(u['role']=='viewer' or scope=='global' and u['role']!='admin',403,'Нет права загрузки')
  if row and target.exists():return {'saved':True,'duplicate':True}
  size=int(r.e.get('CONTENT_LENGTH','0'));a.fail(size<0 or size>a.MAX_UPLOAD,413,'Файл больше 1 ГБ')
  a.fail(shutil.disk_usage(a.ROOT).free<size+a.SYNC_BLOB_FREE_RESERVE,507,'На сервере недостаточно места. Файл остаётся на устройстве')
  fd,tmp=tempfile.mkstemp(dir=folder);digest_check=hashlib.sha256()
  try:
   with os.fdopen(fd,'wb') as f:
    remaining=size
    while remaining:
     chunk=r.e['wsgi.input'].read(min(1024*1024,remaining));a.fail(not chunk,400,'Передача прервана');digest_check.update(chunk);f.write(chunk);remaining-=len(chunk)
   a.fail(digest_check.hexdigest()!=digest,400,'Контрольная сумма не совпала')
   os.replace(tmp,target)
   c.execute('INSERT OR IGNORE INTO sync_blobs VALUES(?,?,?,?)',(scope,digest,size,u['id']))
   return {'saved':True}
  finally:Path(tmp).unlink(missing_ok=True)
 if kind=='changes' and len(parts)==3 and r.method=='GET':
  scope=a.identifier(parts[2]);scope_access(a,c,u,scope)
  after=int(parse_qs(r.e.get('QUERY_STRING','')).get('after',['0'])[0]);a.fail(after<0)
  rows=list(c.execute('SELECT * FROM sync_changes WHERE scope=? AND seq>? ORDER BY seq LIMIT 100',(scope,after)))
  changes=[{'store':row['store'],'id':row['id'],'scope':row['scope'],'seq':row['seq'],'record':visible(a,u,row['store'],json.loads(row['data']) if row['data'] else None)} for row in rows if u['role']=='admin' or row['store']!='documents']
  return {'changes':changes,'cursor':rows[-1]['seq'] if rows else after,'more':len(rows)==100}
 if kind!='push' or r.method!='POST':raise a.Error(404,'Не найдено')
 b=r.json(8*1024*1024);store=b.get('store');a.fail(store not in STORES);rid=a.identifier(b.get('id'));op=a.identifier(b.get('op'));scope=a.identifier(b.get('scope'));base=b.get('base');nxt=b.get('next')
 def bad_keys(value):
  if isinstance(value,dict):return bool(set(value)&{'__proto__','constructor','prototype'}) or any(bad_keys(v) for v in value.values())
  if isinstance(value,list):return any(bad_keys(v) for v in value)
  return False
 a.fail(bad_keys(b),400,'Недопустимые поля записи')
 a.fail(any(v is not None and (not isinstance(v,dict) or v.get('id')!=rid) for v in (base,nxt)))
 a.fail(u['role']=='viewer' or u['role']!='admin' and store in GLOBAL|{'documents'} or u['role']=='photographer' and store not in {'students','orders','media'},403,'Нет права изменять этот раздел')
 a.fail((store in GLOBAL)!=(scope=='global'),403,'Некорректная область записи')
 payload_hash=hashlib.sha256(json.dumps(b,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
 c.execute('BEGIN IMMEDIATE')
 # Check current access even on an idempotent replay after revocation.
 if store in ('projects','albumProjects') and nxt is not None and u['role']=='admin' and not c.execute('SELECT 1 FROM projects WHERE id=?',(scope,)).fetchone():
  a.fail(scope!=rid);c.execute('INSERT INTO projects VALUES(?,?)',(scope,a.text(nxt.get('name') or nxt.get('schoolName') or 'Альбом')))
 scope_access(a,c,u,scope)
 previous=c.execute('SELECT * FROM sync_receipts WHERE actor=? AND op=?',(u['id'],op)).fetchone()
 if previous:
  a.fail(previous['hash']!=payload_hash,409,'Идентификатор операции использован с другим содержимым')
  result=json.loads(previous['result']);result['record']=visible(a,u,store,result['record']);return result
 old=record(c,store,rid);current=json.loads(old['data']) if old and old['data'] else None
 a.fail(old and old['scope']!=scope,403,'Нельзя переносить запись в другой проект')
 view=visible(a,u,store,current)
 if old and current is None and nxt is not None and b.get('restoreSeq')!=old['seq']:
  return conflict_result(a,u,store,rid,current,old['seq'],['/'],'Запись удалена. Восстановление нужно подтвердить')
 if base is None and current is not None and nxt!=view:
  return conflict_result(a,u,store,rid,current,old['seq'],['/'],'Локальная запись создана до синхронизации или на другом устройстве')
 validate_write(a,u,store,base,nxt,view)
 merged,conflicts=merge(base,nxt,view)
 if conflicts:return conflict_result(a,u,store,rid,current,old['seq'] if old else 0,conflicts)
 if merged is not None:
  try:actual=scope_for(a,c,store,merged)
  except a.Error as e:
   if e.status==409:return conflict_result(a,u,store,rid,current,old['seq'] if old else 0,['/parent'],e.message)
   raise
  a.fail(actual!=scope,403,'Запись относится к другому проекту')
  for key in ('projectId','albumProjectId'):
   a.fail(merged.get(key) and merged[key]!=scope,403,'Чужой проект')
  if store=='orders':
   for task in merged.get('items',[]):
    for fid in task.get('fileIds',[]):
     media=record(c,'media',a.identifier(fid))
     a.fail(not media or media['data'] is None,425,'Ожидаем отправку фотографии')
     a.fail(json.loads(media['data']).get('studentId')!=merged.get('studentId'),403,'Фотография относится к другому ребёнку')
  for ref in blob_refs(merged):
   digest=ref.get('$syncBlob');a.fail(not isinstance(digest,str) or not re.fullmatch('[a-f0-9]{64}',digest))
   a.fail(not c.execute('SELECT 1 FROM sync_blobs WHERE scope=? AND digest=?',(scope,digest)).fetchone(),409,'Сначала загрузите вложение')
 else:
  if store=='catalog':
   for row in c.execute("SELECT data FROM sync_records WHERE store IN ('students','orders','finalWorks') AND data IS NOT NULL"):
    entity=json.loads(row[0])
    if entity.get('catalogId')==rid or rid in entity.get('catalogIds',[]) or entity.get('serviceId')==rid:
     return conflict_result(a,u,store,rid,current,old['seq'] if old else 0,['/references'],'Услуга используется в карточках. Сначала согласуйте их изменения.')
  if store=='media':
   for row in c.execute("SELECT data FROM sync_records WHERE scope=? AND store='orders' AND data IS NOT NULL",(scope,)):
    if any(rid in item.get('fileIds',[]) for item in json.loads(row[0]).get('items',[])):
     return conflict_result(a,u,store,rid,current,old['seq'] if old else 0,['/references'],'Файл ещё используется в чеклисте. Сначала согласуйте изменения чеклиста.')
  # Do not hide children whose concurrent edits prevented their deletion.
  links={'projects':[('classes','projectId'),('documents','projectId')],'classes':[('students','classId'),('documents','classId'),('documents','groupId')],'students':[('orders','studentId'),('media','studentId'),('finalWorks','studentId'),('documents','studentId')],'albumProjects':[('albumClasses','albumProjectId')],'albumClasses':[(s,'albumClassId') for s in ('albumStudents','albumGroupMedia','albumTeachers')],'albumStudents':[('albumMedia','ownerId')],'albumTeachers':[('albumMedia','ownerId')],'albumGroupMedia':[('albumMedia','ownerId')]}
  for child,field in links.get(store,[]):
   if any(json.loads(row[0]).get(field)==rid for row in c.execute('SELECT data FROM sync_records WHERE store=? AND scope=? AND data IS NOT NULL',(child,scope))):return conflict_result(a,u,store,rid,current,old['seq'] if old else 0,['/children'],'Сначала нужно согласовать удаление дочерних записей')
 # Preserve fields hidden from staff; their omission is never a deletion.
 if u['role']!='admin' and merged is not None:
  def restore_hidden(full,filtered):
   if isinstance(full,dict) and isinstance(filtered,dict):
    out={k:v for k,v in full.items() if k not in a.strip_finance(full)}
    out.update({k:restore_hidden(full.get(k),v) for k,v in filtered.items()});return out
   if isinstance(full,list) and isinstance(filtered,list):
    return [restore_hidden(next((old for old in full if isinstance(old,dict) and isinstance(v,dict) and (old.get('id') or old.get('serviceId') or old.get('type'))==(v.get('id') or v.get('serviceId') or v.get('type'))),{}),v) for v in filtered]
   return filtered
  merged=restore_hidden(current,merged)
 data=json.dumps(merged,ensure_ascii=False) if merged is not None else None
 if merged!=current or not old:
  cur=c.execute('INSERT INTO sync_changes(store,id,scope,data,actor,at) VALUES(?,?,?,?,?,?)',(store,rid,scope,data,u['id'],time.time()));seq=cur.lastrowid
  c.execute('INSERT INTO sync_records VALUES(?,?,?,?,?) ON CONFLICT(store,id) DO UPDATE SET data=excluded.data,seq=excluded.seq',(store,rid,scope,data,seq))
  if store in ('projects','albumProjects') and merged:c.execute('UPDATE projects SET name=? WHERE id=?',(merged.get('name') or merged.get('schoolName') or 'Альбом',scope))
 else:seq=old['seq']
 update_public_projection(a,c,store,rid,merged,current)
 result={'saved':True,'store':store,'id':rid,'seq':seq,'record':visible(a,u,store,merged)}
 c.execute('INSERT INTO sync_receipts VALUES(?,?,?,?)',(u['id'],op,payload_hash,json.dumps(result,ensure_ascii=False)))
 return result

def public_catalog(a,data,previous):
 """Project published catalog fields from the canonical CRM record; reuse media bytes."""
 from urllib.parse import urljoin,urlparse
 out=dict(previous)
 out.update(id=data['id'],name=str(data.get('name') or data.get('title') or previous.get('name','Услуга')),description=str(data.get('description') or ''),short_description=str(data.get('shortDescription') or ''),category=str(data.get('category') or ''),gender=data.get('gender','unisex'),type=data.get('type','photo'),parent_preview_mode=data.get('parentPreviewMode','auto'))
 match=re.search(r'\d+(?:\.\d+)?',str(data.get('price') or 0).replace(' ','').replace(',','.'));out['price']=float(match[0]) if match else 0
 def media(value):
  if isinstance(value,dict) and value.get('$syncBlob'):
   ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm'}.get(value.get('mime'))
   if not ext:return ''
   digest=value['$syncBlob'];source=a.ROOT/'sync-blobs'/digest;folder=a.ROOT/'parent-media';folder.mkdir(exist_ok=True,mode=0o700);target=folder/(digest+'.'+ext)
   if source.exists() and not target.exists():os.link(source,target)
   return 'https://zakaz.khanzama.ru/api/v1/public/media/'+target.name if target.exists() else ''
  if isinstance(value,str) and value:
   url=urljoin('https://crm.khanzama.ru/',value)
   return url if urlparse(url).hostname in ('crm.khanzama.ru','zakaz.khanzama.ru') else ''
  return ''
 out['preview_url']=media(data.get('previewDataUrl') or data.get('previewImageDataUrl') or data.get('previewSrc'))
 out['preview_video_url']=media(data.get('previewVideoDataUrl') or data.get('previewVideoUrl'))
 return out

def update_public_projection(a,c,store,rid,value,previous):
 if store=='classes':
  group=c.execute('SELECT * FROM parent_classes WHERE id=?',(rid,)).fetchone()
  if group and (value is None or group['name']!=value.get('name')):
   c.execute('UPDATE parent_classes SET name=?,enabled=?,revision=revision+1 WHERE id=?',(value.get('name',group['name']) if value else group['name'],group['enabled'] if value else 0,rid))
 if store=='students':
  old_class=(previous or {}).get('classId');new_class=(value or {}).get('classId')
  if old_class and old_class!=new_class:
   c.execute('UPDATE parent_children SET active=0 WHERE id=?',(rid,));c.execute('UPDATE parent_classes SET revision=revision+1 WHERE id=?',(old_class,))
  if value and c.execute('SELECT 1 FROM parent_classes WHERE id=?',(new_class,)).fetchone():
   name=(' '.join([value.get('lastName',''),value.get('firstName','')])).strip()
   before=c.execute('SELECT * FROM parent_children WHERE id=?',(rid,)).fetchone()
   if name and (not before or before['name']!=name or not before['active'] or before['class_id']!=new_class):
    c.execute('INSERT INTO parent_children VALUES(?,?,?,1) ON CONFLICT(id) DO UPDATE SET class_id=excluded.class_id,name=excluded.name,active=1',(rid,new_class,name));c.execute('UPDATE parent_classes SET revision=revision+1 WHERE id=?',(new_class,))
 if store=='catalog':
  published=c.execute('SELECT data FROM parent_catalog WHERE id=?',(rid,)).fetchone()
  if not published:return
  if value:c.execute('UPDATE parent_catalog SET data=? WHERE id=?',(json.dumps(public_catalog(a,value,json.loads(published[0])),ensure_ascii=False),rid))
  else:
   for group in list(c.execute('SELECT id,services FROM parent_classes')):
    services=json.loads(group['services'])
    if rid in services:c.execute('UPDATE parent_classes SET services=?,revision=revision+1 WHERE id=?',(json.dumps([s for s in services if s!=rid]),group['id']))
   c.execute('DELETE FROM parent_catalog WHERE id=?',(rid,))

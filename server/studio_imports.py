"""Bounded staff multipart parsing and additive canonical catalog import."""
import hashlib,json,math,os,secrets,shutil,tempfile,time
from email.parser import BytesParser
from email.policy import default

MAX_BODY=64*1024*1024

def multipart(r,a):
 content=r.e.get('CONTENT_TYPE','')
 a.fail(not content.startswith('multipart/form-data'),415,'Требуется multipart/form-data')
 message=BytesParser(policy=default).parsebytes(('Content-Type: '+content+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+r.body(MAX_BODY))
 a.fail(not message.is_multipart())
 fields={};files={}
 for part in message.iter_parts():
  name=part.get_param('name',header='content-disposition');a.fail(not name or name in fields or name in files)
  data=part.get_payload(decode=True) or b''
  if part.get_filename() is None:
   a.fail(len(data)>2*1024*1024,413,'Метаданные слишком большие')
   try:fields[name]=data.decode('utf-8')
   except UnicodeError:raise a.Error(400,'Некорректный текст')
  else:files[name]=(data,part.get_content_type(),part.get_filename())
 return fields,files

def blob(a,c,u,asset,scope='global'):
 raw,mime,name=asset
 valid=(mime=='image/jpeg' and raw[:3]==b'\xff\xd8\xff' or mime=='image/png' and raw[:8]==b'\x89PNG\r\n\x1a\n' or mime=='image/webp' and raw[:4]==b'RIFF' and raw[8:12]==b'WEBP' or mime in ('video/mp4','video/quicktime') and raw[4:8]==b'ftyp' or mime=='video/webm' and raw[:4]==b'\x1aE\xdf\xa3')
 a.fail(not raw or not valid,400,'Неподдерживаемый файл каталога')
 a.fail(shutil.disk_usage(a.ROOT).free<len(raw)+128*1024*1024,507,'Недостаточно места')
 digest=hashlib.sha256(raw).hexdigest();folder=a.ROOT/'sync-blobs';folder.mkdir(exist_ok=True,mode=0o700);target=folder/digest
 if not target.exists():
  fd,tmp=tempfile.mkstemp(dir=folder)
  try:
   with os.fdopen(fd,'wb') as stream:stream.write(raw)
   os.replace(tmp,target)
  finally:
   if os.path.exists(tmp):os.unlink(tmp)
 c.execute('INSERT OR IGNORE INTO sync_blobs VALUES(?,?,?,?)',(scope,digest,len(raw),u['id']))
 return {'$syncBlob':digest,'mime':mime,'size':len(raw)}

def catalog(r,c,u,a,save,prepared=None):
 a.fail(u['role']!='admin',403,'Каталог импортирует администратор')
 fields,files=prepared if prepared is not None else multipart(r,a)
 try:metadata=json.loads(fields.get('metadata',''))
 except (ValueError,TypeError):raise a.Error(400,'Некорректные метаданные')
 a.fail(not isinstance(metadata,dict) or metadata.get('userId')!=u['id'],403,'Чужой профиль')
 items=metadata.get('items');a.fail(not isinstance(items,list) or len(items)>1000)
 key=a.identifier(metadata.get('requestKey'));digest=hashlib.sha256(json.dumps({'metadata':metadata,'files':{k:[hashlib.sha256(v[0]).hexdigest(),v[1]] for k,v in files.items()}},sort_keys=True).encode()).hexdigest()
 c.execute('BEGIN IMMEDIATE')
 receipt=c.execute('SELECT * FROM studio_receipts WHERE actor=? AND key=?',(u['id'],key)).fetchone()
 if receipt:
  a.fail(receipt['hash']!=digest,409,'requestKey конфликт');return json.loads(receipt['result'])
 seen=set();validated=[]
 for index,item in enumerate(items):
  a.fail(not isinstance(item,dict));rid=a.identifier(item.get('sourceId'));a.fail(rid in seen);seen.add(rid)
  name=a.text(item.get('name'));price=item.get('price',0)
  try:price=float(price)
  except (ValueError,TypeError):raise a.Error(400,'Некорректная цена')
  a.fail(isinstance(item.get('price'),bool) or not math.isfinite(price) or not 0<=price<=10000000)
  value={'id':rid,'name':name,'price':price,'isActive':True,'orderIndex':index,'createdBy':u['id']}
  for field in ('shortDescription','description','category','gender','type'):
   text=item.get(field,'');a.fail(not isinstance(text,str) or len(text)>20000);value[field]=text
  value['popular']=item.get('popular') is True;value['parentPreviewMode']=item.get('parentPreviewMode','auto');a.fail(value['parentPreviewMode'] not in ('auto','print','digital'))
  assets=[]
  for prop,target in (('previewImage','previewDataUrl'),('originalImage','originalDataUrl'),('previewVideo','previewVideoDataUrl')):
   field=item.get(prop)
   if field:
    a.fail(field!=f'{index}_{prop}' or field not in files);assets.append((target,files[field]))
  validated.append((value,assets))
 added=0
 for value,assets in validated:
  # Imports only fill missing canonical IDs; edits use revision-controlled updateCatalogItem.
  if c.execute("SELECT 1 FROM sync_records WHERE store='catalog' AND id=?",(value['id'],)).fetchone():continue
  for target,asset in assets:value[target]=blob(a,c,u,asset)
  save('catalog',value,'global')
  public=a.sync_api.public_catalog(a,value,{})
  c.execute('INSERT INTO parent_catalog VALUES(?,?)',(value['id'],json.dumps(public,ensure_ascii=False)));added+=1
 a.audit(c,u,'studio_importCatalog',str(added));c.execute('INSERT INTO studio_receipts VALUES(?,?,?,?)',(u['id'],key,digest,json.dumps(added)))
 return added

def project(r,c,u,a,save):
 """Add missing roster/workflow records; preserve existing canonical edits and source ZIP."""
 import io,zipfile
 from pathlib import PurePosixPath
 a.fail(u['role']!='admin',403,'Проект импортирует администратор')
 fields,files=multipart(r,a);asset=files.get('file');a.fail(not asset,400,'Нет ZIP проекта')
 raw=asset[0];a.fail(len(raw)>50*1024*1024,413,'ZIP больше 50 МБ')
 key=a.identifier(fields.get('requestKey'));city=fields.get('city','');year=fields.get('year','');a.fail(len(city)>200 or len(year)>100)
 digest=hashlib.sha256(raw).hexdigest();bodyhash=hashlib.sha256(json.dumps([digest,city,year]).encode()).hexdigest()
 c.execute('BEGIN IMMEDIATE')
 receipt=c.execute('SELECT * FROM studio_receipts WHERE actor=? AND key=?',(u['id'],key)).fetchone()
 if receipt:
  a.fail(receipt['hash']!=bodyhash,409,'requestKey конфликт');return json.loads(receipt['result'])
 try:
  with zipfile.ZipFile(io.BytesIO(raw)) as archive:
   entries=archive.infolist();names=[entry.filename for entry in entries]
   a.fail(len(entries)>20000 or len(names)!=len(set(names)) or sum(entry.file_size for entry in entries)>256*1024*1024,413,'Архив слишком большой')
   a.fail(any(PurePosixPath(name).is_absolute() or '..' in PurePosixPath(name).parts or '\\' in name or entry.flag_bits&1 for name,entry in zip(names,entries)),400,'Недопустимый путь ZIP')
   a.fail(archive.getinfo('manifest.json').file_size>64000 or archive.getinfo('data.json').file_size>30*1024*1024,413,'Метаданные слишком большие')
   manifest=json.loads(archive.read('manifest.json'));data=json.loads(archive.read('data.json'))
 except (zipfile.BadZipFile,KeyError,ValueError,UnicodeError):raise a.Error(400,'Повреждённый ZIP проекта')
 a.fail(not isinstance(manifest,dict) or manifest.get('app') not in ('Vakha Studio','School Photo Flow') or manifest.get('schemaVersion')!=1 or not isinstance(data,dict),400,'Формат ZIP не поддерживается')
 stores=('projects','classes','students','orders')
 for store in stores:
  rows=data.get(store,[]);a.fail(not isinstance(rows,list) or len(rows)>20000 or any(not isinstance(row,dict) for row in rows))
  ids=[a.identifier(row.get('id')) for row in rows];a.fail(len(ids)!=len(set(ids)),400,'Повторяющийся ID')
 a.fail(not data.get('projects'),400,'В ZIP нет проекта')
 projects={row['id']:row for row in data['projects']};groups={row['id']:row for row in data.get('classes',[])};kids={row['id']:row for row in data.get('students',[])}
 for row in groups.values():a.fail(row.get('projectId') not in projects,400,'Класс без проекта')
 for row in kids.values():a.fail(row.get('classId') not in groups or not isinstance(row.get('firstName'),str) or not row['firstName'].strip() or not isinstance(row.get('lastName'),str) or not row['lastName'].strip(),400,'Учащийся без класса или имени')
 for row in data.get('orders',[]):a.fail(row.get('studentId') not in kids,400,'Заказ без учащегося')
 # Reject ID collisions across parent scopes even though existing values are never overwritten.
 for store in stores:
  for row in data.get(store,[]):
   scope=row['id'] if store=='projects' else row['projectId'] if store=='classes' else groups[row['classId']]['projectId'] if store=='students' else groups[kids[row['studentId']]['classId']]['projectId']
   existing=c.execute('SELECT scope FROM sync_records WHERE store=? AND id=?',(store,row['id'])).fetchone()
   a.fail(existing and existing['scope']!=scope,409,'ID принадлежит другому проекту')
 a.fail(shutil.disk_usage(a.ROOT).free<len(raw)+128*1024*1024,507,'Недостаточно места')
 folder=a.ROOT/'studio-archives';folder.mkdir(exist_ok=True,mode=0o700);target=folder/digest
 if not target.exists():
  fd,tmp=tempfile.mkstemp(dir=folder)
  try:
   with os.fdopen(fd,'wb') as out:out.write(raw)
   os.replace(tmp,target)
  finally:
   if os.path.exists(tmp):os.unlink(tmp)
 counts={store:0 for store in stores}
 for store in stores:
  for original in data.get(store,[]):
   if c.execute('SELECT 1 FROM sync_records WHERE store=? AND id=?',(store,original['id'])).fetchone():continue
   row=dict(original)
   if store=='projects':row['city']=row.get('city') or city;scope=row['id']
   elif store=='classes':row['academicYear']=row.get('academicYear') or year;scope=row['projectId']
   elif store=='students':scope=groups[row['classId']]['projectId']
   else:scope=groups[kids[row['studentId']]['classId']]['projectId']
   save(store,row,scope);counts[store]+=1
 for pid in projects:c.execute('INSERT OR IGNORE INTO studio_archives VALUES(?,?,?)',('zip_'+digest,pid,digest))
 result={'added':counts,'preservedExisting':True,'archivePath':'zip_'+digest}
 a.audit(c,u,'studio_importProject',digest);c.execute('INSERT INTO studio_receipts VALUES(?,?,?,?)',(u['id'],key,bodyhash,json.dumps(result)))
 return result

def seed_catalog_zip(path,c,u,a,save):
 """Explicit offline seed entry point. Same absent-only rules and receipts as staff import."""
 import zipfile,mimetypes
 from pathlib import PurePosixPath
 try:
  with zipfile.ZipFile(path) as archive:
   entries=archive.infolist();names=[entry.filename for entry in entries]
   a.fail(len(entries)>5000 or len(names)!=len(set(names)) or sum(entry.file_size for entry in entries)>256*1024*1024,413,'Архив каталога слишком большой')
   a.fail(any(PurePosixPath(name).is_absolute() or '..' in PurePosixPath(name).parts or '\\' in name or entry.flag_bits&1 for name,entry in zip(names,entries)))
   a.fail(archive.getinfo('catalog.json').file_size>2*1024*1024,413,'Каталог слишком большой')
   payload=json.loads(archive.read('catalog.json'));services=payload.get('services');a.fail(not isinstance(services,list) or len(services)>1000)
   items=[];files={}
   for index,item in enumerate(services):
    a.fail(not isinstance(item,dict));value={**item,'sourceId':item.get('id'),'parentPreviewMode':(item.get('presentation') or {}).get('parentPreviewMode','auto')}
    for prop in ('previewImage','originalImage','previewVideo'):
     asset=item.get(prop)
     if asset:
      a.fail(not isinstance(asset,str) or asset not in names);field=f'{index}_{prop}';value[prop]=field;files[field]=(archive.read(asset),mimetypes.guess_type(asset)[0] or '',asset)
    items.append(value)
 except (zipfile.BadZipFile,KeyError,ValueError,UnicodeError):raise a.Error(400,'Повреждённый каталог ZIP')
 with open(path,'rb') as source:archive_digest=hashlib.file_digest(source,'sha256').hexdigest()
 metadata={'userId':u['id'],'items':items,'requestKey':'catalog_seed_'+archive_digest}
 return catalog(None,c,u,a,save,({'metadata':json.dumps(metadata)},files))

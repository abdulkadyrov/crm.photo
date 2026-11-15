"""Authenticated, record-addressed staff media. Paths never address filesystem names."""
import json,re
from urllib.parse import quote

MIMES={'image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm','application/pdf'}

def resolve(c,u,opaque,a):
 rid=a.identifier(opaque)
 if rid.startswith('zip_'):
  rows=list(c.execute('SELECT * FROM studio_archives WHERE id=?',(rid,)))
  a.fail(not rows,404,'Архив не найден')
  # An archive can contain multiple schools: require access to every school.
  for row in rows:a.access(c,u,row['project_id'])
  target=a.ROOT/'studio-archives'/rows[0]['digest'];a.fail(not target.is_file(),404,'Архив отсутствует')
  return {},target,'application/zip'
 if rid.startswith('catalog_'):
  catalog=c.execute("SELECT data FROM sync_records WHERE store='catalog' AND id=? AND data IS NOT NULL",(rid[8:],)).fetchone()
  if catalog:
   a.fail(u['role']!='admin' and not c.execute('SELECT 1 FROM memberships WHERE user_id=?',(u['id'],)).fetchone(),403,'Нет проектов')
   value=json.loads(catalog['data']);blob=value.get('originalDataUrl') or value.get('originalImageDataUrl') or {}
   a.fail(not isinstance(blob,dict) or not re.fullmatch('[a-f0-9]{64}',str(blob.get('$syncBlob',''))),404,'Оригинал не загружен')
   a.fail(blob.get('mime') not in MIMES,415,'Формат файла не поддерживается')
   target=a.ROOT/'sync-blobs'/blob['$syncBlob'];a.fail(not target.is_file(),404,'Файл отсутствует')
   return value,target,blob['mime']
 row=c.execute("SELECT * FROM sync_records WHERE store='media' AND id=? AND data IS NOT NULL",(rid,)).fetchone()
 a.fail(not row,404,'Медиа не найдено')
 a.fail(row['scope']=='global',403,'Медиа вне проекта')
 a.access(c,u,row['scope'])
 value=json.loads(row['data']);blob=value.get('blob') or {}
 a.fail(not isinstance(blob,dict) or not re.fullmatch('[a-f0-9]{64}',str(blob.get('$syncBlob',''))),404,'Файл ещё не загружен')
 a.fail(blob.get('mime') not in MIMES,415,'Формат файла не поддерживается')
 target=a.ROOT/'sync-blobs'/blob['$syncBlob']
 a.fail(not target.is_file(),404,'Файл отсутствует')
 return value,target,blob['mime']

def urls(c,u,paths,a):
 a.fail(not isinstance(paths,list) or len(paths)>500)
 result={}
 for opaque in paths:
  resolve(c,u,opaque,a)
  result[opaque]='/api/v1/studio/file?path='+quote(opaque,safe='')
 return result

def aliases(c,u,item,a):
 out=dict(item)
 for key,prefix in (('referenceMediaId','reference'),('parentVideoMediaId','parent_video')):
  if not item.get(key):continue
  row=c.execute("SELECT * FROM sync_records WHERE store='media' AND id=? AND data IS NOT NULL",(item[key],)).fetchone()
  if not row:continue
  a.access(c,u,row['scope'])
  value=json.loads(row['data']);blob=value.get('blob') or {}
  out[prefix+'_path']=item[key];out[prefix+'_name']=value.get('fileName','');out[prefix+'_content_type']=blob.get('mime','')
 return out

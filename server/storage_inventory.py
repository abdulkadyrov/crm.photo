"""Read-only S3 inventory. Worker owns credentials; HTTP only reads cached metadata."""
import json,time,uuid
from urllib.parse import parse_qs

def initialize(c):
 c.execute('CREATE TABLE IF NOT EXISTS s3_inventory_state(id INTEGER PRIMARY KEY,data TEXT NOT NULL)')
 c.execute('CREATE TABLE IF NOT EXISTS s3_inventory_objects(generation TEXT,key TEXT,size INTEGER,modified TEXT,PRIMARY KEY(generation,key))')

def state(c):
 row=c.execute('SELECT data FROM s3_inventory_state WHERE id=1').fetchone()
 return json.loads(row[0]) if row else {}

def save_state(c,value):c.execute('INSERT INTO s3_inventory_state VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',(json.dumps(value),))

def refresh_one(a,storage,now=None):
 """At most one list page per worker turn. Publish a generation only after its final page."""
 now=time.time() if now is None else now
 with a.db() as c:
  initialize(c);value=state(c)
  if value.get('nextAt',0)>now:return False
  generation=value.get('building') or uuid.uuid4().hex
  token=value.get('token') if value.get('building') else None
 try:
  options={'Bucket':storage.bucket,'MaxKeys':1000}
  if token:options['ContinuationToken']=token
  page=storage.client.list_objects_v2(**options)
  rows=[]
  for item in page.get('Contents',[]):
   key=item.get('Key');size=item.get('Size');modified=item.get('LastModified')
   if not isinstance(key,str) or not isinstance(size,int) or size<0:raise ValueError('Invalid inventory page')
   rows.append((generation,key,size,modified.isoformat() if hasattr(modified,'isoformat') else ''))
  more=bool(page.get('IsTruncated'));next_token=page.get('NextContinuationToken')
  if more and (not isinstance(next_token,str) or not next_token or next_token==token):raise ValueError('Invalid inventory cursor')
  with a.db() as c:
   initialize(c);c.executemany('INSERT OR REPLACE INTO s3_inventory_objects VALUES(?,?,?,?)',rows)
   value.update(building=generation,token=next_token if more else None,error=False,nextAt=now if more else now+600)
   if not more:
    value.update(current=generation,building=None,updatedAt=now)
    c.execute('DELETE FROM s3_inventory_objects WHERE generation!=?',(generation,))
   save_state(c,value)
  return True
 except Exception:
  with a.db() as c:
   initialize(c);value.update(error=True,nextAt=now+60);save_state(c,value)
  return False

def mirror_summary(c):
 exists=c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='storage_mirror'").fetchone()
 rows=c.execute("SELECT coalesce(m.state,'queued') AS state,count(*) AS count,coalesce(sum(b.size),0) AS bytes FROM sync_blobs b LEFT JOIN storage_mirror m ON m.scope=b.scope AND m.digest=b.digest GROUP BY coalesce(m.state,'queued')") if exists else c.execute("SELECT 'queued' AS state,count(*) AS count,coalesce(sum(size),0) AS bytes FROM sync_blobs")
 return [dict(row) for row in rows]

def file_labels(c,scope):
 labels={}
 def refs(value):
  if isinstance(value,dict):
   if '$syncBlob' in value:yield value
   else:
    for nested in value.values():yield from refs(nested)
  elif isinstance(value,list):
   for nested in value:yield from refs(nested)
 students={}
 for row in c.execute("SELECT id,data FROM sync_records WHERE store='students' AND scope=? AND data IS NOT NULL",(scope,)):
  value=json.loads(row['data']);students[row['id']]=' '.join(filter(None,[value.get('lastName'),value.get('firstName')]))
 for row in c.execute("SELECT store,data FROM sync_records WHERE scope=? AND data IS NOT NULL AND store IN ('media','albumMedia','finalWorks','documents','catalog','templates')",(scope,)):
  value=json.loads(row['data']);name=value.get('fileName') or value.get('name') or value.get('title') or {'media':'Фото или видео','albumMedia':'Фото альбома','finalWorks':'Готовая работа','documents':'Документ','catalog':'Услуга','templates':'Шаблон'}[row['store']]
  name=str(name).replace('\\','/').rsplit('/',1)[-1][:200]
  for blob in refs(value):labels.setdefault(blob['$syncBlob'],{'label':name,'context':students.get(value.get('studentId'),'')})
 return labels

def overview(c,prefix='',offset=0,limit=100):
 initialize(c);value=state(c);generation=value.get('current');folders={};files=[];total_bytes=0;total_objects=0
 projects={row['id']:row['name'] for row in c.execute('SELECT id,name FROM projects')}
 parts=prefix.split('/');labels=file_labels(c,parts[2]) if len(parts)==4 and parts[:2]==['crm','v1'] else {}
 if generation:
  for row in c.execute('SELECT key,size,modified FROM s3_inventory_objects WHERE generation=? AND substr(key,1,?)=? ORDER BY key',(generation,len(prefix),prefix)):
   rest=row['key'][len(prefix):]
   if not rest:continue
   total_bytes+=row['size'];total_objects+=1
   if '/' in rest:
    leaf=rest.split('/',1)[0];path=prefix+leaf+'/'
    folder=folders.setdefault(path,{'kind':'folder','name':leaf,'prefix':path,'bytes':0,'objects':0})
    folder['bytes']+=row['size'];folder['objects']+=1
    if prefix=='crm/v1/':folder['name']=projects.get(leaf,'Каталог и шаблоны' if leaf=='global' else leaf)
   else:files.append({'kind':'file','name':rest,'bytes':row['size'],'modified':row['modified'],**labels.get(rest,{})})
 entries=sorted(folders.values(),key=lambda item:item['name'].casefold())+files
 return {'prefix':prefix,'updatedAt':value.get('updatedAt'),'status':'error' if value.get('error') else 'scanning' if value.get('building') else 'ready' if generation else 'waiting','totalBytes':total_bytes if generation else None,'totalObjects':total_objects if generation else None,'entries':entries[offset:offset+limit],'nextOffset':offset+limit if offset+limit<len(entries) else None,'mirror':mirror_summary(c)}

def route(r,c,u,a):
 a.fail(u['role']!='admin',403,'Хранилище доступно только администратору')
 a.fail(r.method!='GET',405,'Только чтение')
 params=parse_qs(r.e.get('QUERY_STRING',''));prefix=params.get('prefix',[''])[0];offset=params.get('offset',['0'])[0]
 a.fail(len(prefix)>1000 or '\x00' in prefix or prefix and not prefix.endswith('/') or not offset.isdigit() or int(offset)>1000000)
 return overview(c,prefix,int(offset))

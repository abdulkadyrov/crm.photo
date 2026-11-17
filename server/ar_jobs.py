"""Durable AR handoff. Only binds a marker to a finished video; no AI generation."""
import hashlib, json, re, time, uuid

STATES = ('queued', 'processing', 'retry', 'ready', 'failed')

def initialize(c):
 c.executescript('''CREATE TABLE IF NOT EXISTS ar_jobs (
 id TEXT PRIMARY KEY, scope TEXT NOT NULL, work_id TEXT NOT NULL, request_key TEXT NOT NULL UNIQUE,
 payload TEXT NOT NULL, state TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
 next_at REAL NOT NULL DEFAULT 0, lease_until REAL NOT NULL DEFAULT 0,
 result TEXT, error TEXT NOT NULL DEFAULT '', created REAL NOT NULL, updated REAL NOT NULL);
 CREATE INDEX IF NOT EXISTS ar_jobs_pending ON ar_jobs(state,next_at,lease_until);''')

def enqueue(a,c,u,work,scope):
 intent=work.get('arPublication')
 if not intent:return None
 a.fail(not isinstance(intent,dict),400,'Некорректное намерение публикации')
 a.fail(u['role'] not in ('admin','manager'),403,'Публикация AR доступна менеджеру и администратору')
 key=a.identifier(intent.get('requestKey'));marker=a.identifier(intent.get('markerMediaId'));video=a.identifier(intent.get('videoMediaId'))
 assets={}
 for name,mid in [('marker',marker),('video',video)]:
  if name=='marker' and intent.get('markerSource')=='a4':
   media=work
   a.fail(mid!=work['id'],400,'Маркер должен принадлежать этой работе')
   blob=intent.get('markerA4Image',{})
  else:
   row=c.execute("SELECT scope,data FROM sync_records WHERE store='media' AND id=? AND data IS NOT NULL",(mid,)).fetchone()
   a.fail(not row or row['scope']!=scope,409,'Сначала синхронизируйте медиа проекта')
   media=json.loads(row['data']); a.fail(media.get('studentId')!=work.get('studentId'),403,'Медиа другого учащегося')
   blob=media.get('blob',{})
  digest=blob.get('$syncBlob','')
  a.fail(not re.fullmatch('[a-f0-9]{64}',digest),409,'Файл ещё не отправлен')
  mime=blob.get('mime',''); a.fail(not mime.startswith('image/' if name=='marker' else 'video/'),400,'Нужны фото-маркер и готовое видео')
  a.fail(not c.execute('SELECT 1 FROM sync_blobs WHERE scope=? AND digest=?',(scope,digest)).fetchone(),409,'Файл не синхронизирован')
  assets[name]={'mediaId':mid,'sha256':digest,'mime':mime}
 payload={'version':1,'workId':work['id'],'projectId':scope,'studentId':work['studentId'],'assets':assets}
 if intent.get('markerSource')=='a4':
  a.fail(intent.get('frame') not in ('a4-portrait','a4-landscape'),400,'Нужна ориентация A4')
  payload['frame']=intent['frame']
 encoded=json.dumps(payload,sort_keys=True,separators=(',',':'))
 old=c.execute('SELECT * FROM ar_jobs WHERE request_key=?',(key,)).fetchone()
 a.fail(old and (old['scope']!=scope or old['payload']!=encoded),409,'Ключ публикации уже использован для другой работы')
 if old:return dict(old)
 jid=str(uuid.uuid4());now=time.time()
 c.execute('INSERT INTO ar_jobs(id,scope,work_id,request_key,payload,state,created,updated) VALUES(?,?,?,?,?,?,?,?)',(jid,scope,work['id'],key,encoded,'queued',now,now))
 return dict(c.execute('SELECT * FROM ar_jobs WHERE id=?',(jid,)).fetchone())

def public_job(job):
 result=json.loads(job['result']) if job.get('result') else {}
 return {'id':job['id'],'workId':job['work_id'],'requestKey':job['request_key'],'status':job['state'],'attempts':job['attempts'],'error':job['error'],**result}

def route(r,c,u,path,a):
 a.fail(r.method!='GET',405,'Доступно чтение статуса')
 jid=a.identifier(path.split('/')[-1])
 if '/by-work/' in path:job=c.execute('SELECT * FROM ar_jobs WHERE work_id=? ORDER BY created DESC LIMIT 1',(jid,)).fetchone()
 else:job=c.execute('SELECT * FROM ar_jobs WHERE id=?',(jid,)).fetchone()
 a.fail(not job,404,'Публикация не найдена');a.access(c,u,job['scope']);return public_job(dict(job))

def run_one(a, adapter, now=None):
 """Lease + stable request key makes a retry after lost response safe at AR."""
 now=time.time() if now is None else now
 with a.db() as c:
  c.execute('BEGIN IMMEDIATE')
  row=c.execute("SELECT * FROM ar_jobs WHERE ((state IN ('queued','retry') AND next_at<=?) OR (state='processing' AND lease_until<=?)) ORDER BY created LIMIT 1",(now,now)).fetchone()
  if not row:return False
  job=dict(row);c.execute("UPDATE ar_jobs SET state='processing',lease_until=?,attempts=attempts+1,updated=? WHERE id=?",(now+900,now,job['id']))
 try:
  result=adapter.publish(json.loads(job['payload']),job['request_key'])
  from urllib.parse import urlparse
  viewer=result.get('viewerUrl','');parsed=urlparse(viewer)
  if parsed.scheme!='https' or parsed.hostname!='khanzama.ru' or not parsed.path.startswith('/ar.photo/'):raise ValueError('Invalid AR viewer URL')
  if not result.get('arWorkId'):raise ValueError('Missing stable AR work ID')
  output={'viewerUrl':viewer,'qrPayload':viewer,'arWorkId':str(result['arWorkId'])}
  state='ready';error=''
 except Exception:
  output={};state='retry';error='AR недоступен или ответ не подтверждён. Работа остаётся в очереди.'
 with a.db() as c:
  current=c.execute('SELECT * FROM ar_jobs WHERE id=?',(job['id'],)).fetchone()
  if current['state']!='processing' or current['lease_until']!=now+900:return True
  c.execute('UPDATE ar_jobs SET state=?,result=?,error=?,next_at=?,lease_until=0,updated=? WHERE id=?',(state,json.dumps(output) if output else None,error,now+min(3600,15*2**min(current['attempts'],8)),now,job['id']))
  row=c.execute("SELECT data FROM sync_records WHERE store='finalWorks' AND id=?",(job['work_id'],)).fetchone()
  if row and row[0]:
   work=json.loads(row[0])
   if work.get('arPublication',{}).get('requestKey')==job['request_key']:
    work['arStatus']=state;work['arJobId']=job['id'];work['arError']=error
    if output:work.update(output)
    data=json.dumps(work,ensure_ascii=False)
    seq=c.execute("INSERT INTO sync_changes(store,id,scope,data,actor,at) VALUES('finalWorks',?,?,?,?,?)",(job['work_id'],job['scope'],data,'ar-worker',now)).lastrowid
    c.execute("UPDATE sync_records SET data=?,seq=? WHERE store='finalWorks' AND id=?",(data,seq,job['work_id']))
 return True

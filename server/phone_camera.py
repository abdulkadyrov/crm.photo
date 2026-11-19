"""One-way, short-lived phone camera relay. Sender tokens never grant CRM reads."""
import base64,hashlib,hmac,io,json,re,secrets,time,uuid
from pathlib import Path
from urllib.parse import parse_qs

MAX_FRAME=320*1024

def initialize(c):
 c.executescript('''
 CREATE TABLE IF NOT EXISTS phone_cameras(id TEXT PRIMARY KEY,owner TEXT NOT NULL,scope TEXT NOT NULL,selection_id TEXT NOT NULL,code_hash TEXT UNIQUE,code_expires REAL NOT NULL,token_hash TEXT,expires REAL NOT NULL,last_frame REAL NOT NULL DEFAULT 0,seq INTEGER NOT NULL DEFAULT 0,closed INTEGER NOT NULL DEFAULT 0,notice TEXT NOT NULL DEFAULT 'scanning');
 CREATE TABLE IF NOT EXISTS phone_camera_attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until REAL NOT NULL);
 ''')

def digest(value):return hashlib.sha256(value.encode()).hexdigest()
def folder(a):
 p=a.ROOT/'phone-camera';p.mkdir(mode=0o700,exist_ok=True);return p

def valid(c,sid,a):
 a.identifier(sid);row=c.execute('SELECT * FROM phone_cameras WHERE id=?',(sid,)).fetchone();a.fail(not row or row['closed'] or row['expires']<time.time(),410,'Камера отключена. Создайте подключение на Mac заново');return row

def host_route(r,c,u,parts,a):
 a.fail(u['role']=='viewer',403,'Камера доступна сотрудникам с правом изменения')
 if len(parts)==2 and r.method=='POST':
  b=r.json();selection=a.identifier(b.get('selectionId'));parent=c.execute('SELECT * FROM print_selections WHERE id=?',(selection,)).fetchone();a.fail(not parent or parent['owner']!=u['id'],403,'Нет доступа к списку печати');a.access(c,u,parent['scope']);a.fail(parent['expires']<time.time(),410,'Список печати истёк')
  now=time.time();path=folder(a)
  for old in c.execute('SELECT id FROM phone_cameras WHERE expires<? OR closed=1',(now,)):(path/(old[0]+'.jpg')).unlink(missing_ok=True)
  c.execute('DELETE FROM phone_cameras WHERE expires<? OR closed=1',(now,))
  for old in c.execute('SELECT id FROM phone_cameras WHERE selection_id=? AND owner=?',(selection,u['id'])):(path/(old[0]+'.jpg')).unlink(missing_ok=True)
  c.execute('UPDATE phone_cameras SET closed=1,token_hash=NULL,code_hash=NULL WHERE selection_id=? AND owner=?',(selection,u['id']))
  sid=str(uuid.uuid4());code=str(secrets.randbelow(100_000_000)).zfill(8)
  c.execute('INSERT INTO phone_cameras(id,owner,scope,selection_id,code_hash,code_expires,expires) VALUES(?,?,?,?,?,?,?)',(sid,u['id'],parent['scope'],selection,digest(code),now+300,now+1800))
  return {'id':sid,'code':code,'codeExpires':now+300,'cameraPath':'/camera/'}
 a.fail(len(parts)!=3,404,'Не найдено');row=valid(c,parts[2],a);a.fail(row['owner']!=u['id'],403,'Нет доступа к камере');a.access(c,u,row['scope'])
 if r.method=='POST':
  body=r.json()
  if body.get('action')=='notice':
   a.fail(body.get('notice') not in ('scanning','recognized'));c.execute('UPDATE phone_cameras SET notice=? WHERE id=?',(body['notice'],row['id']));return {'saved':True}
  a.fail(body.get('action')!='stop');c.execute('UPDATE phone_cameras SET closed=1,token_hash=NULL,code_hash=NULL WHERE id=?',(row['id'],));(folder(a)/(row['id']+'.jpg')).unlink(missing_ok=True);return {'stopped':True}
 a.fail(r.method!='GET',404,'Не найдено')
 c.execute('UPDATE phone_cameras SET expires=? WHERE id=?',(time.time()+1800,row['id']))
 result={'id':row['id'],'seq':row['seq'],'connected':bool(row['token_hash']),'lastFrame':row['last_frame']}
 after=parse_qs(r.e.get('QUERY_STRING','')).get('after',['0'])[0];path=folder(a)/(row['id']+'.jpg')
 if str(row['seq'])!=after and row['seq'] and path.is_file():result['frame']='data:image/jpeg;base64,'+base64.b64encode(path.read_bytes()).decode()
 return result

def public_route(r,c,path,a):
 a.fail(r.method!='POST',404,'Не найдено');parts=path.strip('/').split('/')
 if parts==['public','camera','pair']:
  ip=digest(str(r.e.get('REMOTE_ADDR','unknown')));now=time.time();attempt=c.execute('SELECT * FROM phone_camera_attempts WHERE key=?',(ip,)).fetchone();a.fail(attempt and attempt['until']>now and attempt['count']>=10,429,'Слишком много неверных кодов. Попробуйте через 10 минут')
  b=r.json();code=re.sub(r'\s','',str(b.get('code','')));a.fail(not re.fullmatch(r'\d{8}',code),400,'Введите восемь цифр с экрана Mac')
  c.execute('BEGIN IMMEDIATE');row=c.execute('SELECT * FROM phone_cameras WHERE code_hash=? AND code_expires>? AND expires>? AND closed=0',(digest(code),now,now)).fetchone()
  if not row:
   count=attempt['count']+1 if attempt and attempt['until']>now else 1;c.execute('INSERT OR REPLACE INTO phone_camera_attempts VALUES(?,?,?)',(ip,count,now+600));c.commit();raise a.Error(404,'Код не найден или истёк. Проверьте код на Mac')
  token=secrets.token_urlsafe(32);c.execute('UPDATE phone_cameras SET token_hash=?,code_hash=NULL WHERE id=?',(digest(token),row['id']));c.execute('DELETE FROM phone_camera_attempts WHERE key=?',(ip,));return {'id':row['id'],'token':token}
 a.fail(len(parts)!=4 or parts[:3]!=['public','camera','frame'],404,'Не найдено');row=valid(c,parts[3],a)
 token=r.e.get('HTTP_AUTHORIZATION','').removeprefix('Bearer ');a.fail(not row['token_hash'] or not hmac.compare_digest(digest(token),row['token_hash']),403,'Подключение камеры недоступно')
 owner=c.execute('SELECT * FROM users WHERE id=? AND active=1',(row['owner'],)).fetchone();a.fail(not owner or owner['role']=='viewer',403,'Подключение отозвано');a.access(c,owner,row['scope'])
 a.fail(time.time()-row['last_frame']<0.12,429,'Кадры поступают слишком часто')
 try:size=int(r.e.get('CONTENT_LENGTH','0'))
 except (TypeError,ValueError):raise a.Error(400,'Неверный размер кадра')
 a.fail(not 0<size<=MAX_FRAME,413,'Кадр слишком большой')
 data=r.e['wsgi.input'].read(size);a.fail(len(data)!=size or not data.startswith(b'\xff\xd8'),400,'Неверный кадр камеры')
 try:
  from PIL import Image
  with Image.open(io.BytesIO(data)) as image:
   if image.format!='JPEG' or not(0<image.width<=1600 and 0<image.height<=1600):raise ValueError()
   image.verify()
 except Exception:raise a.Error(400,'Неверный кадр камеры')
 # Recheck after decoding: a simultaneous Stop must never accept another frame.
 c.execute('BEGIN IMMEDIATE');latest=valid(c,row['id'],a);a.fail(latest['token_hash']!=row['token_hash'],403,'Подключение завершено')
 target=folder(a)/(row['id']+'.jpg');temp=target.with_suffix('.'+secrets.token_hex(8)+'.tmp')
 try:
  temp.write_bytes(data);temp.chmod(0o600);temp.replace(target)
 finally:temp.unlink(missing_ok=True)
 c.execute('UPDATE phone_cameras SET seq=seq+1,last_frame=? WHERE id=?',(time.time(),row['id']));return {'received':True,'notice':latest['notice']}


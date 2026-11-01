"""Private CRM accounts and immutable project transfers. Run behind Caddy/Gunicorn."""
from types import SimpleNamespace
import parent_orders
import sync_api
import hashlib, hmac, json, os, re, secrets, sqlite3, tempfile, time, zipfile
from contextlib import contextmanager
from http.cookies import SimpleCookie
from pathlib import Path, PurePosixPath

ROOT = Path(os.environ.get('CRM_DATA_DIR', '/var/lib/crm-photo'))
ORIGIN = os.environ.get('CRM_ORIGIN', 'https://crm.khanzama.ru')
ROLES = {'admin', 'manager', 'photographer', 'viewer'}
MAX_UPLOAD = 1024 * 1024 * 1024
COOKIE = '__Host-crm_session'

class Error(Exception):
    def __init__(self, status, message): self.status, self.message = status, message

def fail(condition, status=400, message='Некорректные данные'):
    if condition: raise Error(status, message)

def reject_json_constant(value):
    raise ValueError("Non-finite JSON number")

def initialize():
    ROOT.mkdir(parents=True, exist_ok=True, mode=0o700)
    (ROOT/'packages').mkdir(exist_ok=True, mode=0o700)
    with db() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, login TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, password TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, name TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS memberships(user_id TEXT NOT NULL, project_id TEXT NOT NULL, PRIMARY KEY(user_id,project_id));
        CREATE TABLE IF NOT EXISTS packages(id TEXT PRIMARY KEY, user_id TEXT NOT NULL, project_id TEXT NOT NULL, group_id TEXT NOT NULL, name TEXT NOT NULL, created REAL NOT NULL, size INTEGER NOT NULL, sha256 TEXT NOT NULL, role TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, at REAL NOT NULL, user_id TEXT, action TEXT NOT NULL, target TEXT);
        CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY, count INTEGER NOT NULL, until REAL NOT NULL);
        ''')
        parent_orders.initialize(c)
        sync_api.initialize(c)

@contextmanager
def db():
    c=sqlite3.connect(ROOT/'crm.sqlite3', timeout=30)
    c.row_factory=sqlite3.Row
    try:
        yield c
        c.commit()
    except Exception:
        c.rollback(); raise
    finally: c.close()

def password_hash(password, salt=None):
    fail(not isinstance(password,str) or not 12 <= len(password) <= 128, message='Пароль должен содержать 12–128 символов')
    salt=salt or secrets.token_hex(16)
    value=hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 600000).hex()
    return salt+':'+value

def public_user(c,u):
    return {**{k:u[k] for k in ('id','login','name','role','active')}, 'projects':[r[0] for r in c.execute('SELECT project_id FROM memberships WHERE user_id=?',(u['id'],))]}

def audit(c,u,action,target=''):
    c.execute('INSERT INTO audit(at,user_id,action,target) VALUES(?,?,?,?)',(time.time(),u['id'],action,target))

def access(c,u,pid):
    fail(not c.execute('SELECT 1 FROM projects WHERE id=?',(pid,)).fetchone(),404,'Проект не найден')
    fail(u['role']!='admin' and not c.execute('SELECT 1 FROM memberships WHERE user_id=? AND project_id=?',(u['id'],pid)).fetchone(),403,'Нет доступа к проекту')

def identifier(value):
    fail(not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,160}',value))
    return value

def text(value,maximum=200):
    fail(not isinstance(value,str) or not value.strip() or len(value)>maximum)
    return value.strip()

def strip_finance(value):
    if isinstance(value,list): return [strip_finance(v) for v in value]
    if isinstance(value,dict):
        return {k:strip_finance(v) for k,v in value.items() if not re.search(r'price|amount|cost|salary|profit|revenue|discount|budget|finance|balance|debt|fee|expense|income|payment[sA-Z_]|money',k,re.I) or k=='paymentStatus'}
    return value

def package_data(path):
    try:
        with zipfile.ZipFile(path) as z:
            names=z.namelist()
            fail(len(names)>20000 or len(names)!=len(set(names)),400,'Некорректный архив')
            total=0
            for i in z.infolist():
                p=PurePosixPath(i.filename)
                fail(p.is_absolute() or '..' in p.parts or '\\' in i.filename or i.flag_bits & 1,400,'Недопустимый путь в архиве')
                total+=i.file_size
            fail(total>2*MAX_UPLOAD,413,'Распакованный архив слишком большой')
            fail(z.getinfo('data.json').file_size>20*1024*1024 or z.getinfo('manifest.json').file_size>64000,413,'Метаданные слишком большие')
            data=json.loads(z.read('data.json')); manifest=json.loads(z.read('manifest.json'))
            fail(not isinstance(data,dict) or manifest.get('exportType') not in ('project','class'))
            for k,v in data.items(): fail(not isinstance(v,list) or any(not isinstance(r,dict) for r in v))
            return data,manifest
    except (zipfile.BadZipFile, KeyError, ValueError, UnicodeError): raise Error(400,'Повреждённый архив проекта')

def rewrite_package(source,destination,data,manifest):
    # Keep only media explicitly referenced by allowed records, not arbitrary attachments.
    refs=set()
    def collect(v):
        if isinstance(v,str): refs.add(v)
        elif isinstance(v,list):
            for x in v: collect(x)
        elif isinstance(v,dict):
            for x in v.values(): collect(x)
    collect(data)
    prefixes=[]
    for key, folders in {'media':['media/student_files'], 'services':['media/services'], 'finalWorks':['final_results','final_sources'], 'documents':['documents']}.items():
        for record in data.get(key,[]):
            rid=identifier(record.get('id'))
            prefixes.extend(f'{folder}/{rid}/' for folder in folders)
    with zipfile.ZipFile(source) as src, zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_STORED) as out:
        out.writestr('data.json',json.dumps(data,ensure_ascii=False))
        out.writestr('manifest.json',json.dumps(manifest,ensure_ascii=False))
        for info in src.infolist():
            if any(info.filename.startswith(prefix) for prefix in prefixes) and info.filename not in ('data.json','manifest.json'):
                with src.open(info) as a, out.open(info.filename,'w') as b:
                    while chunk:=a.read(1024*1024): b.write(chunk)

class Request:
    def __init__(self,e): self.e=e; self.method=e['REQUEST_METHOD']; self.path=e.get('PATH_INFO',''); self.headers=[]
    def body(self,limit=1024*1024):
        try: size=int(self.e.get('CONTENT_LENGTH','0'))
        except ValueError: raise Error(400,'Некорректная длина запроса')
        fail(size<0 or size>limit,413,'Слишком большой запрос')
        data=self.e['wsgi.input'].read(size)
        fail(len(data)!=size,400,'Загрузка прервана')
        return data
    def json(self,limit=1024*1024):
        try: value=json.loads(self.body(limit),parse_constant=reject_json_constant)
        except (ValueError,UnicodeError): raise Error(400,'Некорректный JSON')
        fail(not isinstance(value,dict)); return value
    def user(self,c):
        cookies=SimpleCookie()
        try: cookies.load(self.e.get('HTTP_COOKIE',''))
        except Exception: raise Error(401,'Войдите в серверный аккаунт')
        token=cookies.get(COOKIE)
        u=c.execute('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>? AND u.active=1',(hashlib.sha256((token.value if token else '').encode()).hexdigest(),time.time())).fetchone()
        fail(not u,401,'Войдите в серверный аккаунт'); return u
    def route(self):
        if self.method not in ('GET','HEAD'):
            fail(self.e.get('HTTP_ORIGIN')!=(parent_orders.ORIGIN if self.path.startswith('/api/v1/public/') else ORIGIN),403,'Недопустимый источник запроса')
        path=self.path.removeprefix('/api/v1')
        if path.startswith('/public/media/') and self.method=='GET':
            name=path.split('/')[-1]
            fail(not re.fullmatch(r'[a-f0-9]{64}\.(jpg|png|webp|mp4|webm)',name),404,'Не найдено')
            target=ROOT/'parent-media'/name
            fail(not target.is_file(),404,'Не найдено')
            return Media(target)
        if path=='/health' and self.method=='GET': return {'ok':True}
        with db() as c:
            if path.startswith('/public/'):
                return parent_orders.route(self,c,None,path,SimpleNamespace(**globals()))
            if path=='/login' and self.method=='POST':
                body=self.json(); login=str(body.get('login','')).strip().lower()
                key=hashlib.sha256((self.e.get('REMOTE_ADDR','')+'|'+login).encode()).hexdigest()
                a=c.execute('SELECT * FROM attempts WHERE key=?',(key,)).fetchone()
                fail(a and a['until']>time.time() and a['count']>=8,429,'Слишком много попыток. Подождите 15 минут')
                u=c.execute('SELECT * FROM users WHERE login=? AND active=1',(login,)).fetchone()
                supplied=str(body.get('password',''))
                valid=False
                if 12<=len(supplied)<=128:
                    salt=(u['password'].split(':')[0] if u else '0'*32)
                    valid=hmac.compare_digest(password_hash(supplied,salt),u['password'] if u else '')
                if not valid:
                    count=a['count']+1 if a and a['until']>time.time() else 1
                    c.execute('INSERT OR REPLACE INTO attempts VALUES(?,?,?)',(key,count,time.time()+900)); c.commit()
                    raise Error(401,'Неверный логин или пароль')
                c.execute('DELETE FROM attempts WHERE key=?',(key,))
                token=secrets.token_urlsafe(32)
                c.execute('DELETE FROM sessions WHERE expires<?',(time.time(),))
                c.execute('INSERT INTO sessions VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),u['id'],time.time()+86400*7))
                self.headers.append(('Set-Cookie',f'{COOKIE}={token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800'))
                audit(c,u,'login'); return public_user(c,u)
            u=self.user(c)
            if path.startswith('/sync/'):
                return sync_api.route(self,c,u,path,SimpleNamespace(**globals()))
            if path.startswith('/parents/'):
                return parent_orders.route(self,c,u,path,SimpleNamespace(**globals()))
            if path=='/me' and self.method=='GET': return public_user(c,u)
            if path=='/logout' and self.method=='POST':
                cookie=SimpleCookie(self.e.get('HTTP_COOKIE',''))[COOKIE].value
                c.execute('DELETE FROM sessions WHERE token=?',(hashlib.sha256(cookie.encode()).hexdigest(),))
                self.headers.append(('Set-Cookie',f'{COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'))
                return {'ok':True}
            if path=='/password' and self.method=='POST':
                b=self.json()
                fail(not hmac.compare_digest(password_hash(b.get('current',''),u['password'].split(':')[0]),u['password']),403,'Неверный текущий пароль')
                c.execute('UPDATE users SET password=? WHERE id=?',(password_hash(b.get('password')),u['id']))
                c.execute('DELETE FROM sessions WHERE user_id=?',(u['id'],)); audit(c,u,'password_changed'); return {'ok':True}
            if path=='/users':
                fail(u['role']!='admin',403,'Только администратор управляет аккаунтами')
                if self.method=='GET': return [public_user(c,r) for r in c.execute('SELECT * FROM users ORDER BY name')]
                if self.method=='POST':
                    b=self.json(); uid=identifier(b['id']) if b.get('id') else secrets.token_hex(16)
                    existing=c.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone()
                    login=text(b.get('login','')).lower(); name=text(b.get('name','')); role=b.get('role'); active=bool(b.get('active',True))
                    fail(not re.fullmatch(r'[a-z0-9_.@-]{3,80}',login),message='Логин: 3–80 латинских букв, цифр или . _ @ -')
                    fail(role not in ROLES)
                    fail(uid==u['id'] and (role!='admin' or not active),400,'Нельзя отключить свой аккаунт администратора')
                    memberships=b.get('projects',[]); fail(not isinstance(memberships,list))
                    for pid in memberships: access(c,u,identifier(pid))
                    hashed=password_hash(b['password']) if b.get('password') else (existing['password'] if existing else password_hash(''))
                    c.execute('INSERT INTO users VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET login=excluded.login,name=excluded.name,role=excluded.role,password=excluded.password,active=excluded.active',(uid,login,name,role,hashed,int(active)))
                    c.execute('DELETE FROM memberships WHERE user_id=?',(uid,))
                    c.executemany('INSERT INTO memberships VALUES(?,?)',[(uid,p) for p in set(memberships)])
                    c.execute('DELETE FROM sessions WHERE user_id=?',(uid,)); audit(c,u,'user_saved',uid)
                    return public_user(c,c.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone())
            if path=='/projects':
                if self.method=='GET':
                    rows=c.execute('SELECT * FROM projects ORDER BY name') if u['role']=='admin' else c.execute('SELECT p.* FROM projects p JOIN memberships m ON p.id=m.project_id WHERE m.user_id=? ORDER BY p.name',(u['id'],))
                    return [dict(r) for r in rows]
                if self.method=='POST':
                    fail(u['role']!='admin',403,'Только администратор добавляет проекты на сервер')
                    b=self.json(); pid=identifier(b.get('id')); name=text(b.get('name'))
                    c.execute('INSERT INTO projects VALUES(?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name',(pid,name)); audit(c,u,'project_saved',pid); return {'id':pid,'name':name}
            if path.startswith('/projects/') and path.endswith('/packages') and self.method=='GET':
                pid=identifier(path.split('/')[2]); access(c,u,pid)
                rows=c.execute('SELECT id,user_id,project_id,group_id,name,created,size,role FROM packages WHERE project_id=? ORDER BY created DESC',(pid,))
                return [dict(r) for r in rows if u['role'] in ('admin','manager') or r['user_id']==u['id'] or r['role'] in ('admin','manager')]
            if path.startswith('/packages/'):
                package_id=identifier(path.split('/')[2])
                if self.method=='POST': return self.upload(c,u,package_id)
                if self.method=='GET':
                    row=c.execute('SELECT * FROM packages WHERE id=?',(package_id,)).fetchone(); fail(not row,404,'Версия не найдена')
                    access(c,u,row['project_id'])
                    fail(u['role'] not in ('admin','manager') and row['user_id']!=u['id'] and row['role'] not in ('admin','manager'),403,'Нет доступа к этой отправке')
                    source=ROOT/'packages'/f'{package_id}.zip'
                    if u['role']=='admin': return source
                    data,manifest=package_data(source)
                    data=strip_finance(data)
                    # Documents may include prices in PDFs or images; staff do not receive them.
                    data['documents']=[]
                    fd,tmp=tempfile.mkstemp(dir=ROOT,suffix='.zip'); os.close(fd)
                    rewrite_package(source,tmp,data,manifest)
                    return (Path(tmp),True)
            raise Error(404,'Не найдено')
    def upload(self,c,u,pid):
        c.execute('BEGIN IMMEDIATE')
        fail(u['role']=='viewer',403,'Роль «Просмотр» не может отправлять изменения')
        project=identifier(self.e.get('HTTP_X_PROJECT_ID')); group=self.e.get('HTTP_X_GROUP_ID',''); identifier(group) if group else None
        access(c,u,project)
        previous=c.execute('SELECT * FROM packages WHERE id=?',(pid,)).fetchone()
        if previous:
            fail(previous['user_id']!=u['id'] or previous['project_id']!=project or previous['group_id']!=group,409,'Идентификатор отправки занят')
            return {'id':pid,'saved':True,'duplicate':True}
        import shutil
        fail(shutil.disk_usage(ROOT).free < 3*MAX_UPLOAD,507,'Недостаточно места на сервере; локальная отправка сохранена')
        size=int(self.e.get('CONTENT_LENGTH','0')); fail(size<=0 or size>MAX_UPLOAD,413,'Архив должен быть не больше 1 ГБ; отправьте отдельную группу')
        fd,tmp=tempfile.mkstemp(dir=ROOT,suffix='.upload'); os.close(fd)
        destination=ROOT/'packages'/f'{pid}.zip'
        try:
            with open(tmp,'wb') as f:
                remaining=size
                while remaining:
                    chunk=self.e['wsgi.input'].read(min(1024*1024,remaining)); fail(not chunk,400,'Загрузка прервана')
                    f.write(chunk); remaining-=len(chunk)
            data,manifest=package_data(tmp)
            fail(len(data.get('projects',[]))!=1 or data['projects'][0].get('id')!=project,403,'Архив другого проекта')
            classes=data.get('classes',[]); fail(any(r.get('projectId')!=project for r in classes),403,'Чужая группа')
            fail(bool(group) and (len(classes)!=1 or classes[0].get('id')!=group),403,'Архив другой группы')
            class_ids={r.get('id') for r in classes}
            fail(any(r.get('classId') not in class_ids for r in data.get('students',[])),403,'Чужой ученик')
            student_ids={r.get('id') for r in data.get('students',[])}
            for key in ('orders','media','finalWorks'):
                fail(any(r.get('studentId') not in student_ids for r in data.get(key,[])),403,'Чужая запись')
            # Never distribute local login codes, settings, handles or global event history.
            for key in ('operators','operatorEvents','settings','statuses','checklistTemplates'): data[key]=[]
            if u['role']!='admin':
                data=strip_finance(data); data['documents']=[]
            if u['role']=='photographer':
                # A photographer submits shots + payment flags, never changes project structure,
                # catalog, final artwork, or arbitrary order/financial records on the server.
                data={key:(value if key in ('media',) else []) for key,value in data.items()}
                original,_=package_data(tmp)
                known={}; known_orders={}
                for published in c.execute("SELECT id FROM packages WHERE project_id=? AND role IN ('admin','manager') ORDER BY created",(project,)):
                    published_data,_=package_data(ROOT/'packages'/f'{published[0]}.zip')
                    known.update({s['id']:s for s in published_data.get('students',[])})
                    known_orders.update({o['studentId']:o for o in published_data.get('orders',[])})
                fail(any(s['id'] not in known or known[s['id']].get('classId')!=s.get('classId') for s in original.get('students',[])),403,'Сначала получите опубликованный проект от администратора')
                data['students']=[{'id':s['id'],'paymentStatus':s.get('paymentStatus','unpaid')} for s in original.get('students',[])]
                fail(any(s['paymentStatus'] not in ('paid','unpaid') for s in data['students']))
                data['orders']=[]
                media_by_student={sid:{m['id'] for m in original.get('media',[]) if m.get('studentId')==sid} for sid in student_ids}
                for order in original.get('orders',[]):
                    baseline=known_orders.get(order['studentId'])
                    if not baseline: continue
                    incoming={item.get('type'):item for item in order.get('items',[]) if isinstance(item,dict)}
                    items=[]
                    for base in baseline.get('items',[]):
                        item=incoming.get(base.get('type'))
                        if not item: continue
                        files=[f for f in item.get('fileIds',[]) if f in media_by_student[order['studentId']]]
                        items.append({**{k:base[k] for k in ('id','taskId','type','label') if k in base},'status':'done' if item.get('status')=='done' else base.get('status','pending'),'fileIds':files,'completedBy':u['id']})
                    data['orders'].append({'id':baseline['id'],'studentId':order['studentId'],'items':items})
                manifest['contributionOnly']=True
            manifest['serverRole']=u['role']; manifest['serverProjectId']=project; manifest['serverGroupId']=group
            manifest['exportedBy']=u['id']
            rewrite_package(tmp,destination,data,manifest)
            with destination.open('rb') as stored: digest=hashlib.file_digest(stored,'sha256').hexdigest()
            from urllib.parse import unquote
            title=text(unquote(self.e.get('HTTP_X_PACKAGE_NAME','Отправка')),200)
            c.execute('INSERT INTO packages VALUES(?,?,?,?,?,?,?,?,?)',(pid,u['id'],project,group,title,time.time(),destination.stat().st_size,digest,u['role']))
            audit(c,u,'package_uploaded',pid)
            return {'id':pid,'saved':True}
        except Exception:
            destination.unlink(missing_ok=True); raise
        finally: Path(tmp).unlink(missing_ok=True)

class Media:
    def __init__(self,path): self.path=path

def application(environ,start_response):
    r=Request(environ)
    headers=[('Cache-Control','no-store'),('X-Content-Type-Options','nosniff')]
    try:
        result=r.route(); status=200
        if isinstance(result,sync_api.BlobFile):
            path=result.path
            start_response("200 OK",headers+[("Content-Type","application/octet-stream"),("Content-Length",str(path.stat().st_size))])
            def binary_stream():
                with path.open("rb") as f:
                    while chunk:=f.read(1024*1024): yield chunk
            return binary_stream()
        if isinstance(result,Media):
            path=result.path; size=path.stat().st_size; start=0; end=size-1
            requested=environ.get('HTTP_RANGE','')
            if requested:
                match=re.fullmatch(r'bytes=(\d+)-(\d*)',requested)
                fail(not match,400,'Некорректный диапазон')
                start=int(match[1]);end=min(int(match[2]) if match[2] else end,end)
                fail(start>end or start>=size,400,'Некорректный диапазон')
            mime={'.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm'}[path.suffix]
            head=[('Content-Type',mime),('Content-Length',str(end-start+1)),('Accept-Ranges','bytes'),('Cache-Control','public, max-age=31536000, immutable'),('X-Content-Type-Options','nosniff')]
            if requested: head.append(('Content-Range',f'bytes {start}-{end}/{size}'))
            start_response('206 Partial Content' if requested else '200 OK',head)
            def media_stream():
                with path.open('rb') as f:
                    f.seek(start);remaining=end-start+1
                    while remaining:
                        chunk=f.read(min(1024*1024,remaining))
                        if not chunk: break
                        remaining-=len(chunk);yield chunk
            return media_stream()
        if isinstance(result,Path) or isinstance(result,tuple):
            path,remove=result if isinstance(result,tuple) else (result,False)
            start_response('200 OK',headers+[('Content-Type','application/zip'),('Content-Disposition','attachment; filename="project.zip"'),('Content-Length',str(path.stat().st_size))])
            def stream():
                try:
                    with path.open('rb') as f:
                        while chunk:=f.read(1024*1024): yield chunk
                finally:
                    if remove: path.unlink(missing_ok=True)
            return stream()
    except Error as e: status=e.status; result={'error':e.message}
    except sqlite3.IntegrityError: status=409; result={'error':'Логин или запись уже существуют'}
    except (KeyError,TypeError,ValueError): status=400; result={'error':'Некорректные данные'}
    except Exception:
        import traceback; traceback.print_exc(); status=500; result={'error':'Ошибка сервера. Локальные данные сохранены'}
    data=json.dumps(result,ensure_ascii=False).encode()
    start_response(f'{status} '+{200:'OK',400:'Bad Request',401:'Unauthorized',403:'Forbidden',404:'Not Found',409:'Conflict',413:'Payload Too Large',429:'Too Many Requests',500:'Internal Server Error'}.get(status,'Error'),headers+r.headers+[('Content-Type','application/json; charset=utf-8'),('Content-Length',str(len(data)))])
    return [data]

initialize()

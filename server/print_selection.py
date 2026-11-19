"""Private shared print selections; links never replace account/project authorization."""
import hashlib,json,time,uuid
from urllib.parse import parse_qs


def initialize(c):
 c.executescript('''
 CREATE TABLE IF NOT EXISTS print_selections(id TEXT PRIMARY KEY,owner TEXT NOT NULL,scope TEXT NOT NULL,group_id TEXT NOT NULL,created REAL NOT NULL,expires REAL NOT NULL,revision INTEGER NOT NULL DEFAULT 0,ready INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS print_selection_items(session_id TEXT NOT NULL,work_id TEXT NOT NULL,image_hash TEXT NOT NULL,copies INTEGER NOT NULL,selected INTEGER NOT NULL,PRIMARY KEY(session_id,work_id));
 CREATE TABLE IF NOT EXISTS print_selection_ops(session_id TEXT NOT NULL,op TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(session_id,op));
 ''')


def load(c,store,rid):
 row=c.execute('SELECT data FROM sync_records WHERE store=? AND id=?',(store,rid)).fetchone()
 return json.loads(row[0]) if row and row[0] else None


def image_ref(work):
 for key in ('image','mergedPrintImage','originalFinalImage'):
  value=work.get(key)
  if isinstance(value,dict) and value.get('$syncBlob'):return value
 return None


def snapshot(c,session):
 scope=session['scope'];group=session['group_id']
 classes=[json.loads(r[0]) for r in c.execute("SELECT data FROM sync_records WHERE scope=? AND store='classes' AND data IS NOT NULL",(scope,))]
 classes=[g for g in classes if not group or g['id']==group];ids={g['id'] for g in classes}
 students=[json.loads(r[0]) for r in c.execute("SELECT data FROM sync_records WHERE scope=? AND store='students' AND data IS NOT NULL",(scope,))]
 students=[{k:s.get(k,'') for k in ('id','classId','firstName','lastName','qrId')} for s in students if s.get('classId') in ids];children={s['id'] for s in students}
 catalog={r['id']:json.loads(r['data']) for r in c.execute("SELECT id,data FROM sync_records WHERE store='catalog' AND data IS NOT NULL")}
 works=[]
 for r in c.execute("SELECT data FROM sync_records WHERE scope=? AND store='finalWorks' AND data IS NOT NULL",(scope,)):
  w=json.loads(r[0]);ref=image_ref(w)
  if w.get('studentId') not in children or not ref:continue
  works.append({**{k:w.get(k) for k in ('id','studentId','serviceId','status','printQrPayload','finalImageVersion')},'title':w.get('title') or catalog.get(w.get('serviceId'),{}).get('name') or 'Готовая работа','image':ref,'needsCorrection':w.get('correction',{}).get('status')=='open' if isinstance(w.get('correction'),dict) else False})
 by_id={w['id']:w for w in works};items=[]
 for row in c.execute('SELECT * FROM print_selection_items WHERE session_id=? AND selected=1',(session['id'],)):
  w=by_id.get(row['work_id']);items.append({'workId':row['work_id'],'imageHash':row['image_hash'],'copies':row['copies'],'stale':not w or w['image']['$syncBlob']!=row['image_hash'],'blocked':bool(w and w['needsCorrection'])})
 project=load(c,'projects',scope) or {}
 return {'id':session['id'],'projectId':scope,'groupId':group,'title':project.get('name','Проект'),'revision':session['revision'],'ready':bool(session['ready']),'groups':[{'id':g['id'],'name':g.get('name','Группа')} for g in classes],'students':students,'works':works,'items':items}


def route(r,c,u,parts,a):
 a.fail(u['role']=='viewer',403,'Выбор печати доступен сотрудникам с правом изменения')
 if len(parts)==2 and r.method=='POST':
  b=r.json();scope=a.identifier(b.get('projectId'));group=b.get('groupId') or '';a.access(c,u,scope)
  a.fail(not load(c,'projects',scope),404,'Проект удалён')
  if group:
   a.identifier(group);g=load(c,'classes',group);a.fail(not g or g.get('projectId')!=scope,403,'Группа относится к другому проекту')
  sid=str(uuid.uuid4());now=time.time();c.execute('INSERT INTO print_selections(id,owner,scope,group_id,created,expires) VALUES(?,?,?,?,?,?)',(sid,u['id'],scope,group,now,now+7*86400))
  return snapshot(c,c.execute('SELECT * FROM print_selections WHERE id=?',(sid,)).fetchone())
 a.fail(len(parts)!=3,404,'Не найдено');sid=a.identifier(parts[2]);session=c.execute('SELECT * FROM print_selections WHERE id=?',(sid,)).fetchone();a.fail(not session,404,'Список печати не найден')
 a.fail(session['owner']!=u['id'],403,'Откройте ссылку под тем же аккаунтом CRM, что и на Mac');a.access(c,u,session['scope']);a.fail(session['expires']<time.time(),410,'Срок списка истёк. Создайте новый список на Mac')
 if r.method=='GET':
  revision=parse_qs(r.e.get('QUERY_STRING','')).get('revision',[''])[0]
  if revision==str(session['revision']):return {'unchanged':True,'revision':session['revision']}
  return snapshot(c,session)
 a.fail(r.method!='POST',404,'Не найдено');c.execute('BEGIN IMMEDIATE');b=r.json();a.fail(not isinstance(b,dict));op=a.identifier(b.get('op'));digest=hashlib.sha256(json.dumps(b,sort_keys=True).encode()).hexdigest()
 old=c.execute('SELECT hash FROM print_selection_ops WHERE session_id=? AND op=?',(sid,op)).fetchone()
 if old:a.fail(old[0]!=digest,409,'Код действия уже использован')
 else:
  if b.get('action')=='ready':c.execute('UPDATE print_selections SET ready=1,revision=revision+1 WHERE id=?',(sid,))
  else:
   wid=a.identifier(b.get('workId'));selected=b.get('selected');copies=b.get('copies',1);a.fail(type(selected) is not bool or type(copies) is not int or not 1<=copies<=99)
   previous=c.execute('SELECT 1 FROM print_selection_items WHERE session_id=? AND work_id=?',(sid,wid)).fetchone()
   if not selected and previous:
    c.execute('UPDATE print_selection_items SET selected=0 WHERE session_id=? AND work_id=?',(sid,wid));c.execute('UPDATE print_selections SET ready=0,revision=revision+1 WHERE id=?',(sid,));c.execute('INSERT INTO print_selection_ops VALUES(?,?,?)',(sid,op,digest));return snapshot(c,c.execute('SELECT * FROM print_selections WHERE id=?',(sid,)).fetchone())
   w=load(c,'finalWorks',wid);s=load(c,'students',w.get('studentId')) if w else None;g=load(c,'classes',s.get('classId')) if s else None
   a.fail(not w or not s or not g or g.get('projectId')!=session['scope'] or session['group_id'] and s.get('classId')!=session['group_id'],403,'Работа не относится к этому списку')
   ref=image_ref(w);a.fail(not ref,409,'Готовое фото отсутствует')
   if selected:
    a.fail(b.get('imageHash')!=ref['$syncBlob'],409,'Фотография обновилась. Выберите новую версию')
    a.fail(isinstance(w.get('correction'),dict) and w['correction'].get('status')=='open',409,'Сначала исправьте эту работу')
   c.execute('INSERT INTO print_selection_items VALUES(?,?,?,?,?) ON CONFLICT(session_id,work_id) DO UPDATE SET image_hash=excluded.image_hash,copies=excluded.copies,selected=excluded.selected',(sid,wid,ref['$syncBlob'],copies,int(selected)))
   c.execute('UPDATE print_selections SET ready=0,revision=revision+1 WHERE id=?',(sid,))
  c.execute('INSERT INTO print_selection_ops VALUES(?,?,?)',(sid,op,digest))
 return snapshot(c,c.execute('SELECT * FROM print_selections WHERE id=?',(sid,)).fetchone())

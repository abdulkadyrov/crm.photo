"""Private workflow plans. Actual completion remains derived from CRM records."""
import hashlib,json,re,time
from datetime import date,datetime,timezone

FIELDS={'dueAt','assigneeId','snoozedUntil','requestedAction','requestedAt','previousSourceId','approvedRevision','reviewedSourceIds','paymentCheck','sourcePurpose','sourceMediaId','sourceReviewedAt','note','reason','entityKind','classId','title','requestedRevision','approvedAt','completedAt'}
PHOTOGRAPHER_FIELDS={'sourcePurpose','sourceMediaId','sourceReviewedAt','reviewedSourceIds','note','reason'}
CAPTURE_ACTIONS={'capture','sort_sources'}

def initialize(c):
 c.executescript('''
 CREATE TABLE IF NOT EXISTS workflow_task_plans(scope_key TEXT PRIMARY KEY,project_id TEXT NOT NULL,student_id TEXT NOT NULL,service_id TEXT NOT NULL,data TEXT NOT NULL,revision INTEGER NOT NULL,updated_at REAL NOT NULL,updated_by TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS workflow_task_project ON workflow_task_plans(project_id);
 CREATE TABLE IF NOT EXISTS workflow_task_events(seq INTEGER PRIMARY KEY AUTOINCREMENT,scope_key TEXT NOT NULL,project_id TEXT NOT NULL,actor TEXT NOT NULL,at REAL NOT NULL,patch TEXT NOT NULL,revision INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS workflow_task_event_project ON workflow_task_events(project_id,seq);
 CREATE TABLE IF NOT EXISTS workflow_task_receipts(actor TEXT NOT NULL,op TEXT NOT NULL,hash TEXT NOT NULL,scope_key TEXT NOT NULL,PRIMARY KEY(actor,op));
 ''')
ensure_schema=initialize

def load(c,store,rid):
 row=c.execute('SELECT scope,data FROM sync_records WHERE store=? AND id=?',(store,rid)).fetchone()
 return (row['scope'],json.loads(row['data'])) if row and row['data'] else None

def plan(row):
 return {**json.loads(row['data']),'scopeKey':row['scope_key'],'projectId':row['project_id'],'studentId':row['student_id'],'serviceId':row['service_id'],'revision':row['revision'],'updatedAt':datetime.fromtimestamp(row['updated_at'],timezone.utc).isoformat(),'updatedBy':row['updated_by']}

def photo_visible(data,u):
 return data.get('assigneeId')==u['id'] and data.get('requestedAction') in CAPTURE_ACTIONS

def public_plan(row,u):
 item=plan(row)
 if u['role']=='photographer' and not photo_visible(item,u):return None
 if u['role']!='admin':
  item.pop('paymentCheck',None)
  if item.get('requestedAction')=='payment':return None
 return item

def validate_patch(a,c,u,scope,student_id,patch):
 a.fail(not isinstance(patch,dict) or not patch or bool(set(patch)-FIELDS),400,'Некорректные поля задачи')
 for key,value in patch.items():
  if value is None:continue
  if key=='reviewedSourceIds':
   a.fail(not isinstance(value,list) or len(value)>500 or any(not isinstance(v,str) or len(v)>160 for v in value),400,'Некорректный список фотографий')
  elif key=='paymentCheck':a.fail(type(value) is not bool)
  else:a.fail(not isinstance(value,str) or len(value)>(1000 if key in ('note','reason') else 200))
  if key in ('dueAt','snoozedUntil','requestedAt','sourceReviewedAt','approvedAt','completedAt') and value:
   try:datetime.fromisoformat(value.replace('Z','+00:00')) if 'T' in value else date.fromisoformat(value)
   except (ValueError,AttributeError):raise a.Error(400,'Некорректная дата')
  if key=='entityKind':a.fail(value not in ('','project','student'),400,'Некорректная область задачи')
  if key=='classId' and value:
   group=load(c,'classes',value);a.fail(not group or group[0]!=scope or group[1].get('projectId')!=scope,403,'Группа относится к другому проекту')
  if key=='requestedAction':a.fail(value not in ('','custom','capture','generate','redo','review','print','deliver','payment','sort_sources','contact_teacher','send','reminder'))
  if key=='sourcePurpose':a.fail(value not in ('','new-service','reshoot','correction','additional-reference','additional_reference','new_service','new','additional'))
  if key=='assigneeId' and value:
   user=c.execute('SELECT id,role,active FROM users WHERE id=?',(value,)).fetchone();a.fail(not user or not user['active'] or user['role']=='viewer',400,'Ответственный недоступен')
   a.fail(user['role']!='admin' and not c.execute('SELECT 1 FROM memberships WHERE user_id=? AND project_id=?',(value,scope)).fetchone(),403,'Ответственному не назначен этот проект')
  if key in ('sourceMediaId','previousSourceId') and value:
   media=load(c,'media',value)
   a.fail(not media and key=='sourceMediaId',425,'Сначала отправьте исходную фотографию на сервер')
   a.fail(media and (media[0]!=scope or media[1].get('studentId')!=student_id),403,'Исходник относится к другому ребёнку')
 a.fail(u['role']=='photographer' and bool(set(patch)-PHOTOGRAPHER_FIELDS),403,'Фотограф отмечает только назначенную съёмку')
 # Managers already receive finance-stripped records in the existing CRM.
 a.fail(u['role']!='admin' and patch.get('requestedAction')=='payment',403,'Проверка оплаты доступна администратору')
 a.fail(u['role']!='admin' and 'paymentCheck' in patch,403,'Проверка оплаты доступна администратору')

def route(r,c,u,a):
 expected=getattr(r,'e',{}).get('HTTP_X_CRM_ACCOUNT')
 a.fail(expected and expected!=u['id'],409,'Аккаунт изменился. Обновите страницу перед сохранением задачи.')
 if r.method=='GET':
  projects={row[0] for row in c.execute('SELECT id FROM projects')} if u['role']=='admin' else {row[0] for row in c.execute('SELECT project_id FROM memberships WHERE user_id=?',(u['id'],))}
  clause='' if u['role']=='admin' else ' AND EXISTS(SELECT 1 FROM memberships m WHERE m.project_id=p.project_id AND m.user_id=?)'
  params=() if u['role']=='admin' else (u['id'],)
  rows=c.execute('SELECT p.* FROM workflow_task_plans p JOIN projects pr ON pr.id=p.project_id WHERE 1=1'+clause+' ORDER BY p.updated_at,p.scope_key',params)
  overrides=[item for row in rows if (item:=public_plan(row,u)) is not None]
  event_clause=clause;event_params=params
  if u['role']!='admin':event_clause+=" AND COALESCE(json_extract(p.data,'$.requestedAction'),'')!='payment'"
  if u['role']=='photographer':
   event_clause+=" AND json_extract(p.data,'$.assigneeId')=? AND json_extract(p.data,'$.requestedAction') IN ('capture','sort_sources')";event_params+=(u['id'],)
  events=[]
  # Scope authorization precedes LIMIT, so other projects cannot starve this feed.
  query='SELECT e.* FROM workflow_task_events e JOIN workflow_task_plans p ON p.scope_key=e.scope_key JOIN projects pr ON pr.id=p.project_id WHERE e.project_id=p.project_id'+event_clause+' ORDER BY e.seq DESC LIMIT 1000'
  for row in c.execute(query,event_params):
   patch=json.loads(row['patch'])
   if u['role']!='admin':patch.pop('paymentCheck',None)
   events.append({'seq':row['seq'],'scopeKey':row['scope_key'],'projectId':row['project_id'],'actor':row['actor'],'at':row['at'],'patch':patch,'revision':row['revision']})
  users=[]
  if u['role'] in ('admin','manager'):
   memberships={}
   for member in c.execute('SELECT user_id,project_id FROM memberships'):memberships.setdefault(member['user_id'],set()).add(member['project_id'])
   for user in c.execute("SELECT id,name,role FROM users WHERE active=1 AND role!='viewer'"):
    shared=projects if user['role']=='admin' else projects & memberships.get(user['id'],set())
    if shared:users.append({'id':user['id'],'name':user['name'],'role':user['role'],'projectIds':sorted(shared)})
  return {'overrides':overrides,'events':events,'users':users,'access':{'id':u['id'],'role':u['role'],'projects':sorted(projects)},'serverTime':time.time()}
 a.fail(r.method!='PUT',404,'Не найдено');a.fail(u['role']=='viewer',403,'Просмотр не позволяет менять задачи')
 b=r.json(128*1024);student_id=a.identifier(b.get('studentId'));service_id=a.identifier(b.get('serviceId'));scope=a.identifier(b.get('projectId'));op=a.identifier(b.get('op'));base=b.get('baseRevision');patch=b.get('patch')
 a.fail(type(base) is not int or base<0);a.fail(not isinstance(patch,dict),400,'Некорректные поля задачи')
 a.fail(u['role']=='admin' and not c.execute('SELECT 1 FROM projects WHERE id=?',(scope,)).fetchone(),425,'Сначала отправьте проект на сервер')
 a.access(c,u,scope)
 existing_plan=c.execute('SELECT data FROM workflow_task_plans WHERE scope_key=?',(student_id+'::'+service_id,)).fetchone()
 current_data=json.loads(existing_plan[0]) if existing_plan else {}
 kind=patch.get('entityKind') or current_data.get('entityKind','')
 project_task=student_id=='project_'+scope and service_id.startswith('task_')
 student_task=service_id.startswith('task_') and kind=='student'
 if project_task:
  a.fail(u['role'] not in ('admin','manager'),403,'Общие задачи добавляет руководитель проекта')
  existing=c.execute('SELECT data FROM workflow_task_plans WHERE scope_key=?',(student_id+'::'+service_id,)).fetchone()
  kind=(patch or {}).get('entityKind') or (json.loads(existing[0]).get('entityKind') if existing else '')
  a.fail(kind!='project',400,'Не указана область общей задачи')
  a.fail(any(k in (patch or {}) for k in ('sourceMediaId','previousSourceId','reviewedSourceIds','approvedRevision')),400,'Общая задача не меняет материалы ребёнка')
  a.fail((patch or {}).get('requestedAction')=='payment' and u['role']!='admin',403,'Проверка оплаты доступна администратору')
 else:
  a.fail((patch or {}).get('entityKind')=='project',400,'Общая задача не может заменить задачу ребёнка')
  student=load(c,'students',student_id);a.fail(not student,425,'Сначала отправьте карточку ребёнка на сервер');a.fail(student[0]!=scope,403,'Ребёнок относится к другому проекту')
  s=student[1];services=set(s.get('catalogIds') or []);services.update(e.get('serviceId') for e in s.get('selectedServices',[]) if isinstance(e,dict));services.add(s.get('catalogId'))
  for order_row in c.execute("SELECT data FROM sync_records WHERE scope=? AND store='orders' AND data IS NOT NULL",(scope,)):
   order=json.loads(order_row[0])
   if order.get('studentId')==student_id:
    services.update(order.get('catalogIds') or []);services.add(order.get('catalogId'));services.update(item.get('serviceId') or str(item.get('type','')).split('__')[0] for item in order.get('items',[]) if isinstance(item,dict))
  has_work=any(json.loads(row[0]).get('studentId')==student_id and json.loads(row[0]).get('serviceId')==service_id for row in c.execute("SELECT data FROM sync_records WHERE scope=? AND store='finalWorks' AND data IS NOT NULL",(scope,)))
  if student_task:
   a.fail(u['role'] not in ('admin','manager'),403,'Задачи создаёт руководитель проекта')
   group=load(c,'classes',s.get('classId'))
   a.fail(not group or group[0]!=scope or group[1].get('projectId')!=scope,403,'Группа ребёнка относится к другому проекту')
   a.fail(patch.get('classId',current_data.get('classId'))!=s.get('classId'),403,'Задача относится к другой группе')
   a.fail(any(k in patch for k in ('sourceMediaId','previousSourceId','reviewedSourceIds','approvedRevision')),400,'Задача не меняет материалы ребёнка')
  else:
   a.fail(kind=='student',400,'Для задачи нужен отдельный идентификатор')
   a.fail(service_id not in services and not has_work,400,'Услуга не выбрана у ребёнка')
 if existing_plan and 'entityKind' in patch:a.fail(patch['entityKind']!=current_data.get('entityKind',''),400,'Нельзя менять область существующей задачи')
 if student_task:
  title=patch.get('title',current_data.get('title',''))
  a.fail(not isinstance(title,str) or not title.strip(),400,'Напишите, что нужно сделать')
  a.fail(not patch.get('requestedAction',current_data.get('requestedAction')),400,'Выберите действие задачи')
 validate_patch(a,c,u,scope,student_id,patch);key=student_id+'::'+service_id
 c.execute('BEGIN IMMEDIATE')
 row=c.execute('SELECT * FROM workflow_task_plans WHERE scope_key=?',(key,)).fetchone();current=plan(row) if row else None
 a.fail(row and row['project_id']!=scope,409,'Проект ребёнка изменился. Обновите задачи.')
 if u['role']=='photographer':a.fail(not current or not photo_visible(current,u),403,'Съёмка не назначена вам')
 digest=hashlib.sha256(json.dumps(b,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 receipt=c.execute('SELECT * FROM workflow_task_receipts WHERE actor=? AND op=?',(u['id'],op)).fetchone()
 if receipt:
  a.fail(receipt['hash']!=digest,409,'Код действия уже использован')
  return {'saved':True,'duplicate':True,'record':public_plan(row,u),'serverTime':time.time()}
 revision=row['revision'] if row else 0
 if base!=revision:return {'conflict':True,'current':public_plan(row,u) if row else None,'serverTime':time.time(),'message':'Задачу изменили на другом устройстве. Проверьте изменения.'}
 data=json.loads(row['data']) if row else {}
 for k,v in patch.items():
  if v is None:data.pop(k,None)
  else:data[k]=v
 now=time.time();revision+=1
 c.execute('INSERT INTO workflow_task_plans VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(scope_key) DO UPDATE SET data=excluded.data,revision=excluded.revision,updated_at=excluded.updated_at,updated_by=excluded.updated_by',(key,scope,student_id,service_id,json.dumps(data,ensure_ascii=False),revision,now,u['id']))
 c.execute('INSERT INTO workflow_task_events(scope_key,project_id,actor,at,patch,revision) VALUES(?,?,?,?,?,?)',(key,scope,u['id'],now,json.dumps(patch,ensure_ascii=False),revision))
 c.execute('INSERT INTO workflow_task_receipts VALUES(?,?,?,?)',(u['id'],op,digest,key))
 return {'saved':True,'record':public_plan(c.execute('SELECT * FROM workflow_task_plans WHERE scope_key=?',(key,)).fetchone(),u),'serverTime':now}

"""Append-only, project-authorized scan journal shared by devices."""
import hashlib
import json
import re
from urllib.parse import parse_qs


def initialize(c):
    c.executescript('''
    CREATE TABLE IF NOT EXISTS scan_rounds(group_id TEXT PRIMARY KEY,round_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS scan_events(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,group_id TEXT NOT NULL,round_id TEXT NOT NULL,submitted TEXT NOT NULL,data TEXT NOT NULL,actor TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS scan_events_group_round ON scan_events(group_id,round_id,seq);
    CREATE TABLE IF NOT EXISTS scan_resets(op TEXT PRIMARY KEY,actor TEXT NOT NULL,request_hash TEXT NOT NULL,result TEXT NOT NULL);
    ''')


def groups(c, u):
    sql="SELECT g.id FROM sync_records g WHERE g.store='classes' AND g.data IS NOT NULL"
    args=()
    if u['role']!='admin':
        sql+=' AND EXISTS(SELECT 1 FROM memberships m WHERE m.project_id=g.scope AND m.user_id=?)'
        args=(u['id'],)
    return [r[0] for r in c.execute(sql,args)]


def rounds(c, ids):
    result=dict.fromkeys(ids,'initial')
    for row in c.execute('SELECT group_id,round_id FROM scan_rounds'):
        if row[0] in result:result[row[0]]=row[1]
    return result


def entity(c,store,rid):
    row=c.execute('SELECT data FROM sync_records WHERE store=? AND id=?',(store,rid)).fetchone()
    if row and row[0]:return json.loads(row[0]),False
    # A deleted photo can still have a legitimate scan queued on an offline phone.
    old=c.execute('SELECT data FROM sync_changes WHERE store=? AND id=? AND data IS NOT NULL ORDER BY seq DESC LIMIT 1',(store,rid)).fetchone()
    return (json.loads(old[0]),True) if old else (None,True)


def route(r,c,u,a):
    allowed=groups(c,u)
    if r.method=='GET':
        try:after=int(parse_qs(r.e.get('QUERY_STRING','')).get('after',['0'])[0])
        except (ValueError,TypeError):raise a.Error(400,'Неверный курсор проверки')
        a.fail(after<0)
        if not allowed:return {'rounds':{},'events':[],'cursor':after,'more':False}
        marks=','.join('?' for _ in allowed)
        rows=list(c.execute(f'SELECT * FROM scan_events WHERE seq>? AND group_id IN ({marks}) ORDER BY seq LIMIT 500',(after,*allowed)))
        return {'rounds':rounds(c,allowed),'events':[json.loads(row['data']) for row in rows], 'cursor':rows[-1]['seq'] if rows else after,'more':len(rows)==500}
    a.fail(r.method!='POST',404,'Не найдено')
    a.fail(u['role']=='viewer',403,'Просмотр не позволяет сохранять проверки')
    body=r.json(2*1024*1024)
    a.fail(not isinstance(body,dict))
    events=body.get('events',[]); reset=body.get('reset')
    a.fail(not isinstance(events,list) or len(events)>200 or (reset is not None and events))
    c.execute('BEGIN IMMEDIATE')
    current=rounds(c,allowed)
    if reset is not None:
        a.fail(not isinstance(reset,dict))
        op=a.identifier(reset.get('op'));expected=reset.get('rounds')
        a.fail(not isinstance(expected,dict) or not expected or len(expected)>10000)
        a.fail(any(gid not in current for gid in expected),403,'Нет доступа к группе')
        digest=hashlib.sha256(json.dumps(reset,sort_keys=True).encode()).hexdigest()
        old=c.execute('SELECT * FROM scan_resets WHERE op=?',(op,)).fetchone()
        if old:
            a.fail(old['actor']!=u['id'] or old['request_hash']!=digest,409,'Код сброса уже использован')
            return json.loads(old['result'])
        # A delayed offline reset must not erase a newer check from another phone.
        a.fail(any(expected[gid]!=current[gid] for gid in expected),409,'Проверка уже начата заново на другом устройстве. Обновите журнал.')
        for gid in expected:
            current[gid]=op
            c.execute('INSERT INTO scan_rounds VALUES(?,?) ON CONFLICT(group_id) DO UPDATE SET round_id=excluded.round_id',(gid,op))
        result={'rounds':current,'reset':op}
        c.execute('INSERT INTO scan_resets VALUES(?,?,?,?)',(op,u['id'],digest,json.dumps(result)))
        return result
    saved=[];archived=[]
    for incoming in events:
        a.fail(not isinstance(incoming,dict))
        event={k:incoming.get(k) for k in ('id','studentId','workId','version','status','accepted','extraCopy','comment','at','groupId','roundId')}
        a.fail(not isinstance(event['id'],str) or not re.fullmatch(r'[A-Za-z0-9_:-]{1,200}',event['id']))
        gid=a.identifier(event['groupId']);event['roundId']=a.identifier(event['roundId'])
        a.fail(gid not in current,403,'Нет доступа к группе')
        a.fail(type(event['version']) is not int or event['version']<0 or type(event['accepted']) is not bool or type(event['extraCopy']) is not bool)
        a.fail(event['status'] not in ('matched','duplicate','rejected','correction','foreign','unknown','inconsistent','choose'))
        a.fail(not isinstance(event['comment'],str) or len(event['comment'])>1000 or not isinstance(event['at'],str) or len(event['at'])>64)
        a.fail(event['accepted'] and (event['status'] not in ('matched','duplicate') or event['status']=='duplicate' and not event['extraCopy']))
        student_id=a.identifier(event['studentId'])
        student,student_deleted=entity(c,'students',student_id)
        a.fail(not student or student.get('classId')!=gid,403,'Ребёнок относится к другой группе')
        work_deleted=False
        if event['workId']:
            a.identifier(event['workId'])
            work,work_deleted=entity(c,'finalWorks',event['workId'])
            a.fail(not work or work.get('studentId')!=student_id,403,'Работа относится к другому ребёнку')
        submitted=json.dumps(event,sort_keys=True,ensure_ascii=False)
        old=c.execute('SELECT * FROM scan_events WHERE id=?',(event['id'],)).fetchone()
        if old:
            a.fail(old['submitted']!=submitted,409,'Идентификатор отметки уже использован')
            saved.append(json.loads(old['data']));continue
        if student_deleted or work_deleted:event.update(status='inconsistent',accepted=False)
        if event['accepted'] and event['workId'] and not event['extraCopy']:
            for previous in c.execute('SELECT data FROM scan_events WHERE group_id=? AND round_id=?',(gid,event['roundId'])):
                previous=json.loads(previous[0])
                if previous['accepted'] and previous['workId']==event['workId'] and previous['version']==event['version']:
                    event.update(status='duplicate',accepted=False)
                    break
        c.execute('INSERT INTO scan_events(id,group_id,round_id,submitted,data,actor) VALUES(?,?,?,?,?,?)',(event['id'],gid,event['roundId'],submitted,json.dumps(event,ensure_ascii=False),u['id']))
        saved.append(event)
        if event['roundId']!=current[gid]:archived.append(event['id'])
    return {'events':saved,'rounds':current,'archived':archived}

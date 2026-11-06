"""One CRM catalog and roster, exposed through capability links to parents."""
import hashlib, json, math, re, secrets, time
from datetime import datetime, timezone
from urllib.parse import urlparse

ORIGIN = 'https://zakaz.khanzama.ru'

def initialize(c):
    c.executescript('''
    CREATE TABLE IF NOT EXISTS parent_classes(id TEXT PRIMARY KEY, project_id TEXT NOT NULL, name TEXT NOT NULL, token TEXT UNIQUE NOT NULL, enabled INTEGER NOT NULL, revision INTEGER NOT NULL DEFAULT 1, services TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS parent_children(id TEXT PRIMARY KEY, class_id TEXT NOT NULL, name TEXT NOT NULL, active INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS parent_catalog(id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS parent_orders(id TEXT PRIMARY KEY, class_id TEXT NOT NULL, child_id TEXT NOT NULL, request_key TEXT NOT NULL UNIQUE, token TEXT NOT NULL UNIQUE, data TEXT NOT NULL, created REAL NOT NULL, UNIQUE(class_id,child_id));
    ''')

def route(r,c,u,path,a):
    fail, ident, text = a.fail, a.identifier, a.text
    if path.startswith('/public/'):
        parts=path.strip('/').split('/')
        fail(len(parts)!=3,404,'Ссылка недействительна')
        kind,token=parts[1:]
        fail(not re.fullmatch(r'[A-Za-z0-9_-]{32,100}',token),404,'Ссылка недействительна')
        if kind=='orders' and r.method=='GET':
            order=c.execute('SELECT data FROM parent_orders WHERE token=?',(token,)).fetchone()
            fail(not order,404,'Заказ не найден'); return json.loads(order[0])
        fail(kind!='classes',404,'Не найдено')
        if r.method=='POST': c.execute('BEGIN IMMEDIATE')
        group=c.execute('SELECT * FROM parent_classes WHERE token=? AND enabled=1',(token,)).fetchone()
        fail(not group,404,'Приём заказов закрыт или ссылка недействительна')
        project=c.execute('SELECT name FROM projects WHERE id=?',(group['project_id'],)).fetchone()
        ids=json.loads(group['services'])
        catalog=[json.loads(row[0]) for sid in ids if (row:=c.execute('SELECT data FROM parent_catalog WHERE id=?',(sid,)).fetchone())]
        if r.method=='GET':
            return {'school':{'name':project[0],'city':''},'class':{'id':group['id'],'name':group['name'],'academic_year':'','photo_session_name':'Школьная фотосъёмка'},'children':[{'id':s['id'],'public_name':s['name']} for s in c.execute('SELECT * FROM parent_children WHERE class_id=? AND active=1 ORDER BY name',(group['id'],))], 'catalog':catalog}
        fail(r.method!='POST',404,'Не найдено')
        b=r.json(); child=ident(b.get('childId')); key=ident(b.get('requestKey')); items=b.get('itemIds'); without=b.get('withoutLaminationIds',[])
        fail(not isinstance(items,list) or not 1<=len(items)<=100 or len(set(items))!=len(items))
        fail(not isinstance(without,list) or len(without)>len(items) or any(not isinstance(v,str) for v in without) or len(set(without))!=len(without) or any(v not in items for v in without),400,'Некорректный выбор ламинации')
        without=set(without)
        previous=c.execute('SELECT * FROM parent_orders WHERE request_key=?',(key,)).fetchone()
        if previous:
            data=json.loads(previous['data'])
            saved_without={v['id'] for v in data['selected_items'] if v.get('comment')=='Без ламинации (защиты)'}
            fail(previous['class_id']!=group['id'] or previous['child_id']!=child or set(items)!={v['id'] for v in data['selected_items']} or without!=saved_without,409,'Эта отправка уже содержит другой заказ')
            return {**data,'duplicate':True}
        # Serialise submissions so double clicks/retries cannot create two orders.
        kid=c.execute('SELECT * FROM parent_children WHERE id=? AND class_id=? AND active=1',(child,group['id'])).fetchone()
        fail(not kid,400,'Выберите ребёнка из этого класса')
        fail(c.execute('SELECT 1 FROM parent_orders WHERE class_id=? AND child_id=?',(group['id'],child)).fetchone(),409,'Для этого ребёнка заказ уже отправлен. Для изменений обратитесь к организатору.')
        selected=[v for v in catalog if v['id'] in items]
        fail(len(selected)!=len(items),409,'Каталог изменился. Обновите страницу и выберите услуги снова.')
        rate='parent:'+hashlib.sha256((r.e.get('REMOTE_ADDR','')+'|'+group['id']).encode()).hexdigest()
        count=c.execute('SELECT * FROM attempts WHERE key=?',(rate,)).fetchone()
        fail(count and count['until']>time.time() and count['count']>=100,429,'Слишком много заказов. Повторите позже.')
        c.execute('INSERT OR REPLACE INTO attempts VALUES(?,?,?)',(rate,count['count']+1 if count and count['until']>time.time() else 1,time.time()+3600))
        oid=secrets.token_hex(16); public=secrets.token_urlsafe(32)
        selected_items=[{**{k:v[k] for k in ('id','name','type','preview_url','preview_video_url','category')},'price':round(max(0,v['price']-(50 if v['id'] in without else 0)),2),'comment':'Без ламинации (защиты)' if v['id'] in without else 'С ламинацией (защитой)'} for v in selected]
        result={'id':oid,'child_id':child,'class_id':group['id'],'duplicate':False,'order_number':'VS-'+oid[:10].upper(),'status':'new','selected_items':selected_items, 'total_amount':round(sum(v['price'] for v in selected_items),2),'child_name':kid['name'],'class_name':group['name'],'school_name':project[0],'public_token':public,'created_at':datetime.now(timezone.utc).isoformat()}
        c.execute('INSERT INTO parent_orders VALUES(?,?,?,?,?,?,?)',(oid,group['id'],child,key,public,json.dumps(result,ensure_ascii=False),time.time()))
        return result
    fail(u is None,401,'Войдите в CRM')
    if path=='/parents/catalog' and r.method=='POST':
        fail(u['role']!='admin',403,'Каталог публикует администратор')
        b=r.json(); entries=b.get('items'); fail(not isinstance(entries,list) or len(entries)>1000)
        for value in entries:
            fail(not isinstance(value,dict))
            sid=ident(value.get('id')); price=value.get('price')
            fail(not isinstance(price,(int,float)) or isinstance(price,bool) or not math.isfinite(price) or not 0<=price<=10000000)
            item={'id':sid,'price':round(price,2),'name':text(value.get('name'))}
            for field in ('description','short_description','category','gender','type'):
                v=value.get(field,''); fail(not isinstance(v,str) or len(v)>10000); item[field]=v
            for field in ('preview_url','preview_video_url'):
                url=value.get(field,''); parsed=urlparse(url)
                fail(not isinstance(url,str) or len(url)>2048 or bool(url) and (parsed.scheme!='https' or parsed.hostname not in ('crm.khanzama.ru','zakaz.khanzama.ru')) ,message='Медиа должно храниться в CRM')
                item[field]=url
            mode=value.get('parent_preview_mode','auto'); fail(mode not in ('auto','print','digital'));item['parent_preview_mode']=mode
            canonical=c.execute("SELECT data FROM sync_records WHERE store='catalog' AND id=? AND data IS NOT NULL",(sid,)).fetchone()
            if canonical:item=a.sync_api.public_catalog(a,json.loads(canonical[0]),item)
            c.execute('INSERT INTO parent_catalog VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',(sid,json.dumps(item,ensure_ascii=False)))
        a.audit(c,u,'parent_catalog_saved',str(len(entries))); return {'ok':True}
    if path.startswith('/parents/media/') and r.method in ('GET','POST'):
        fail(u['role']!='admin',403,'Медиа публикует администратор')
        digest=path.split('/')[-1]; fail(not re.fullmatch(r'[a-f0-9]{64}\.(jpg|png|webp|mp4|webm)',digest))
        folder=a.ROOT/'parent-media'; folder.mkdir(exist_ok=True,mode=0o700)
        target=folder/digest
        if r.method=='POST' and not target.exists():
            raw=r.body(100*1024*1024)
            fail(hashlib.sha256(raw).hexdigest()!=digest.split('.')[0],400,'Контрольная сумма медиа не совпала')
            import os,tempfile
            fd,tmp=tempfile.mkstemp(dir=folder)
            try:
                with os.fdopen(fd,'wb') as f: f.write(raw)
                os.replace(tmp,target)
            finally:
                if os.path.exists(tmp): os.unlink(tmp)
        return {'exists':target.exists(),'url':ORIGIN+'/api/v1/public/media/'+digest}
    if path.startswith('/parents/classes/'):
        if r.method=='POST': c.execute('BEGIN IMMEDIATE')
        cid=ident(path.split('/')[-1]); group=c.execute('SELECT * FROM parent_classes WHERE id=?',(cid,)).fetchone()
        if r.method=='GET':
            fail(not group,404,'Класс ещё не опубликован'); a.access(c,u,group['project_id'])
            return {'url':ORIGIN+'/p/'+group['token'],'enabled':bool(group['enabled']),'revision':group['revision'],'services':json.loads(group['services'])}
        fail(r.method!='POST',404,'Не найдено'); fail(u['role'] not in ('admin','manager'),403,'Только менеджер или администратор')
        b=r.json(); pid=ident(b.get('projectId')); a.access(c,u,pid)
        fail(group and group['project_id']!=pid,409,'Класс уже принадлежит другому проекту')
        fail(group and b.get('revision')!=group['revision'] or not group and b.get('revision',0)!=0,409,'Класс изменён на другом устройстве. Откройте панель заново.')
        children=b.get('children'); services=b.get('services'); fail(not isinstance(children,list) or len(children)>1000 or not isinstance(services,list) or not 1<=len(services)<=1000)
        fail(any(not isinstance(s,dict) for s in children))
        fail(len({s.get('id') for s in children})!=len(children) or len(set(services))!=len(services))
        for sid in services: fail(not c.execute('SELECT 1 FROM parent_catalog WHERE id=?',(ident(sid),)).fetchone(),400,'Сначала опубликуйте каталог услуг')
        for kid in children:
            ident(kid.get('id'));text(kid.get('name'))
            old=c.execute('SELECT class_id FROM parent_children WHERE id=?',(kid['id'],)).fetchone()
            fail(old and old[0]!=cid,409,'Ребёнок уже относится к другому классу')
        token=group['token'] if group else secrets.token_urlsafe(32); revision=group['revision']+1 if group else 1
        c.execute('INSERT INTO parent_classes VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,enabled=excluded.enabled,revision=excluded.revision,services=excluded.services',(cid,pid,text(b.get('name')),token,int(bool(b.get('enabled',True))),revision,json.dumps(services)))
        c.execute('UPDATE parent_children SET active=0 WHERE class_id=?',(cid,))
        for kid in children: c.execute('INSERT INTO parent_children VALUES(?,?,?,1) ON CONFLICT(id) DO UPDATE SET name=excluded.name,active=1',(kid['id'],cid,text(kid['name'])))
        a.audit(c,u,'parent_class_saved',cid)
        return {'url':ORIGIN+'/p/'+token,'revision':revision,'enabled':bool(b.get('enabled',True))}
    if path.startswith('/parents/orders/') and r.method=='GET':
        pid=ident(path.split('/')[-1]);a.access(c,u,pid)
        values=[json.loads(row[0]) for row in c.execute('SELECT o.data FROM parent_orders o JOIN parent_classes g ON g.id=o.class_id WHERE g.project_id=? ORDER BY o.created',(pid,))]
        return values if u['role']=='admin' else a.strip_finance([{k:v for k,v in row.items() if k!='public_token'} for row in values])
    raise a.Error(404,'Не найдено')

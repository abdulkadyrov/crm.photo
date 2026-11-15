"""Parent capability-link mutations. No staff data, client prices or public attachment URLs."""
import hashlib,json,re,secrets,time,uuid
import public_directory
from datetime import datetime,timezone
from email.parser import BytesParser
from email.policy import default

UNHANDLED=object()
def initialize(c):
 c.execute('CREATE TABLE IF NOT EXISTS parent_receipts(class_id TEXT,request_key TEXT,hash TEXT,result TEXT,PRIMARY KEY(class_id,request_key))')

def body(r,a):
 content=r.e.get('CONTENT_TYPE','application/json')
 if not content.startswith('multipart/form-data'):return r.json(),{}
 raw=r.body(26*1024*1024)
 message=BytesParser(policy=default).parsebytes(('Content-Type: '+content+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw)
 a.fail(not message.is_multipart())
 fields={};files={}
 for part in message.iter_parts():
  name=part.get_param('name',header='content-disposition');a.fail(not name or name in fields or name in files)
  data=part.get_payload(decode=True) or b''
  if part.get_filename() is not None:
   a.fail(len(data)>25*1024*1024,413,'Вложение больше 25 МБ');files[name]=(data,part.get_content_type(),part.get_filename())
  else:
   a.fail(len(data)>10000);fields[name]=data.decode('utf-8')
 return fields,files

def write_record(c,store,rid,scope,value):
 data=json.dumps(value,ensure_ascii=False)
 seq=c.execute('INSERT INTO sync_changes(store,id,scope,data,actor,at) VALUES(?,?,?,?,?,?)',(store,rid,scope,data,'parent-api',time.time())).lastrowid
 c.execute('INSERT INTO sync_records VALUES(?,?,?,?,?) ON CONFLICT(store,id) DO UPDATE SET data=excluded.data,seq=excluded.seq',(store,rid,scope,data,seq))

def attach(c,a,group,child,entry,asset,role):
 raw,mime,name=asset
 a.fail(not raw,400,'Пустой файл')
 valid=(mime=='image/jpeg' and raw[:3]==b'\xff\xd8\xff' or mime=='image/png' and raw[:8]==b'\x89PNG\r\n\x1a\n' or mime=='image/webp' and raw[:4]==b'RIFF' and raw[8:12]==b'WEBP' or mime in ('video/mp4','video/quicktime') and raw[4:8]==b'ftyp' or mime=='video/webm' and raw[:4]==b'\x1aE\xdf\xa3')
 a.fail(not valid,400,'Неподдерживаемый или повреждённый файл')
 a.fail(role=='video' and not mime.startswith('video/'),400,'Нужно видео')
 digest=hashlib.sha256(raw).hexdigest();folder=a.ROOT/'sync-blobs';folder.mkdir(exist_ok=True,mode=0o700)
 # A validated private file is content-addressed; orphaned files may be collected only by separate maintenance.
 import os,tempfile
 fd,tmp=tempfile.mkstemp(dir=folder)
 try:
  with os.fdopen(fd,'wb') as out:out.write(raw)
  os.replace(tmp,folder/digest)
 finally:
  if os.path.exists(tmp):os.unlink(tmp)
 mid='parent_'+uuid.uuid4().hex
 c.execute('INSERT OR IGNORE INTO sync_blobs VALUES(?,?,?,?)',(group['project_id'],digest,len(raw),'parent-api'))
 record={'id':mid,'studentId':child,'serviceId':entry['id'],'type':'video' if mime.startswith('video/') else 'image','purpose':'parent_video' if role=='video' else 'parent_request_reference','fileName':name.rsplit('/',1)[-1].rsplit('\\',1)[-1][:200],'createdAt':datetime.now(timezone.utc).isoformat(),'blob':{'$syncBlob':digest,'mime':mime,'size':len(raw)}}
 write_record(c,'media',mid,group['project_id'],record)
 entry['parentVideoMediaId' if role=='video' else 'referenceMediaId']=mid
 if role=='video':entry.update(parentVideoName=record['fileName'],parent_video_name=record['fileName'])
 return mid

def route(r,c,path,a):
 parts=path.strip('/').split('/')
 if len(parts)==4 and parts[:2]==['public','orders'] and parts[3]=='cancel':
  row=c.execute('SELECT o.child_id,g.token FROM parent_orders o JOIN parent_classes g ON g.id=o.class_id WHERE o.token=?',(parts[2],)).fetchone()
  a.fail(not row,404,'Заказ не найден');parts=['public','classes',row['token'],'children',row['child_id'],'order-cancel']
 if len(parts)==7 and parts[:2]==['public','classes'] and parts[3]=='children' and parts[5:]==['order','cancel']:parts=parts[:5]+['order-cancel']
 if len(parts)==4 and parts[:2]==['public','classes'] and parts[3]=='children':parts.append('new')
 if len(parts)<5 or parts[:2]!=['public','classes']:return UNHANDLED
 token=parts[2]
 if not re.fullmatch(r'[A-Za-z0-9_-]{32,100}',token):raise a.Error(404,'Ссылка недействительна')
 if parts[3]!='children':return UNHANDLED
 if r.method=='POST':c.execute('BEGIN IMMEDIATE')
 group=c.execute('SELECT * FROM parent_classes WHERE token=? AND enabled=1',(token,)).fetchone();a.fail(not group,404,'Приём заказов закрыт')
 public_directory.refresh_children(c,group['id'])
 initialize(c)
 a.fail(r.method!='POST',405,'Нужен POST')
 b,files=body(r,a)
 # Capability-link rate limit applies before receipt lookups to cap public resource use.
 rate='mutation:'+hashlib.sha256((r.e.get('REMOTE_ADDR','')+'|'+group['id']).encode()).hexdigest()
 row=c.execute('SELECT * FROM attempts WHERE key=?',(rate,)).fetchone();now=time.time()
 a.fail(row and row['until']>now and row['count']>=300,429,'Повторите позже')
 c.execute('INSERT OR REPLACE INTO attempts VALUES(?,?,?)',(rate,row['count']+1 if row and row['until']>now else 1,now+3600))
 if parts[4]=='preview' and len(parts)==5:
  first=a.text(b.get('firstName'));last=a.text(b.get('lastName'));wanted=' '.join((last+' '+first).casefold().split()).replace('ё','е')
  matches=[{'id':kid['id'],'public_name':kid['name']} for kid in c.execute('SELECT * FROM parent_children WHERE class_id=? AND active=1',(group['id'],)) if ' '.join(kid['name'].casefold().split()).replace('ё','е')==wanted]
  return {'matches':matches,'revision':group['revision']}
 key=a.identifier(b.get('requestKey'))
 hashed=hashlib.sha256(json.dumps({'path':parts[3:],'body':b,'files':{name:{'sha256':hashlib.sha256(value[0]).hexdigest(),'mime':value[1]} for name,value in files.items()}},sort_keys=True).encode()).hexdigest()
 receipt=c.execute('SELECT * FROM parent_receipts WHERE class_id=? AND request_key=?',(group['id'],key)).fetchone()
 if receipt:
  a.fail(receipt['hash']!=hashed,409,'requestKey уже использован с другими данными');return {**json.loads(receipt['result']),'duplicate':True}
 if len(parts)==5 and parts[4]=='new':
  first=a.text(b.get('firstName'));last=a.text(b.get('lastName'));name=last+' '+first
  existing=c.execute('SELECT * FROM parent_children WHERE class_id=? AND name=? AND active=1',(group['id'],name)).fetchone()
  cid=existing['id'] if existing else 'parent_'+uuid.uuid4().hex
  if not existing:
   c.execute('INSERT INTO parent_children VALUES(?,?,?,1)',(cid,group['id'],name))
   write_record(c,'students',cid,group['project_id'],{'id':cid,'classId':group['id'],'firstName':first,'lastName':last,'paymentStatus':'unpaid','catalogIds':[],'selectedServices':[]})
  result={'child':{'id':cid,'public_name':name},'duplicate':bool(existing)}
 else:
  a.fail(len(parts)!=6 or parts[5] not in ('custom-request','service-video','order-cancel'),404,'Не найдено')
  child=a.identifier(parts[4]);kid=c.execute('SELECT * FROM parent_children WHERE id=? AND class_id=? AND active=1',(child,group['id'])).fetchone();a.fail(not kid,404,'Учащийся не найден')
  row=c.execute('SELECT * FROM parent_orders WHERE class_id=? AND child_id=?',(group['id'],child)).fetchone();data=json.loads(row['data']) if row else None
  revision=data.get('revision',1) if data else 0
  try:expected=int(b.get('revision',0))
  except (ValueError,TypeError):raise a.Error(400,'Неверная версия')
  a.fail(expected!=revision,409,'version_conflict: обновите заказ')
  if not data:
   oid=secrets.token_hex(16);project=c.execute('SELECT name FROM projects WHERE id=?',(group['project_id'],)).fetchone()
   data={'id':oid,'child_id':child,'class_id':group['id'],'order_number':'VS-'+oid[:10].upper(),'status':'new','selected_items':[],'child_name':kid['name'],'class_name':group['name'],'school_name':project[0],'public_token':secrets.token_urlsafe(32),'created_at':datetime.now(timezone.utc).isoformat()}
  a.fail(data['status'] not in ('new','cancelled'),409,'Заказ уже в работе; свяжитесь с организатором')
  action=parts[5]
  if action=='custom-request':
   message=a.text(b.get('message',''),10000);sid=b.get('catalogItemId')
   if sid:
    a.fail(sid not in json.loads(group['services']),403,'Услуга недоступна классу')
    catalog=c.execute('SELECT data FROM parent_catalog WHERE id=?',(sid,)).fetchone();a.fail(not catalog,409,'Услуга не найдена');catalog=json.loads(catalog[0]);a.fail(catalog.get('is_active') is False,409,'Услуга недоступна')
   else:catalog={'id':'custom_'+uuid.uuid4().hex,'name':'Индивидуальный заказ','price':0}
   entry={'entryId':'parent_line_'+uuid.uuid4().hex,'id':catalog['id'],'name':catalog['name'],'price':catalog['price'],'requestType':'custom','comment':message,'price_pending':not bool(sid),'quantity':1}
   if 'reference' in files:attach(c,a,group,child,entry,files['reference'],'reference')
   data['selected_items'].append(entry);data['status']='new'
  elif action=='service-video':
   entry=next((item for item in data['selected_items'] if item['id']==b.get('itemId')),None);a.fail(not entry,403,'Услуга не выбрана в этом заказе');a.fail('video' not in files,400,'Выберите видео')
   a.fail(not entry.get('videoAddonRequested'),409,'Сначала выберите оживление фото в заказе');attach(c,a,group,child,entry,files['video'],'video')
  else:a.fail(not row,404,'Заказ не найден');data['status']='cancelled'
  data.update(revision=revision+1,duplicate=False,updated=bool(row),total_amount=round(sum(item['price']*item.get('quantity',1) for item in data['selected_items']),2))
  if row:c.execute('UPDATE parent_orders SET data=? WHERE id=?',(json.dumps(data,ensure_ascii=False),row['id']))
  else:c.execute('INSERT INTO parent_orders VALUES(?,?,?,?,?,?,?)',(data['id'],group['id'],child,key,data['public_token'],json.dumps(data,ensure_ascii=False),now))
  materialize(c,group,data)
  result=data
 c.execute('INSERT INTO parent_receipts VALUES(?,?,?,?)',(group['id'],key,hashed,json.dumps(result,ensure_ascii=False)))
 return result

def materialize(c,group,order):
 """Add parent selections to canonical CRM; never replace payment or existing progress."""
 if order.get('status')=='cancelled':return
 child=order['child_id'];scope=group['project_id']
 row=c.execute("SELECT data FROM sync_records WHERE store='students' AND id=? AND data IS NOT NULL",(child,)).fetchone()
 if not row:return # Existing ZIP-only child is applied by the normal client import path.
 student=json.loads(row[0]);selections=list(student.get('selectedServices') or [])
 catalog_ids=list(student.get('catalogIds') or ([student['catalogId']] if student.get('catalogId') else []))
 rid='order_'+child;row=c.execute("SELECT data FROM sync_records WHERE store='orders' AND id=? AND data IS NOT NULL",(rid,)).fetchone()
 crm=json.loads(row[0]) if row else {'id':rid,'studentId':child,'items':[]}
 tasks=list(crm.get('items') or [])
 for index,item in enumerate(order['selected_items']):
  sid=item['id'];entry_id=item.get('entryId') or 'parent_'+order['id']+'_'+str(index)
  if sid not in catalog_ids:catalog_ids.append(sid)
  existing_selection=next((v for v in selections if v.get('entryId')==entry_id),None)
  if not existing_selection:
   existing_selection=next((v for v in selections if v.get('serviceId')==sid and (not v.get('entryId') or v.get('entryId')==sid)),None)
   if existing_selection:existing_selection['entryId']=entry_id
  if existing_selection:existing_selection.update(comment=item.get('comment',''),quantity=item.get('quantity',1),mediaIds=list(dict.fromkeys([*(existing_selection.get('mediaIds') or []),*[v for v in (item.get('referenceMediaId'),item.get('parentVideoMediaId')) if v]])))
  if not any(v.get('entryId')==entry_id for v in selections):selections.append({'entryId':entry_id,'serviceId':sid,'quantity':item.get('quantity',1),'comment':item.get('comment',''),'mediaIds':[v for v in (item.get('referenceMediaId'),item.get('parentVideoMediaId')) if v]})
  existing_task=next((v for v in tasks if v.get('id')==entry_id),None)
  if existing_task:existing_task.update(comment=item.get('comment',''),referenceMediaId=item.get('referenceMediaId',''),parentVideoMediaId=item.get('parentVideoMediaId',''))
  if not any(v.get('id')==entry_id for v in tasks):tasks.append({'id':entry_id,'taskId':entry_id,'parentRequestId':order['id'],'serviceId':sid,'type':entry_id,'label':item['name'],'requestType':item.get('requestType','catalog'),'comment':item.get('comment',''),'referenceMediaId':item.get('referenceMediaId',''),'parentVideoMediaId':item.get('parentVideoMediaId',''),'status':'pending','fileIds':[]})
  existing=c.execute("SELECT 1 FROM sync_records WHERE store='catalog' AND id=? AND data IS NOT NULL",(sid,)).fetchone()
  if not existing:write_record(c,'catalog',sid,'global',{'id':sid,'name':item['name'],'price':item['price'],'pricePending':item.get('price_pending',False),'angles':[],'gender':'unisex'})
 prices={**(student.get('parentPrices') or {})}
 for item in order['selected_items']:prices[item['id']]={'price':item['price'],'comment':item.get('comment',''),'orderId':order['id']}
 student['parentPrices']=prices
 student.update(catalogIds=catalog_ids,catalogId=catalog_ids[0] if catalog_ids else '',selectedServices=selections,parentOrderIds=list(dict.fromkeys([*(student.get('parentOrderIds') or []),order['id']])))
 crm.update(items=tasks,catalogIds=catalog_ids,catalogId=student['catalogId'],parentOrderId=order['id'],parentNote=order.get('parent_note',''))
 write_record(c,'students',child,scope,student);write_record(c,'orders',rid,scope,crm)

def ordinary(r,c,token,a):
 c.execute('BEGIN IMMEDIATE');initialize(c)
 rate='ordinary:'+hashlib.sha256((r.e.get('REMOTE_ADDR','')+'|'+token).encode()).hexdigest();now=time.time()
 counter=c.execute('SELECT * FROM attempts WHERE key=?',(rate,)).fetchone()
 a.fail(counter and counter['until']>now and counter['count']>=300,429,'Повторите позже')
 c.execute('INSERT OR REPLACE INTO attempts VALUES(?,?,?)',(rate,counter['count']+1 if counter and counter['until']>now else 1,now+3600))
 group=c.execute('SELECT * FROM parent_classes WHERE token=? AND enabled=1',(token,)).fetchone();a.fail(not group,404,'Приём заказов закрыт')
 public_directory.refresh_children(c,group['id'])
 b=r.json();note=b.get('note','');a.fail(not isinstance(note,str) or len(note)>10000);note=note.strip();child=a.identifier(b.get('childId'));key=a.identifier(b.get('requestKey'));ids=b.get('itemIds');without=b.get('withoutLaminationIds',[]);prefs=b.get('itemPreferences',{})
 a.fail(not isinstance(ids,list) or not 1<=len(ids)<=100 or any(not isinstance(v,str) for v in ids) or len(set(ids))!=len(ids))
 a.fail(not isinstance(without,list) or any(v not in ids for v in without) or len(set(without))!=len(without))
 a.fail(not isinstance(prefs,dict) or any(k not in ids for k in prefs))
 for pref in prefs.values():a.fail(not isinstance(pref,dict) or not isinstance(pref.get('comment',''),str) or len(pref.get('comment',''))>10000 or not isinstance(pref.get('videoAddonRequested',False),bool))
 digest=hashlib.sha256(json.dumps(b,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 receipt=c.execute('SELECT * FROM parent_receipts WHERE class_id=? AND request_key=?',(group['id'],key)).fetchone()
 if receipt:
  a.fail(receipt['hash']!=digest,409,'requestKey уже использован для другого заказа');return {**json.loads(receipt['result']),'duplicate':True}
 kid=c.execute('SELECT * FROM parent_children WHERE id=? AND class_id=? AND active=1',(child,group['id'])).fetchone();a.fail(not kid,400,'Выберите учащегося из этого класса')
 row=c.execute('SELECT * FROM parent_orders WHERE class_id=? AND child_id=?',(group['id'],child)).fetchone();old=json.loads(row['data']) if row else {}
 try:revision=int(b.get('revision',0))
 except (ValueError,TypeError):raise a.Error(400,'Неверная версия')
 a.fail(revision!=(old.get('revision',1) if row else 0),409,'version_conflict: обновите заказ')
 a.fail(old and old['status'] not in ('new','cancelled'),409,'Заказ уже в работе')
 allowed=json.loads(group['services']);a.fail(any(sid not in allowed for sid in ids),409,'Каталог изменился')
 for index,item in enumerate(old.get('selected_items',[])):item.setdefault('entryId','parent_'+old['id']+'_'+str(index))
 selected=[]
 for sid in ids:
  stored=c.execute('SELECT data FROM parent_catalog WHERE id=?',(sid,)).fetchone();a.fail(not stored,409,'Услуга недоступна');item=json.loads(stored[0]);a.fail(item.get('is_active') is False,409,'Услуга недоступна');pref=prefs.get(sid,{})
  message=pref.get('comment','').strip();addon=pref.get('videoAddonRequested',False)
  previous=next((v for v in old.get('selected_items',[]) if v['id']==sid and v.get('requestType')!='custom'),{})
  selected.append({'entryId':previous.get('entryId') or 'catalog_'+sid,**{k:item.get(k,'') for k in ('id','name','type','preview_url','preview_video_url','category')},'price':round(max(0,item['price']-(50 if sid in without else 0))+(500 if addon else 0),2),'comment':('Без ламинации (защиты)' if sid in without else 'С ламинацией (защитой)')+(' · '+message if message else ''),'parentComment':message,'parent_comment':message,'videoAddonRequested':addon,'video_addon_requested':addon,'withoutLamination':sid in without,**{k:previous[k] for k in ('referenceMediaId','parentVideoMediaId') if k in previous}})
 selected.extend(item for item in old.get('selected_items',[]) if item.get('requestType')=='custom')
 oid=old.get('id') or secrets.token_hex(16);project=c.execute('SELECT name FROM projects WHERE id=?',(group['project_id'],)).fetchone()
 result={**old,'parent_note':note,'id':oid,'child_id':child,'class_id':group['id'],'duplicate':False,'updated':bool(row),'revision':revision+1,'order_number':old.get('order_number') or 'VS-'+oid[:10].upper(),'status':'new','selected_items':selected,'total_amount':round(sum(v['price']*v.get('quantity',1) for v in selected),2),'child_name':kid['name'],'class_name':group['name'],'school_name':project[0],'public_token':old.get('public_token') or secrets.token_urlsafe(32),'created_at':old.get('created_at') or datetime.now(timezone.utc).isoformat()}
 if row:c.execute('UPDATE parent_orders SET data=? WHERE id=?',(json.dumps(result,ensure_ascii=False),oid))
 else:c.execute('INSERT INTO parent_orders VALUES(?,?,?,?,?,?,?)',(oid,group['id'],child,key,result['public_token'],json.dumps(result,ensure_ascii=False),time.time()))
 materialize(c,group,result)
 c.execute('INSERT INTO parent_receipts VALUES(?,?,?,?)',(group['id'],key,digest,json.dumps(result,ensure_ascii=False)))
 return result

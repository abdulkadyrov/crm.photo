"""Authorized metadata-only transfer inventory; never returns media bytes or finance."""
import json,re,time

def snapshot(c,u,scope,a):
 a.scope_access(a,c,u,scope)
 records=[];files={};groups=[];students=[];media=[];name='Каталог и шаблоны' if scope=='global' else scope
 for row in c.execute('SELECT store,id,data FROM sync_records WHERE scope=? AND data IS NOT NULL ORDER BY store,id',(scope,)):
  if u['role']!='admin' and row['store']=='documents':continue
  value=json.loads(row['data']);refs=[]
  for ref in a.blob_refs(value):
   digest=ref.get('$syncBlob');size=ref.get('size')
   if not isinstance(digest,str) or not re.fullmatch('[a-f0-9]{64}',digest) or type(size) is not int or size<0:continue
   refs.append(digest)
   if digest not in files:
    stored=c.execute('SELECT size FROM sync_blobs WHERE scope=? AND digest=?',(scope,digest)).fetchone();path=a.ROOT/'sync-blobs'/digest
    try:ready=bool(stored and stored['size']==size and path.stat().st_size==size)
    except OSError:ready=False
    if not ready and stored and stored['size']==size:
     from sync_api import mirrored_ready
     ready=mirrored_ready(c,scope,digest)
    files[digest]={'id':digest,'bytes':size,'ready':ready}
  item={'id':row['id'],'store':row['store'],'files':list(dict.fromkeys(refs)),'studentId':value.get('studentId') or value.get('ownerId'),'classId':value.get('classId') or value.get('albumClassId') or value.get('groupId')}
  records.append(item)
  if row['store'] in ('projects','albumProjects'):name=value.get('name') or value.get('schoolName') or name
  if row['store'] in ('classes','albumClasses'):groups.append({'id':row['id'],'name':value.get('name') or 'Группа'})
  if row['store'] in ('students','albumStudents'):students.append({'id':row['id'],'classId':item['classId']})
  if row['store'] in ('media','albumMedia'):media.append({'id':row['id'],'studentId':item['studentId'],'type':value.get('type'),'files':item['files']})
 return {'scope':scope,'name':name,'checkedAt':time.time(),'records':records,'files':list(files.values()),'groups':groups,'students':students,'media':media}

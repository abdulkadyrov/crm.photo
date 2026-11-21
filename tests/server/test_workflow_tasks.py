import json,re,sqlite3,sys,unittest,uuid
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'server'))
import workflow_tasks

class APIError(Exception):
 def __init__(self,status,message):self.status,self.message=status,message

def fail(condition,status=400,message='Invalid'):
 if condition:raise APIError(status,message)
def identifier(value):
 fail(not isinstance(value,str) or not re.fullmatch('[A-Za-z0-9_-]{1,160}',value));return value

class WorkflowTasksTest(unittest.TestCase):
 def setUp(self):
  self.c=sqlite3.connect(':memory:');self.c.row_factory=sqlite3.Row
  self.c.executescript('CREATE TABLE users(id TEXT,name TEXT,role TEXT,active INT);CREATE TABLE projects(id TEXT);CREATE TABLE memberships(user_id TEXT,project_id TEXT);CREATE TABLE sync_records(store TEXT,id TEXT,scope TEXT,data TEXT);')
  workflow_tasks.initialize(self.c)
  self.c.executemany('INSERT INTO users(id,role,active) VALUES(?,?,1)',[('a','admin'),('m','manager'),('p','photographer'),('v','viewer'),('outsider','manager')]);self.c.executemany('INSERT INTO projects VALUES(?)',[('school',),('other',)]);self.c.executemany('INSERT INTO memberships VALUES(?,?)',[('m','school'),('p','school'),('v','school'),('outsider','other')])
  self.c.execute('INSERT INTO sync_records VALUES(?,?,?,?)',('students','child','school',json.dumps({'id':'child','catalogIds':['wolf','tower']})))
  self.c.execute('INSERT INTO sync_records VALUES(?,?,?,?)',('students','other-child','other',json.dumps({'id':'other-child','catalogId':'wolf'})))
  self.c.commit();self.a=SimpleNamespace(Error=APIError,fail=fail,identifier=identifier,access=self.access)
 def tearDown(self):self.c.close()
 def access(self,c,u,scope):
  fail(not c.execute('SELECT 1 FROM projects WHERE id=?',(scope,)).fetchone(),404)
  fail(u['role']!='admin' and not c.execute('SELECT 1 FROM memberships WHERE user_id=? AND project_id=?',(u['id'],scope)).fetchone(),403)
 def req(self,body=None,uid='a',method=None):
  u=dict(self.c.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone());r=SimpleNamespace(method=method or ('PUT' if body else 'GET'),json=lambda limit:body)
  try:result=workflow_tasks.route(r,self.c,u,self.a);self.c.commit();return result
  except Exception:self.c.rollback();raise
 def update(self,patch=None,**more):return {'studentId':'child','serviceId':'wolf','projectId':'school','baseRevision':0,'op':uuid.uuid4().hex,'patch':patch or {'dueAt':'2026-11-25'},**more}
 def status(self,status,callback):
  with self.assertRaises(APIError) as e:callback()
  self.assertEqual(e.exception.status,status)
 def test_shared_persistence_idempotence_and_distinct_services(self):
  op=self.update();one=self.req(op);two=self.req(op);self.assertTrue(two['duplicate']);self.assertEqual(one['record']['revision'],1);self.assertEqual(two['record']['revision'],1)
  self.req(self.update({'requestedAction':'capture','assigneeId':'p'},serviceId='tower'))
  self.assertEqual(len(self.req(uid='m')['overrides']),2);self.assertNotIn('outsider',[u['id'] for u in self.req(uid='m')['users']]);self.assertEqual(self.c.execute('SELECT count(*) FROM workflow_task_events').fetchone()[0],2)
  self.assertEqual(self.req()['overrides'][0]['dueAt'],'2026-11-25')
 def test_conflict_never_overwrites_and_receipt_collision(self):
  op=self.update();self.req(op);conflict=self.req(self.update({'dueAt':'2026-12-01'}));self.assertTrue(conflict['conflict']);self.assertEqual(conflict['current']['dueAt'],'2026-11-25')
  op['patch']['dueAt']='2026-12-02';self.status(409,lambda:self.req(op));self.assertEqual(len(self.req()['events']),1)
 def test_project_and_student_acl(self):
  self.status(403,lambda:self.req(self.update(),uid='outsider'));self.status(403,lambda:self.req(self.update(projectId='other')));self.status(425,lambda:self.req(self.update(studentId='missing')));self.status(403,lambda:self.req(self.update(),uid='v'))
  self.req(self.update());self.assertEqual(self.req(uid='outsider')['overrides'],[])
 def test_assignee_access_and_service_validation(self):
  self.status(403,lambda:self.req(self.update({'assigneeId':'outsider'})));self.status(400,lambda:self.req(self.update(serviceId='not-ordered')))
  self.c.execute('INSERT INTO sync_records VALUES(?,?,?,?)',('finalWorks','old-work','school',json.dumps({'studentId':'child','serviceId':'removed-service'})));self.c.commit()
  self.assertTrue(self.req(self.update(serviceId='removed-service'))['saved'])
 def test_photographer_sees_only_assigned_capture_and_no_finance(self):
  self.req(self.update({'requestedAction':'capture','assigneeId':'p','paymentCheck':True}));self.req(self.update({'requestedAction':'review','assigneeId':'p'},serviceId='tower'))
  rows=self.req(uid='p')['overrides'];self.assertEqual(len(rows),1);self.assertNotIn('paymentCheck',rows[0]);self.assertNotIn('paymentCheck',self.req(uid='p')['events'][0]['patch'])
  self.status(403,lambda:self.req(self.update({'dueAt':'2026-12-01'},baseRevision=1),uid='p'))
  self.assertTrue(self.req(self.update({'sourcePurpose':'reshoot'},baseRevision=1),uid='p')['saved'])
  self.status(403,lambda:self.req(self.update({'sourcePurpose':'reshoot'},serviceId='tower',baseRevision=1),uid='p'))
 def test_clear_fields_keeps_history(self):
  self.req(self.update({'requestedAction':'capture','dueAt':'2026-11-25'}));record=self.req(self.update({'requestedAction':'','dueAt':None},baseRevision=1))['record'];self.assertNotIn('dueAt',record);self.assertEqual(record['requestedAction'],'');self.assertEqual(len(self.req()['events']),2)
 def test_bad_payloads(self):
  for patch in ({'__proto__':{}},{'dueAt':'yesterday'},{'reviewedSourceIds':'x'},{'sourcePurpose':'unknown'},{'paymentCheck':1}):self.status(400,lambda:self.req(self.update(patch)))
  self.status(403,lambda:self.req(self.update({'paymentCheck':True}),uid='m'))
 def test_event_limit_applies_after_project_authorization(self):
  self.req(self.update({'dueAt':'2026-11-25'}));self.req(self.update({'dueAt':'2026-12-01'},studentId='other-child',projectId='other'))
  self.c.executemany('INSERT INTO workflow_task_events(scope_key,project_id,actor,at,patch,revision) VALUES(?,?,?,?,?,?)',[('other-child::wolf','other','a',0,'{}',i) for i in range(1100)]);self.c.commit()
  events=self.req(uid='m')['events'];self.assertEqual(len(events),1);self.assertEqual(events[0]['scopeKey'],'child::wolf')
 def test_revoked_membership_and_reassigned_photo_are_unreadable(self):
  self.req(self.update({'requestedAction':'capture','assigneeId':'p'}));self.assertEqual(len(self.req(uid='p')['overrides']),1)
  self.req(self.update({'assigneeId':'m'},baseRevision=1));self.assertEqual(self.req(uid='p')['overrides'],[]);self.assertEqual(self.req(uid='p')['events'],[])
  self.c.execute("DELETE FROM memberships WHERE user_id='m'");self.c.commit();self.assertEqual(self.req(uid='m')['overrides'],[]);self.assertEqual(self.req(uid='m')['events'],[]);self.assertEqual(self.req(uid='m')['users'],[]);self.assertEqual(self.req(uid='m')['access']['projects'],[])
 def test_sources_wait_for_upload_and_cannot_cross_children(self):
  self.status(425,lambda:self.req(self.update({'sourceMediaId':'not-uploaded'})))
  self.c.executemany('INSERT INTO sync_records VALUES(?,?,?,?)',[('media','own-photo','school',json.dumps({'studentId':'child'})),('media','other-photo','school',json.dumps({'studentId':'different-child'}))]);self.c.commit()
  self.status(403,lambda:self.req(self.update({'sourceMediaId':'other-photo'})));self.status(403,lambda:self.req(self.update({'previousSourceId':'other-photo'})))
  self.assertTrue(self.req(self.update({'sourceMediaId':'own-photo','previousSourceId':'legacy-deleted-source'}))['saved'])
 def test_non_admin_cannot_clear_financial_flag(self):
  self.req(self.update({'paymentCheck':True}));self.status(403,lambda:self.req(self.update({'paymentCheck':None},baseRevision=1),uid='m'));self.assertTrue(self.req()['overrides'][0]['paymentCheck'])
 def test_access_snapshot_and_utc_revision_timestamps(self):
  record=self.req(self.update())['record'];self.assertTrue(record['updatedAt'].endswith('+00:00'));self.assertEqual(self.req(uid='p')['access'],{'id':'p','role':'photographer','projects':['school']});self.assertEqual(record['scopeKey'],'child::wolf')
 def test_account_cookie_switch_cannot_write_old_account_outbox(self):
  u=dict(self.c.execute("SELECT * FROM users WHERE id='m'").fetchone());r=SimpleNamespace(method='PUT',json=lambda limit:self.update(),e={'HTTP_X_CRM_ACCOUNT':'a'})
  self.status(409,lambda:workflow_tasks.route(r,self.c,u,self.a));self.assertEqual(self.c.execute('SELECT count(*) FROM workflow_task_plans').fetchone()[0],0)

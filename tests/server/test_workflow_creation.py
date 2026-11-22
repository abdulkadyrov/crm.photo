import test_workflow_tasks as fixtures
import unittest,json
class WorkflowCreationTest(unittest.TestCase):
 tearDown=fixtures.WorkflowTasksTest.tearDown
 access=fixtures.WorkflowTasksTest.access
 req=fixtures.WorkflowTasksTest.req
 update=fixtures.WorkflowTasksTest.update
 status=fixtures.WorkflowTasksTest.status
 def setUp(self):
  fixtures.WorkflowTasksTest.setUp(self)
  self.c.execute("UPDATE sync_records SET data=? WHERE store='students' AND id='child'",(json.dumps({'id':'child','classId':'g','catalogIds':[]}),))
  self.c.execute('INSERT INTO sync_records VALUES(?,?,?,?)',('classes','g','school',json.dumps({'id':'g','projectId':'school'})));self.c.commit()
 def child_task(self,action='contact_teacher',**extra):
  return self.update({'entityKind':'student','classId':'g','title':'Уточнить имя','requestedAction':action,'dueAt':'2026-11-25','reason':'Спросить учителя'},serviceId='task_note',**extra)
 def test_manual_child_without_selected_service_and_completion(self):
  body=self.child_task();one=self.req(body,uid='m');self.assertTrue(one['saved']);self.assertTrue(self.req(body,uid='m')['duplicate']);self.assertEqual(one['record']['studentId'],'child')
  self.req(self.update({'completedAt':'2026-11-22T10:00:00Z'},serviceId='task_note',baseRevision=1),uid='m');self.assertTrue(self.req(uid='m')['overrides'][0]['completedAt'])
 def test_creation_cannot_cross_scope_or_reclassify_service_task(self):
  self.status(403,lambda:self.req(self.child_task(projectId='other')))
  body=self.child_task();body['patch']['classId']='foreign';self.status(403,lambda:self.req(body))
  self.status(400,lambda:self.req(self.update({'entityKind':'student','classId':'g'},serviceId='wolf')))
  self.status(403,lambda:self.req(self.child_task(),uid='p'));self.status(403,lambda:self.req(self.child_task(),uid='v'))
 def test_reminders_and_sending_are_task_records_not_messages(self):
  for action in ['reminder','send','contact_teacher','custom']:
   body=self.child_task(action);body['serviceId']='task_'+action;self.assertTrue(self.req(body)['saved'])
  self.assertEqual(self.c.execute('SELECT count(*) FROM workflow_task_plans').fetchone()[0],4);self.assertEqual(self.c.execute('SELECT count(*) FROM sync_records').fetchone()[0],3)

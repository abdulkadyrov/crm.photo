import json,unittest,uuid
from types import SimpleNamespace
from unittest.mock import Mock
from test_cloud import app,request,PASSWORD
import storage_inventory

class StorageInventory(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.cookies={}
  with app.db() as c:
   for role in ('admin','manager','viewer','photographer'):
    uid='storage-'+role;c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(uid,uid,uid,role,app.password_hash(PASSWORD)))
  for role in ('admin','manager','viewer','photographer'):cls.cookies[role]=request('/login','POST',{'login':'storage-'+role,'password':PASSWORD})['headers']['Set-Cookie'].split(';')[0]
 def setUp(self):
  with app.db() as c:
   storage_inventory.initialize(c);c.execute('DELETE FROM s3_inventory_objects');c.execute('DELETE FROM s3_inventory_state')
 def test_admin_only_and_read_only(self):
  self.assertEqual(request('/admin/storage')['status'],401)
  for role in ('manager','viewer','photographer'):self.assertEqual(request('/admin/storage',cookie=self.cookies[role])['status'],403)
  self.assertEqual(request('/admin/storage','POST',{},self.cookies['admin'])['status'],405)
  self.assertEqual(request('/admin/storage',cookie=self.cookies['admin'],headers={'QUERY_STRING':'offset=-1'})['status'],400)
  empty=request('/admin/storage',cookie=self.cookies['admin']);self.assertEqual(empty['status'],200,empty);self.assertIsNone(empty['data']['totalBytes']);self.assertEqual(empty['data']['status'],'waiting')
 def test_paged_scan_publishes_only_complete_snapshot_and_groups_real_prefixes(self):
  storage=SimpleNamespace(bucket='private-bucket',client=Mock())
  storage.client.list_objects_v2.side_effect=[{'Contents':[{'Key':'crm/v1/p/a','Size':10}],'IsTruncated':True,'NextContinuationToken':'PRIVATE-CURSOR'},{'Contents':[{'Key':'backups/day.zip','Size':30},{'Key':'crm/v1/p/b','Size':20}],'IsTruncated':False}]
  self.assertTrue(storage_inventory.refresh_one(app,storage,100))
  with app.db() as c:self.assertIsNone(storage_inventory.overview(c)['totalBytes'])
  self.assertTrue(storage_inventory.refresh_one(app,storage,101));self.assertEqual(storage.client.list_objects_v2.call_args.kwargs['ContinuationToken'],'PRIVATE-CURSOR')
  with app.db() as c:
   root=storage_inventory.overview(c);self.assertEqual(root['totalObjects'],3);self.assertEqual(root['totalBytes'],60);self.assertEqual([entry['prefix'] for entry in root['entries']],['backups/','crm/'])
   files=storage_inventory.overview(c,'crm/v1/p/',limit=1);self.assertEqual(files['totalBytes'],30);self.assertEqual(files['entries'][0]['name'],'a');self.assertEqual(files['nextOffset'],1)
   self.assertNotIn('PRIVATE-CURSOR',json.dumps(root));self.assertNotIn('private-bucket',json.dumps(root))
  self.assertFalse(storage_inventory.refresh_one(app,storage,200));self.assertEqual(storage.client.list_objects_v2.call_count,2)
 def test_provider_failure_keeps_previous_snapshot_and_never_exposes_error_secrets(self):
  storage=SimpleNamespace(bucket='private',client=Mock());storage.client.list_objects_v2.return_value={'Contents':[{'Key':'crm/file','Size':12}],'IsTruncated':False}
  storage_inventory.refresh_one(app,storage,100)
  storage.client.list_objects_v2.side_effect=RuntimeError('SECRET credentials endpoint')
  self.assertFalse(storage_inventory.refresh_one(app,storage,800))
  with app.db() as c:
   cached=storage_inventory.overview(c);self.assertEqual(cached['totalBytes'],12);self.assertEqual(cached['status'],'error');self.assertNotIn('SECRET',json.dumps(cached))
  self.assertEqual(storage.client.delete_object.call_count,0);self.assertEqual(storage.client.put_object.call_count,0)

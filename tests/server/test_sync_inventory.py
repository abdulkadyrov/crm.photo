import unittest,json,tempfile,sqlite3,sys
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'server'))
from sync_inventory import snapshot
class InventoryTest(unittest.TestCase):
 def test_authorized_unique_inventory_checks_real_bytes_and_omits_documents_for_staff(self):
  from sync_api import blob_refs
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);(root/'sync-blobs').mkdir();(root/'sync-blobs'/('a'*64)).write_bytes(b'123')
   c=sqlite3.connect(':memory:');c.row_factory=sqlite3.Row;c.execute('CREATE TABLE sync_records(store,id,data,scope)');c.execute('CREATE TABLE sync_blobs(scope,digest,size)')
   ref={'$syncBlob':'a'*64,'size':3};missing={'$syncBlob':'b'*64,'size':5}
   for store,rid,data in [('projects','p',{'name':'School','paidAmount':99}),('classes','g',{'name':'1A'}),('students','s',{'classId':'g','paidAmount':10}),('media','m',{'studentId':'s','type':'photo','blob':ref,'copy':ref}),('finalWorks','w',{'studentId':'s','blob':missing}),('documents','secret',{'blob':{'$syncBlob':'c'*64,'size':900}})]:c.execute('INSERT INTO sync_records VALUES(?,?,?,?)',(store,rid,json.dumps(data),'p'))
   c.execute('INSERT INTO sync_blobs VALUES(?,?,?)',('p','a'*64,3));c.execute('INSERT INTO sync_blobs VALUES(?,?,?)',('p','b'*64,5))
   def access(a,c,u,scope):
    if scope!='p':raise PermissionError()
   a=SimpleNamespace(ROOT=root,scope_access=access,blob_refs=blob_refs)
   result=snapshot(c,{'role':'manager'},'p',a);self.assertEqual(len(result['files']),2);self.assertEqual(sum(f['bytes'] for f in result['files']),8);self.assertEqual([f['ready'] for f in result['files']],[False,True] if result['files'][0]['id'].startswith('b') else [True,False]);self.assertNotIn('paidAmount',json.dumps(result));self.assertNotIn('secret',json.dumps(result));self.assertEqual(result['students'],[{'id':'s','classId':'g'}])
   with self.assertRaises(PermissionError):snapshot(c,{'role':'manager'},'foreign',a)

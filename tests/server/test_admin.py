import time,unittest
from test_cloud import app,request,PASSWORD

class AdminTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.cookies={}
  with app.db() as c:
   for role in ('admin','manager','photographer','viewer'):
    uid='stats-'+role
    c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(uid,uid,uid,role,app.password_hash(PASSWORD)))
  for role in ('admin','manager','photographer','viewer'):
   cls.cookies[role]=request('/login','POST',{'login':'stats-'+role,'password':PASSWORD})['headers']['Set-Cookie'].split(';')[0]
 def test_access_is_server_enforced(self):
  self.assertEqual(request('/admin/overview')['status'],401)
  for role in ('manager','photographer','viewer'):
   self.assertEqual(request('/admin/overview',cookie=self.cookies[role])['status'],403)
 def test_distinct_cards_period_and_no_secrets(self):
  now=time.time()
  with app.db() as c:
   for store,rid,at in [('students','one',now),('students','one',now),('media','photo',now),('students','old',now-31*86400)]:
    c.execute('INSERT INTO sync_changes(store,id,scope,data,actor,at) VALUES(?,?,?,?,?,?)',(store,rid,'stats','{}','stats-photographer',at))
  r=request('/admin/overview',cookie=self.cookies['admin']);self.assertEqual(r['status'],200)
  row=next(v for v in r['data']['users'] if v['id']=='stats-photographer')
  self.assertEqual(row['changes'],3);self.assertEqual(row['students'],1);self.assertEqual(row['media'],1)
  self.assertIsNotNone(row['last_login'])
  for secret in (b'password',b'token',PASSWORD.encode()):self.assertNotIn(secret,r['raw'])

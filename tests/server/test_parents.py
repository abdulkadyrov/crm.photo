import json,uuid,hashlib,unittest
from test_cloud import app,request
import test_cloud

class ParentTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Reuse the test accounts created by CloudTest, without replacing them.
        cls.cookies={}
        with app.db() as c:
            for role in ('admin','manager'):
                uid='parent-'+role
                c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(uid,uid,uid,role,app.password_hash(test_cloud.PASSWORD)))
            c.executemany('INSERT INTO projects VALUES(?,?)',[('pp1','Parent school'),('pp2','Other school')])
            c.execute('INSERT INTO memberships VALUES(?,?)',('parent-manager','pp1'))
        for role in ('admin','manager'):
            cls.cookies[role]=request('/login','POST',{'login':'parent-'+role,'password':test_cloud.PASSWORD})['headers']['Set-Cookie'].split(';')[0]
    def test_parent_flow(self):
        admin=self.cookies['admin']; manager=self.cookies['manager']
        item={'id':'service-parent','name':'Portrait','price':750,'type':'photo','preview_url':'https://crm.khanzama.ru/assets/example.jpg'}
        self.assertEqual(request('/parents/catalog','POST',{'items':[item]},manager)['status'],403)
        self.assertEqual(request('/parents/catalog','POST',{'items':[item]},admin)['status'],200)
        payload={'projectId':'pp1','name':'1A','revision':0,'children':[{'id':'parent-child','name':'Иван Иванов'}],'services':['service-parent'],'enabled':True}
        result=request('/parents/classes/parent-class','POST',payload,admin);self.assertEqual(result['status'],200,result)
        token=result['data']['url'].split('/')[-1];url='/public/classes/'+token
        public=request(url);self.assertEqual(public['status'],200)
        self.assertEqual(public['data']['children'],[{'id':'parent-child','public_name':'Иван Иванов'}])
        self.assertNotIn('orders',public['data'])
        origin='https://zakaz.khanzama.ru'
        order={'childId':'parent-child','itemIds':['service-parent'],'withoutLaminationIds':['service-parent'],'requestKey':str(uuid.uuid4()),'price':1}
        self.assertEqual(request(url,'POST',order)['status'],403)
        self.assertEqual(request(url,'POST',{**order,'childId':'foreign'},origin=origin)['status'],400)
        result=request(url,'POST',order,origin=origin);self.assertEqual(result['status'],200,result)
        self.assertEqual(result['data']['total_amount'],700)
        self.assertEqual(result['data']['selected_items'][0]['comment'],'Без ламинации (защиты)')
        duplicate=request(url,'POST',order,origin=origin);self.assertTrue(duplicate['data']['duplicate'])
        self.assertEqual(request(url,'POST',{**order,'withoutLaminationIds':[]},origin=origin)['status'],409)
        self.assertEqual(request(url,'POST',{**order,'requestKey':str(uuid.uuid4())},origin=origin)['status'],409)
        self.assertEqual(request('/parents/classes/parent-class','POST',payload,admin)['status'],409)
        self.assertEqual(request('/parents/orders/pp2',cookie=manager)['status'],403)
        staff=request('/parents/orders/pp1',cookie=manager)['data'];self.assertNotIn('total_amount',staff[0]);self.assertNotIn('price',staff[0]['selected_items'][0])
        item['price']=999;request('/parents/catalog','POST',{'items':[item]},admin)
        saved=request('/public/orders/'+result['data']['public_token'])['data'];self.assertEqual(saved['total_amount'],700)
        payload.update(revision=1,enabled=False)
        self.assertEqual(request('/parents/classes/parent-class','POST',payload,admin)['status'],200)
        self.assertEqual(request(url)['status'],404)
    def test_media_dedup_range(self):
        raw=b'example media data';digest=hashlib.sha256(raw).hexdigest()+'.mp4';path='/parents/media/'+digest
        self.assertFalse(request(path,cookie=self.cookies['admin'])['data']['exists'])
        self.assertEqual(request(path,'POST',raw,self.cookies['admin'])['status'],200)
        self.assertTrue(request(path,cookie=self.cookies['admin'])['data']['exists'])
        got=request('/public/media/'+digest,headers={'HTTP_RANGE':'bytes=0-6'})
        self.assertEqual(got['status'],206);self.assertEqual(got['raw'],b'example')

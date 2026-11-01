import io,json,os,tempfile,unittest,zipfile,sys,importlib.util
from pathlib import Path
TEST_ROOT=tempfile.TemporaryDirectory()
os.environ['CRM_DATA_DIR']=TEST_ROOT.name
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'server'))
spec=importlib.util.spec_from_file_location('cloud',Path(__file__).resolve().parents[2]/'server/app.py')
app=importlib.util.module_from_spec(spec);spec.loader.exec_module(app)
PASSWORD='Test-only-password-2026'

def request(path,method='GET',body=None,cookie='',origin=None,headers=None):
    raw=body if isinstance(body,bytes) else json.dumps(body or {}).encode()
    env={'REQUEST_METHOD':method,'PATH_INFO':'/api/v1'+path,'CONTENT_LENGTH':str(len(raw)),'wsgi.input':io.BytesIO(raw),'HTTP_COOKIE':cookie,'HTTP_ORIGIN':origin or app.ORIGIN,'REMOTE_ADDR':'test'}
    env.update(headers or {})
    response={}
    def start(status,headers):response.update(status=int(status.split()[0]),headers=dict(headers))
    data=b''.join(app.application(env,start));response['raw']=data
    if response['headers'].get('Content-Type','').startswith('application/json'):response['data']=json.loads(data)
    return response

def archive(project='p1',group='g1',student='s1',role=None):
    data={'projects':[{'id':project,'name':'School','price':9900}], 'classes':[{'id':group,'projectId':project}], 'students':[{'id':student,'classId':group,'paymentStatus':'paid','paidAmount':500,'firstName':'Student'}], 'services':[{'id':'svc','price':500,'name':'Portrait'}], 'media':[{'id':'m1','studentId':student,'fileName':'a.jpg'}], 'finalWorks':[], 'documents':[{'id':'doc','projectId':project,'fileName':'bill.pdf'}], 'operators':[{'id':'owner','code':'secret-local-pin'}], 'settings':[{'id':'private','value':'secret'}]}
    data['orders']=[{'id':'order_'+student,'studentId':student,'items':[{'id':'task1','type':'portrait','status':'done' if role=='photographer' else 'pending','fileIds':['m1']}]}]
    out=io.BytesIO()
    with zipfile.ZipFile(out,'w') as z:
        z.writestr('manifest.json',json.dumps({'app':'Vakha Studio','exportType':'class'}));z.writestr('data.json',json.dumps(data));z.writestr('media/student_files/m1/a.jpg',b'photo');z.writestr('documents/doc/bill.pdf',b'private finance');z.writestr('unreferenced.txt','must not distribute')
    return out.getvalue()

class CloudTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with app.db() as c:
            for role in ('admin','manager','photographer','viewer'):
                c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(role,role,role,role,app.password_hash(PASSWORD)))
            c.executemany('INSERT INTO projects VALUES(?,?)',[('p1','School'),('p2','Other')])
            for role in ('manager','photographer','viewer'):c.execute('INSERT INTO memberships VALUES(?,?)',(role,'p1'))
        cls.cookies={}
        for role in ('admin','manager','photographer','viewer'):
            r=request('/login','POST',{'login':role,'password':PASSWORD});assert r['status']==200,r
            cls.cookies[role]=r['headers']['Set-Cookie'].split(';')[0]
    def upload(self,id,role='admin',project='p1',student='s1'):
        return request('/packages/'+id,'POST',archive(project=project,student=student,role=role),self.cookies[role],headers={'HTTP_X_PROJECT_ID':project,'HTTP_X_GROUP_ID':'g1','HTTP_X_PACKAGE_NAME':'Test'})
    def test_01_auth_and_csrf(self):
        self.assertEqual(request('/users')['status'],401)
        self.assertEqual(request('/users',cookie=self.cookies['photographer'])['status'],403)
        self.assertEqual(request('/projects','POST',{},self.cookies['admin'],origin='https://attacker.example')['status'],403)
        self.assertEqual(request('/projects','POST',{'id':'p3','name':'No'},self.cookies['manager'])['status'],403)
    def test_02_project_access_and_viewer(self):
        self.assertEqual(request('/projects/p2/packages',cookie=self.cookies['photographer'])['status'],403)
        self.assertEqual(self.upload('viewer-upload','viewer')['status'],403)
        self.assertEqual(self.upload('wrong-project','photographer','p2')['status'],403)
    def test_03_archive_media_finance_and_idempotency(self):
        r=self.upload('admin-package');self.assertEqual(r['status'],200,r)
        self.assertEqual(self.upload('admin-package')['data']['duplicate'],True)
        self.assertEqual(self.upload('admin-package','manager')['status'],409)
        response=request('/packages/admin-package',cookie=self.cookies['viewer'])
        self.assertEqual(response['status'],200)
        with zipfile.ZipFile(io.BytesIO(response['raw'])) as z:
            data=json.loads(z.read('data.json'))
            self.assertNotIn('price',data['projects'][0]);self.assertNotIn('price',data['services'][0]);self.assertNotIn('paidAmount',data['students'][0])
            self.assertEqual(data['students'][0]['paymentStatus'],'paid');self.assertEqual(data['operators'],[]);self.assertEqual(data['settings'],[])
            self.assertEqual(z.read('media/student_files/m1/a.jpg'),b'photo');self.assertNotIn('documents/doc/bill.pdf',z.namelist());self.assertNotIn('unreferenced.txt',z.namelist())
        private=request('/packages/admin-package',cookie=self.cookies['admin'])
        with zipfile.ZipFile(io.BytesIO(private['raw'])) as z:self.assertEqual(json.loads(z.read('data.json'))['services'][0]['price'],500)
    def test_04_photographer_contribution(self):
        self.assertEqual(self.upload('unknown-student','photographer',student='foreign')['status'],403)
        response=self.upload('photo-package','photographer');self.assertEqual(response['status'],200,response)
        raw=request('/packages/photo-package',cookie=self.cookies['admin'])['raw']
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            data=json.loads(z.read('data.json'));self.assertEqual(data['projects'],[]);self.assertEqual(data['services'],[]);self.assertEqual(data['orders'][0]['items'][0]['status'],'done');self.assertEqual(data['orders'][0]['items'][0]['fileIds'],['m1']);self.assertEqual(data['students'],[{'id':'s1','paymentStatus':'paid'}]);self.assertEqual(z.read('media/student_files/m1/a.jpg'),b'photo')
        self.assertEqual(request('/packages/photo-package',cookie=self.cookies['viewer'])['status'],403)
    def test_05_create_update_revoke(self):
        payload={'login':'new-worker','name':'Worker','role':'photographer','password':PASSWORD,'projects':['p1'],'active':True}
        r=request('/users','POST',payload,self.cookies['admin']);self.assertEqual(r['status'],200,r)
        uid=r['data']['id'];self.assertNotIn('password',r['data'])
        session=request('/login','POST',{'login':'new-worker','password':PASSWORD})['headers']['Set-Cookie'].split(';')[0]
        payload.update(id=uid,active=False,password='')
        self.assertEqual(request('/users','POST',payload,self.cookies['admin'])['status'],200)
        self.assertEqual(request('/me',cookie=session)['status'],401)
        self.assertEqual(request('/users','POST',{'id':'admin','login':'admin','name':'Admin','role':'viewer','active':True},self.cookies['admin'])['status'],400)
    def test_06_bad_zip_and_scope(self):
        headers={'HTTP_X_PROJECT_ID':'p1','HTTP_X_GROUP_ID':'other'}
        self.assertEqual(request('/packages/wrong-group','POST',archive(),self.cookies['admin'],headers=headers)['status'],403)
        self.assertEqual(request('/packages/not-zip','POST',b'garbage',self.cookies['admin'],headers={'HTTP_X_PROJECT_ID':'p1'})['status'],400)
    def test_07_password_hash_and_cookie(self):
        with app.db() as c:self.assertNotIn(PASSWORD,c.execute('SELECT password FROM users LIMIT 1').fetchone()[0])
        r=request('/login','POST',{'login':'admin','password':PASSWORD})
        for flag in ('HttpOnly','Secure','SameSite=Strict'):self.assertIn(flag,r['headers']['Set-Cookie'])
        for _ in range(8):request('/login','POST',{'login':'missing','password':PASSWORD})
        self.assertEqual(request('/login','POST',{'login':'missing','password':PASSWORD})['status'],429)

if __name__=='__main__':unittest.main()

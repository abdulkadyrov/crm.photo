"""First-party anonymous open counts. No IP, user agent, tokens or contact details stored."""
import hashlib,hmac,json,secrets
from datetime import datetime,timezone

def record(c,r,kind,group=None):
 c.execute('CREATE TABLE IF NOT EXISTS studio_visits(id INTEGER PRIMARY KEY,project_id TEXT,data TEXT)')
 c.execute('CREATE TABLE IF NOT EXISTS studio_visit_keys(source_key TEXT PRIMARY KEY,visit_id INTEGER UNIQUE)')
 c.execute('CREATE TABLE IF NOT EXISTS studio_analytics_secret(id INTEGER PRIMARY KEY,value TEXT)')
 c.execute('INSERT OR IGNORE INTO studio_analytics_secret VALUES(1,?)',(secrets.token_hex(32),))
 secret=c.execute('SELECT value FROM studio_analytics_secret WHERE id=1').fetchone()[0]
 now=datetime.now(timezone.utc).isoformat();day=now[:10]
 visitor=hmac.new(secret.encode(),(day+'|'+str(r.e.get('REMOTE_ADDR',''))+'|'+str(r.e.get('HTTP_USER_AGENT',''))[:500]).encode(),hashlib.sha256).hexdigest()
 scope=group['project_id'] if group else None;cid=group['id'] if group else None
 source=hashlib.sha256((kind+'|'+str(cid)+'|'+visitor).encode()).hexdigest()
 previous=c.execute('SELECT v.* FROM studio_visit_keys k JOIN studio_visits v ON v.id=k.visit_id WHERE k.source_key=?',(source,)).fetchone()
 if previous:
  value=json.loads(previous['data']);value.update(open_count=value['open_count']+1,last_seen_at=now);c.execute('UPDATE studio_visits SET data=? WHERE id=?',(json.dumps(value),previous['id']))
 else:
  value={'owner_id':'','source_key':source,'page_kind':kind,'school_id':scope,'class_id':cid,'visitor_hash':visitor,'open_count':1,'first_seen_at':now,'last_seen_at':now}
  if group:
   project=c.execute('SELECT name FROM projects WHERE id=?',(scope,)).fetchone();value.update(school={'name':project[0] if project else '','city':''},**{'class':{'name':group['name']}})
  rid=c.execute('INSERT INTO studio_visits(project_id,data) VALUES(?,?)',(scope,json.dumps(value))).lastrowid;c.execute('INSERT INTO studio_visit_keys VALUES(?,?)',(source,rid))

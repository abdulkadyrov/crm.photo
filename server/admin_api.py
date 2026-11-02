"""Administrator-only operational statistics. Never return session or password data."""
import time

def overview(c):
    since=time.time()-30*86400
    users=[]
    for u in c.execute('SELECT id FROM users'):
        uid=u['id']
        changes=c.execute('SELECT count(*) AS changes,max(at) AS last_sync FROM sync_changes WHERE actor=? AND at>=?',(uid,since)).fetchone()
        students=c.execute("SELECT count(DISTINCT id) FROM sync_changes WHERE actor=? AND at>=? AND store='students' AND data IS NOT NULL",(uid,since)).fetchone()[0]
        # Accepted records, not retries; timestamps are server receipt times.
        media=c.execute("SELECT count(DISTINCT store||':'||id) FROM sync_changes WHERE actor=? AND at>=? AND store IN ('media','albumMedia') AND data IS NOT NULL",(uid,since)).fetchone()[0]
        login=c.execute("SELECT max(at) FROM audit WHERE user_id=? AND action='login'",(uid,)).fetchone()[0]
        users.append({'id':uid,'changes':changes['changes'],'last_sync':changes['last_sync'],'students':students,'media':media,'last_login':login})
    recent=[dict(r) for r in c.execute('SELECT user_id,action,at FROM audit ORDER BY id DESC LIMIT 20')]
    return {'since':since,'users':users,'recent':recent}

"""Loopback-only integration fixture. Temporary data directory is supplied by the test."""
import os,sys,threading
from pathlib import Path
from socketserver import ThreadingMixIn
from wsgiref.simple_server import make_server,WSGIServer,WSGIRequestHandler
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'server'))
import app
class Server(ThreadingMixIn,WSGIServer):daemon_threads=True
class Quiet(WSGIRequestHandler):
 def log_message(self,*args):pass
with app.db() as c:
 for role in ('admin','photographer'):
  c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(role,role,role,role,app.password_hash('Integration-only-password')))
 c.execute('INSERT INTO projects VALUES(?,?)',('p','Test school'))
 c.execute('INSERT INTO memberships VALUES(?,?)',('photographer','p'))
server=make_server('127.0.0.1',0,app.application,server_class=Server,handler_class=Quiet)
print(server.server_port,flush=True)
server.serve_forever()

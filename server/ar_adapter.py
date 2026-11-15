"""AR v1 transport boundary; credentials and private assets stay on the server."""
import json, os
from urllib.parse import urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler

class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  raise RuntimeError("AR redirects are disabled")

class HttpARAdapter:
 def __init__(self, asset_url):
  self.endpoint=os.environ.get('CRM_AR_API_URL','').rstrip('/')
  self.token=os.environ.get('CRM_AR_API_TOKEN','')
  self.asset_url=asset_url
 def publish(self,payload,key):
  parsed=urlparse(self.endpoint)
  if parsed.scheme!='https' or parsed.hostname!='khanzama.ru' or not parsed.path.startswith('/ar.photo/') or not self.token:raise RuntimeError('AR adapter is not configured')
  body={**payload,'assets':{name:{**asset,'url':self.asset_url(payload['projectId'],asset['sha256'],asset['mime'])} for name,asset in payload['assets'].items()}}
  request=Request(self.endpoint+'/works',data=json.dumps(body).encode(),headers={'Content-Type':'application/json','Authorization':'Bearer '+self.token,'Idempotency-Key':key})
  with build_opener(NoRedirect()).open(request,timeout=120) as response:
   data=json.loads(response.read(1024*1024))
  # AR must reply only with a stable ready result. Pending jobs retry with the same key.
  if data.get('status')!='ready':raise RuntimeError('AR still processing')
  return data

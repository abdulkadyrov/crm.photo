"""Public catalog projection: published marketing fields only, never staff records."""
import json

FIELDS={'id','name','description','short_description','category','gender','type','price','preview_url','preview_video_url','parent_preview_mode','popular','is_active','sort_order'}

def payload(c,token=None):
 profile={}
 if c.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='studio_profiles'").fetchone():
  for row in c.execute("SELECT p.data FROM studio_profiles p JOIN users u ON u.id=p.actor WHERE u.active=1 AND u.role='admin' ORDER BY p.actor"):
   value=json.loads(row[0])
   if token is None or value.get('public_catalog_token')==token:
    profile=value;break
 if token is not None and not profile:return None
 catalog=[]
 for row in c.execute('SELECT id,data FROM parent_catalog ORDER BY id'):
  value=json.loads(row['data'])
  canonical=c.execute("SELECT data FROM sync_records WHERE store='catalog' AND id=? AND data IS NOT NULL",(row['id'],)).fetchone()
  if canonical:
   record=json.loads(canonical[0])
   if record.get('isActive') is False:continue
  if value.get('is_active') is False:continue
  catalog.append({key:value[key] for key in FIELDS if key in value})
 return {'company_name':profile.get('company_name') or 'Vakha Studio','watermark':{'text':profile.get('watermark_text',''),'image':profile.get('watermark_image',''),'opacity':profile.get('watermark_opacity',.2)},'whatsapp':{'phone':profile.get('whatsapp_phone',''),'company':profile.get('company_name',''),'manager':profile.get('manager_name','')},'catalog':catalog}

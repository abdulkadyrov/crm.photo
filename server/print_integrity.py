def replaces_finished_with_camera(current, incoming, camera):
 if not isinstance(current,dict) or not isinstance(incoming,dict):return False
 def digest(value):return value.get('$syncBlob') if isinstance(value,dict) else None
 original=current.get('originalFinalImage') or {}
 old=digest(original);new=digest(incoming.get('originalFinalImage'));source=digest(camera)
 return bool(original.get('mime')=='image/png' and old and source and old!=source and new==source)

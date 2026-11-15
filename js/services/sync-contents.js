const request=op=>new Promise((resolve,reject)=>{op.onsuccess=()=>resolve(op.result);op.onerror=()=>reject(op.error);});
// Count stored originals without reading their bytes or making network requests.
export async function localSyncContents(db){
 const names=['projects','classes','students','orders','media'].filter(name=>db.objectStoreNames.contains(name));
 const tx=db.transaction(names),values={projects:0,classes:0,students:0,orders:0,photos:0,videos:0};
 const jobs=names.filter(name=>name!=='media').map(async name=>{values[name]=await request(tx.objectStore(name).count());});
 if(names.includes('media'))jobs.push(new Promise((resolve,reject)=>{const cursor=tx.objectStore('media').openCursor();cursor.onerror=()=>reject(cursor.error);cursor.onsuccess=()=>{const row=cursor.result;if(!row){resolve();return;}const item=row.value;if(item.blob instanceof Blob&&item.blob.size>0){if(['photo','image'].includes(item.type))values.photos++;else if(item.type==='video')values.videos++;}row.continue();};}));
 await Promise.all(jobs);return values;
}
export function syncTransferText(activity={},running=false){
 if(running){
  if(activity.phase==='send')return `Отправка изменений: ${activity.sent||0} из ${activity.total||0}`;
  if(activity.phase==='structure')return `Списки школ: ${activity.scope||0} из ${activity.scopes||0}`;
  if(activity.phase==='receive')return `Получаем данные и файлы · раздел ${activity.scope||0} из ${activity.scopes||0}`;
  return 'Проверяем доступ и список проектов';
 }
 return activity.lastCheckedAt?'Последняя полная проверка: '+new Date(activity.lastCheckedAt).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Полная проверка на этом устройстве ещё не завершалась';
}

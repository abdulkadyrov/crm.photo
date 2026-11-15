const fileStores=new Set(['media','albumMedia','finalWorks','documents']);
export function syncPanelState({queue=[],online=true,running=false,status=''}){
 const conflicts=queue.filter(row=>row.conflict).length,errors=queue.filter(row=>row.error&&!row.conflict).length;
 const files=queue.filter(row=>fileStores.has(row.store)).length;
 const saved=status==='Всё сохранено на сервере'&&!queue.length;
 const login=/Нужен вход|Аккаунт или роль изменились/.test(status);
 let kind='checking',title='Проверяем соединение',server='Проверяем',detail='Данные на устройстве доступны для работы.';
 if(!online){kind='offline';title='Сохранено на устройстве';server='Нет интернета';detail=queue.length?'Отправим изменения, когда появится интернет.':'Последние данные доступны без интернета.';}
 else if(login){kind='attention';title='Нужно войти в аккаунт';server='Нужен вход';detail='Очередь сохранена на этом устройстве.';}
 else if(conflicts){kind='attention';title='Нужна проверка изменений';server='Нужно согласовать';detail='Откройте очередь и выберите подходящую версию.';}
 else if(running){kind='sending';title=queue.length?'Отправляем изменения':'Проверяем изменения';server=queue.length?'Отправляем':'Проверяем';detail='Можно продолжать работу в CRM.';}
 else if(errors){kind='attention';title='Не всё отправлено';server='Есть ошибки';detail='Данные на устройстве сохранены. Повторите отправку.';}
 else if(queue.length){kind='pending';title='Изменения в очереди';server='Ожидают отправки';detail='Можно продолжать работу в CRM.';}
 else if(/Получение данных отложено/.test(status)){kind='pending';title='Загрузка ещё не завершена';server='Ожидаем загрузку';detail='Завершите редактирование. CRM продолжит получать данные автоматически.';}
 else if(saved){kind='saved';title='Синхронизация завершена';server='Проверено';detail='Изменения отправлены. Доступные данные получены с сервера.';}
 else if(/Нет связи|Нужен вход|Ошибка|соединение/i.test(status)){kind='attention';title='Нет подтверждения сервера';server='Нет связи';detail=status;}
 const match=/Отправка (\d+) из (\d+)/.exec(status);
 return {kind,title,server,detail,pending:queue.length,conflicts,errors,files,cards:queue.length-files,retry:running?'Синхронизация…':queue.length?'Повторить отправку':'Проверить обновления',disabled:running||!online,progress:running&&match?{current:Number(match[1]),total:Number(match[2])}:null};
}

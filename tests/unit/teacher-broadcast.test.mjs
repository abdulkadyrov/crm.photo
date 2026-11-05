import test from 'node:test';
import assert from 'node:assert/strict';
import {teacherPhone,teacherMessage,teacherWhatsAppUrl} from '../../js/services/teacher-broadcast.js';
test('WhatsApp phone and text are normalized and encoded without sending',()=>{
 assert.equal(teacherPhone('8 (999) 123-45-67'),'79991234567');
 assert.equal(teacherPhone('9991234567'),'79991234567');
 assert.equal(teacherPhone('123'),'');
 const text=teacherMessage('{учитель}, {школа}, {класс}',{name:'Раяна',school:'Школа №1',className:'4 А'});
 const url=new URL(teacherWhatsAppUrl('+79991234567',text));
 assert.equal(url.searchParams.get('text'),'Раяна, Школа №1, 4 А');
 assert.equal(teacherWhatsAppUrl('123',text),'');
 assert.equal(teacherWhatsAppUrl('79991234567',' '),'');
});

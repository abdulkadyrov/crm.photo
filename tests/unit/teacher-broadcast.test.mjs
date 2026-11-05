import test from 'node:test';
import assert from 'node:assert/strict';
import {filterTeacherRecipients,teacherPhone,teacherMessage,teacherWhatsAppUrl} from '../../js/services/teacher-broadcast.js';
test('WhatsApp phone and text are normalized and encoded without sending',()=>{
 assert.equal(teacherPhone('8 (999) 123-45-67'),'79991234567');
 assert.equal(teacherPhone('9991234567'),'79991234567');
 assert.equal(teacherPhone('123'),'');
 const text=teacherMessage('{учитель}, {школа}, {класс}, {ссылка}',{name:'Раяна',school:'Школа №1',className:'4 А',catalogUrl:'https://example.test/p/class'});
 const url=new URL(teacherWhatsAppUrl('+79991234567',text));
 assert.equal(url.searchParams.get('text'),'Раяна, Школа №1, 4 А, https://example.test/p/class');
 assert.equal(teacherWhatsAppUrl('123',text),'');
 assert.equal(teacherWhatsAppUrl('79991234567',' '),'');
});
test('teacher list search finds teacher, school, class or phone',()=>{
 const recipients=[{id:'1',name:'Раяна',school:'Школа №1',className:'4 А',phone:'89991234567'},{id:'2',name:'Мадина',school:'Гимназия №12',className:'7 Б',phone:''}];
 assert.deepEqual(filterTeacherRecipients(recipients,'гимназия').map(item=>item.id),['2']);
 assert.deepEqual(filterTeacherRecipients(recipients,'4 а').map(item=>item.id),['1']);
 assert.deepEqual(filterTeacherRecipients(recipients,'999123').map(item=>item.id),['1']);
 assert.equal(filterTeacherRecipients(recipients,'нет').length,0);
});

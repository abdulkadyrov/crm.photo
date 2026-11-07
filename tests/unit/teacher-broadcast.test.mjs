import test from 'node:test';
import assert from 'node:assert/strict';
import {filterTeacherRecipients,sortTeacherRecipients,teacherPhone,teacherMessage,teacherRecipientSchools,teacherWhatsAppUrl} from '../../js/services/teacher-broadcast.js';
test('WhatsApp phone and text are normalized and encoded without sending',()=>{
 assert.equal(teacherPhone('8 (999) 123-45-67'),'79991234567');
 assert.equal(teacherPhone('9991234567'),'79991234567');
 assert.equal(teacherPhone('123'),'');
 const text=teacherMessage('{учитель}, {школа}, {класс}, {ссылка}',{name:'Раяна',school:'Школа №1',className:'4 А',catalogUrl:'https://example.test/p/class-4a'});
 const url=new URL(teacherWhatsAppUrl('+79991234567',text));
 assert.equal(url.searchParams.get('text'),'Раяна, Школа №1, 4 А, https://example.test/p/class-4a');
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
test('teacher recipients are grouped by school and classes use natural order',()=>{
 const recipients=[
  {id:'c10',schoolId:'p2',school:'Школа №2',className:'10 А'},
  {id:'c4',schoolId:'p1',school:'Школа №1',className:'4 Б'},
  {id:'c1',schoolId:'p1',school:'Школа №1',className:'1 А'},
  {id:'c3',schoolId:'p1',school:'Школа №1',className:'3 А'}
 ];
 assert.deepEqual(teacherRecipientSchools(recipients),[{id:'p1',name:'Школа №1'},{id:'p2',name:'Школа №2'}]);
 assert.deepEqual(sortTeacherRecipients(recipients).map(item=>item.id),['c1','c3','c4','c10']);
});

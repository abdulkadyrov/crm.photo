import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRoster,planRoster} from '../../js/services/class-roster.js';
const children=[{id:'a',lastName:'Алиев',firstName:'Али',qrId:'qr-a',paidAmount:350},{id:'b',lastName:'Магомадова',firstName:'Раяна'}];
test('roster accepts numbered pasted names and rejects incomplete names',()=>{
 assert.deepEqual(parseRoster('1. Алиев Али\r\n2) Магомадова Раяна\n'),['Алиев Али','Магомадова Раяна']);
 assert.throws(()=>parseRoster('Алиев'),/фамилию и имя/);
});
test('reordering and adding children retains exact existing card identities',()=>{
 const plan=planRoster(children,['Магомадова Раяна','Новый Ученик','Алиев Али']);
 assert.deepEqual(plan.rows.map(row=>row.student?.id),['b',undefined,'a']);
 assert.deepEqual(plan.removed,[]);
});
test('rename retains complete existing card and can be changed explicitly to new child',()=>{
 const plan=planRoster(children,['Алиев Абдулла','Магомадова Раяна']);
 assert.equal(plan.rows[0].student,children[0]);
 assert.equal(plan.rows[0].student.paidAmount,350);
 const replacement=planRoster(children,['Алиев Абдулла','Магомадова Раяна'],{0:''});
 assert.equal(replacement.rows[0].student,null);
 assert.deepEqual(replacement.removed,[children[0]]);
});
test('namesakes remain separate cards and blank roster explicitly lists all removals',()=>{
 const namesakes=[children[0],{...children[0],id:'c'}];
 assert.deepEqual(planRoster(namesakes,['Алиев Али','Алиев Али']).rows.map(row=>row.student.id),['a','c']);
 assert.deepEqual(planRoster(children,[]).removed,children);
 assert.throws(()=>planRoster(children,['Новый Один','Новый Два'],{0:'a',1:'a'}),/нескольких строк/);
});

test('class roster is independent of active payment and shooting filters',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
 const dialog=source.slice(source.indexOf('function showChildrenList('),source.indexOf('function showStudentForm('));
 assert.doesNotMatch(dialog,/studentsByClass\(classId\)/);
 assert.match(dialog,/state.data.students.filter\(student => student.classId === classId\)/);
});

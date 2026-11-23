import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const text=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
const body=text.slice(text.indexOf('function studentsForClassView(classId) {'),text.indexOf('\nfunction filteredStudents()'));
test('home search never hides children when opening or switching groups',()=>{
 const students=[{id:'a',classId:'first',firstName:'Аминат'},{id:'b',classId:'middle',firstName:'Байсангур'},{id:'c',classId:'middle',firstName:'Марьям'}];
 const state={query:'амин тасуханова',data:{students}};
 const roster=vm.runInNewContext(`(${body})`,{state});
 assert.deepEqual(Array.from(roster('middle'),x=>x.id),['b','c']);
 assert.deepEqual(Array.from(roster('first'),x=>x.id),['a']);
 assert.deepEqual(Array.from(roster('middle'),x=>x.id),['b','c']);
 assert.equal(state.query,'амин тасуханова','return to Home retains its original search');
 assert.deepEqual(Array.from(roster('missing')),[]);
});

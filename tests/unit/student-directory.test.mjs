import test from 'node:test';
import assert from 'node:assert/strict';
import {searchStudentDirectory,resetDirectoryScroll} from '../../js/services/student-directory.js';
const classes=[{id:'a',projectId:'p'},{id:'b',projectId:'p'},{id:'c',projectId:'other'}];
const students=[{id:1,classId:'a',firstName:'Артём',lastName:'Иванов'},{id:2,classId:'b',firstName:'Артём',lastName:'Петров'},{id:3,classId:'c',firstName:'Артём',lastName:'Иванов'}];
test('project search includes its groups and excludes other projects',()=>{
 assert.deepEqual(searchStudentDirectory(students,classes,{projectId:'p',query:'АРТЕМ'}).map(s=>s.id),[1,2]);
});
test('group search scopes names and accepts either word order',()=>{
 assert.deepEqual(searchStudentDirectory(students,classes,{projectId:'p',classId:'a',query:'артем иван'}).map(s=>s.id),[1]);
 assert.deepEqual(searchStudentDirectory(students,classes,{projectId:'p',classId:'a',query:'петров'}),[]);
 assert.deepEqual(searchStudentDirectory(students,classes,{projectId:'p',query:'   '}),[]);
});

import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
test('opening another group on the same route resets inherited scroll',()=>{
 const state={route:'classes',classId:'a'};let scroll=900;
 const navigate=vm.runInNewContext(`(${source.slice(source.indexOf('function navigate(route'),source.indexOf('\nfunction routeSnapshot'))})`,{
  state,cloudRequired:false,rosterStudentHistory:null,stopQrStream(){},document:{querySelectorAll:()=>[]},window:{get scrollY(){return scroll;}},
  render(){scroll=900;},resetDirectoryScroll(){scroll=0;}
 });
 navigate('classes',{classId:'b'});assert.equal(state.classId,'b');assert.equal(scroll,0);
});
test('Back restores the source group and filters but starts the screen at top',()=>{
 const target={route:'classes',projectId:'p',classId:'a',query:'Иван',filter:'todo',scrollY:900};
 let destination,scroll=500;
 const back=vm.runInNewContext(`(${source.slice(source.indexOf('function navigateBackFromStudent()'),source.indexOf('\nasync function detectQrFromVideo'))})`,{
  state:{returnTarget:target},rosterStudentHistory:null,
  navigate(route,params){destination={route,...params};},resetDirectoryScroll(){scroll=0;},view:{querySelector:()=>null}
 });
 back();assert.equal(destination.classId,'a');assert.equal(destination.query,'Иван');assert.equal(destination.filter,'todo');assert.equal(scroll,0);
});

test('moving to the next child keeps the group Back history and source snapshot',()=>{
 const target={route:'classes',projectId:'p',classId:'a'};
 const state={route:'student',studentId:'first',returnTarget:target};let forgotten=false;
 const navigate=vm.runInNewContext(`(${source.slice(source.indexOf('function navigate(route'),source.indexOf('\nfunction routeSnapshot'))})`,{
  state,cloudRequired:false,rosterStudentHistory:{forget(){forgotten=true;}},stopQrStream(){},document:{querySelectorAll:()=>[]},window:{scrollY:700},render(){},resetDirectoryScroll(){}
 });
 navigate('student',{studentId:'second'});
 assert.equal(state.studentId,'second');assert.equal(forgotten,false);assert.equal(state.returnTarget,target);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigationHistory} from '../../js/services/navigation-history.js';
function setup() {
 let state={}, listener, index=0, account='admin'; const entries=[null];
 const win={addEventListener:(name,fn)=>{listener=fn;},history:{get state(){return entries[index];},replaceState(value){entries[index]=structuredClone(value);},pushState(value){entries.splice(++index);entries[index]=structuredClone(value);},back(){if(index){index--;listener({state:entries[index]});}}}};
 const options={win,scope:()=>account,capture:()=>structuredClone(state),restore:value=>{state=structuredClone(value);}};
 let nav=createNavigationHistory(options);
 return {win,get nav(){return nav;},get state(){return state;},set state(value){state=value;},go(value,options){nav.transition(()=>{state=structuredClone(value);},options);},refresh(){nav=createNavigationHistory(options);return nav.resume();},account(value){account=value;}};
}
test('nested project/group/child Back restores each exact origin, filters, expanded rows and scroll',()=>{
 const h=setup(); h.go({route:'home',scrollY:0});
 const project={route:'home',query:'школа',scrollY:735,details:['project-menu']};h.state=project;
 h.go({route:'classes',projectId:'p',scrollY:0});
 const group={route:'classes',projectId:'p',scrollY:1304,sort:'manual'};h.state=group;
 h.go({route:'classes',projectId:'p',classId:'c',scrollY:0});
 const roster={route:'classes',classId:'c',filter:'todo',scrollY:2340,details:['child-order'],innerScroll:73};h.state=roster;
 h.go({route:'student',studentId:'s',scrollY:0});
 assert.equal(h.nav.back(),true);assert.deepEqual(h.state,roster);
 h.nav.back();assert.deepEqual(h.state,group);
 h.nav.back();assert.deepEqual(h.state,project);
 assert.equal(h.nav.back(),false);
});
test('next child replaces its entry and Back still returns to the roster',()=>{
 const h=setup();h.go({route:'classes',classId:'c',scrollY:900});
 h.go({route:'student',studentId:'first'});h.go({route:'student',studentId:'second'},{replace:true});
 h.nav.back();assert.equal(h.state.scrollY,900);assert.equal(h.state.route,'classes');
});
test('browser Back and refresh retain saved origin; modal pop does not rerender its parent',()=>{
 const h=setup();h.go({route:'home',scrollY:650});h.go({route:'classes',projectId:'p',scrollY:0});
 assert.equal(h.refresh(),true);assert.equal(h.state.projectId,'p');
 h.state.scrollY=920;
 h.win.history.pushState({...h.win.history.state,crmDialog:'viewer'},'');h.win.history.back();assert.equal(h.state.scrollY,920);
 h.win.history.back();assert.equal(h.state.scrollY,650);
});
test('direct entry and another account have no unsafe browser Back origin',()=>{
 const h=setup();h.go({route:'student',studentId:'direct'});assert.equal(h.nav.back(),false);
 h.go({route:'classes'});h.account('other');assert.equal(h.nav.back(),false);assert.equal(h.refresh(),false);
});

import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
test('real navigate and visible Back handlers restore the project/group/child origin instead of resetting it',()=>{
 let listener,index=0;const entries=[null];let y=0;
 const win={get scrollY(){return y;},addEventListener:(name,fn)=>listener=fn,history:{get state(){return entries[index];},replaceState(v){entries[index]=v;},pushState(v){entries.splice(++index);entries[index]=v;},back(){index--;listener({state:entries[index]});}}};
 const state={route:'home',projectId:null,classId:null,query:'',filter:'all'};
 const context=vm.createContext({state,window:win,cloudRequired:false,rosterStudentHistory:null,cancelRouteScrollRestore(){},stopQrStream(){},rememberSelectedCard(){},addContextBackButton(){},document:{querySelectorAll:()=>[]},render(){y=0;},resetDirectoryScroll(){y=0;},routeSnapshot:()=>({...state,scrollY:y}),navigateBackFromStudent(){throw Error('history bypassed');}});
 const nav=createNavigationHistory({win,scope:()=> 'admin',capture:context.routeSnapshot,restore:snapshot=>{Object.assign(state,snapshot);y=snapshot.scrollY;}});context.navigationHistory=nav;
 vm.runInContext(source.slice(source.indexOf('function navigate(route'),source.indexOf('\nfunction routeSnapshot')),context);
 vm.runInContext(source.slice(source.indexOf('function navigateContextBack()'),source.indexOf('\nfunction setShell')),context);
 context.navigate('home');y=620;state.query='школа';context.navigate('classes',{projectId:'p',classId:null});
 y=1180;context.navigate('classes',{classId:'c'});y=2540;context.navigate('student',{studentId:'s'});
 context.navigateContextBack();assert.equal(y,2540);assert.equal(state.classId,'c');assert.equal(state.route,'classes');
 context.navigateContextBack();assert.equal(y,1180);assert.equal(state.classId,null);
 context.navigateContextBack();assert.equal(y,620);assert.equal(state.route,'home');assert.equal(state.query,'школа');
});

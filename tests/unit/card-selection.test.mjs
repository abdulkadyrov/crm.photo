import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createCardSelection,paintCardSelection,bindCardSelection} from '../../js/services/card-selection.js';
function memoryStorage(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};}
test('last card survives reload, remembers each parent separately, and isolates accounts',()=>{
 const storage=memoryStorage();let account='one';const make=()=>createCardSelection({storage:()=>storage,account:()=>account});const tracker=make();
 tracker.remember('project','p');tracker.remember('group','c1','p');tracker.remember('student','s1','c1');tracker.remember('student','s2','c1');tracker.remember('student','s3','c2');
 assert.equal(make().snapshot()['student:c1'],'s2');assert.equal(make().snapshot()['student:c2'],'s3');account='two';assert.deepEqual(tracker.snapshot(),{});account='one';assert.equal(tracker.snapshot()['project:'],'p');
});
test('unavailable or malformed browser storage never blocks selecting a card',()=>{
 const tracker=createCardSelection({storage:()=>{throw new Error('SecurityError');}});tracker.remember('project','p');assert.equal(tracker.snapshot()['project:'],'p');
 const store=memoryStorage();store.setItem('spf-last-card:local','broken JSON');const malformed=createCardSelection({storage:()=>store});malformed.remember('project','safe');assert.equal(malformed.snapshot()['project:'],'safe');
});
function card(dataset){const attrs=new Map(),classes=new Set(['card-button','has-selected-services']),events={};return {dataset,attrs,classes,events,classList:{toggle(name,on){on?classes.add(name):classes.delete(name);}},setAttribute:(k,v)=>attrs.set(k,v),getAttribute:k=>attrs.get(k),removeAttribute:k=>attrs.delete(k),addEventListener:(type,fn)=>events[type]=fn};}
test('menu/action clicks move the outline without changing status colors or navigation state',()=>{
 const tracker=createCardSelection({storage:()=>memoryStorage()}),a=card({openStudent:'s1'}),b=card({openStudent:'s2'}),root={querySelectorAll:()=>[a,b]},lookup={student:id=>({id,classId:'c'}),group:id=>({id,projectId:'p'})};
 bindCardSelection(root,tracker,lookup);a.events.click();assert.ok(a.classes.has('is-last-selected'));b.events.click();assert.equal(a.classes.has('is-last-selected'),false);assert.ok(b.classes.has('is-last-selected'));assert.ok(b.classes.has('has-selected-services'));assert.equal(b.attrs.get('aria-current'),undefined);assert.equal(tracker.snapshot()['student:c'],'s2');
});
test('student next/back keeps the latest outline and preserves the existing return snapshot',()=>{
 const source=readFileSync(process.env.CARD_SELECTION_SOURCE||new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
 const tracker=createCardSelection({storage:()=>memoryStorage()}),target={route:'classes',projectId:'p',classId:'c',query:'Ханифа',filter:'todo',scrollY:640};
 const state={route:'classes',projectId:'p',classId:'c',query:target.query,filter:target.filter};
 const context=vm.createContext({state,lastCardSelection:tracker,studentById:id=>({id,classId:'c'}),classById:id=>({id,projectId:'p'}),cloudRequired:false,rosterStudentHistory:null,stopQrStream(){},routeSnapshot:()=>target,document:{querySelectorAll:()=>[]},window:{scrollY:640},render(){},resetDirectoryScroll(){}});
 const start=source.indexOf('function rememberSelectedCard('),end=source.indexOf('\nfunction routeSnapshot(',start);vm.runInContext(source.slice(start,end),context);
 context.navigate('student',{studentId:'first'});context.navigate('student',{studentId:'second'});assert.equal(state.returnTarget,target);context.navigate('classes',target);
 assert.equal(tracker.snapshot()['student:c'],'second');assert.equal(tracker.snapshot()['group:p'],'c');assert.equal(tracker.snapshot()['project:'],'p');assert.equal(state.query,'Ханифа');assert.equal(state.filter,'todo');
});

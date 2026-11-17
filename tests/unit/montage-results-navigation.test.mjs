import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
test('opening a result preserves the montage and its triggering control',()=>{
 const start=source.indexOf("  panel.querySelectorAll('[data-montage-result-open]')");
 const end=source.indexOf("  panel.querySelectorAll('[data-montage-result-delete]')",start);
 let click;let connected=true;let opened;
 const button={dataset:{montageResultOpen:'result-1'},addEventListener:(_,callback)=>{click=callback;}};
 const panel={querySelectorAll:()=>[button]};
 vm.runInNewContext(source.slice(start,end),{panel,close:()=>{connected=false;},showFinalWorkViewer:(id,options)=>{opened={id,options};}});
 click();
 assert.equal(connected,true,'the montage must remain mounted behind the preview');
 assert.equal(opened.id,'result-1');assert.equal(opened.options.trigger,button);
});
test('delete first asks inline, cancel keeps the result, and confirm runs once',async()=>{
 const start=source.indexOf("  panel.querySelectorAll('[data-montage-result-delete]')");
 const end=source.indexOf("  panel.querySelectorAll('[data-montage-result-save]')",start);
 const confirmation={hidden:true};const events={};let deleted=0;
 const row={querySelector:()=>confirmation};
 const makeButton=(name,extra={})=>({disabled:false,addEventListener:(_,fn)=>{events[name]=fn;},...extra});
 const ask=makeButton('ask',{closest:()=>row});
 const cancel=makeButton('cancel',{closest:()=>confirmation});
 const confirm=makeButton('confirm',{dataset:{resultConfirmDelete:'result-1'}});
 const panel={querySelectorAll:selector=>({
  '[data-montage-result-delete]':[ask],
  '[data-result-cancel-delete]':[cancel],
  '[data-result-confirm-delete]':[confirm]
 })[selector]};
 let finish;const pending=new Promise(resolve=>{finish=resolve;});
 vm.runInNewContext(source.slice(start,end),{panel,deleteFinalWork:async()=>{deleted++;await pending;},close:()=>{},showMontagePanel:()=>{},student:{id:'child'},service:{id:'service'},source:{id:'photo'},notify:()=>{}});
 events.ask();assert.equal(confirmation.hidden,false);assert.equal(deleted,0);
 events.cancel();assert.equal(confirmation.hidden,true);assert.equal(deleted,0);
 events.ask();const first=events.confirm();const second=events.confirm();
 assert.equal(deleted,1);finish();await Promise.all([first,second]);
});

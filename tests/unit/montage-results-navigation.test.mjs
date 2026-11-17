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

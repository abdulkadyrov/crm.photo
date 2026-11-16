import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(process.env.PRINT_PREVIEW_SOURCE || new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
const begin=source.indexOf('function finalWorkSelectedPrintPages(');
const end=source.indexOf('function showFinalWorkPrintPreview(',begin);
const context=vm.createContext({Blob,studentById:id=>({id}),studentServiceQuantity:(student)=>student.id==='two'?2:1,finalWorkTitle:work=>work.title,escapeAttr:s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')});
vm.runInContext(source.slice(begin,end),context);
test('preview/PDF use only checked finished A4 images and repeat ordered copies',()=>{
 const originals=new Blob(['raw original']);const coded=new Blob(['finished full A4 with code']);
 const works=[{id:'a',studentId:'two',title:'A',image:originals},{id:'b',studentId:'one',title:'B'}];
 const assets=new Map([['a',{jpgBlob:coded,orientation:'vertical'}],['b',{jpgBlob:new Blob(['not selected'])}]]);
 const pages=context.finalWorkSelectedPrintPages(works,assets,new Set(['a']));
 assert.equal(pages.length,2);assert.ok(pages.every(p=>p.assets.jpgBlob===coded));assert.ok(pages.every(p=>p.work.id==='a'));
 assert.equal(context.finalWorkSelectedPrintPages(works,assets,new Set()).length,0);
});
test('missing selected output fails without substituting an original or other work',()=>{
 assert.throws(()=>context.finalWorkSelectedPrintPages([{id:'a',studentId:'one',title:'A'}],new Map(),new Set(['a'])),/Не удалось создать A4/);
});
test('preview page has only coded bitmaps with edge-to-edge A4 and mixed orientations',()=>{
 const html=context.finalWorkPrintPreviewHtml([{url:'blob:coded',title:'A < B',orientation:'vertical'},{url:'blob:horizontal',title:'C',orientation:'horizontal'}]);
 assert.equal((html.match(/<img /g)||[]).length,2);assert.match(html,/@page portrait \{ size: A4 portrait; margin: 0;/);assert.match(html,/@page landscape \{ size: A4 landscape; margin: 0;/);
 assert.match(html,/width: 210mm; height: 297mm; margin: 0/);assert.match(html,/width: 297mm; height: 210mm/);assert.match(html,/A &lt; B/);assert.doesNotMatch(html,/<header|<figcaption|sourceMedia/);
});
test('both actions share selection and previews wait for images before printing',()=>{
 const review=source.slice(source.indexOf('async function reviewFinalWorksForPrint('),begin);
 assert.match(review,/preview\.disabled = busy \|\| !inputs.some/);assert.match(review,/showFinalWorkPrintPreview\(selectedPages\(\), scope.name\)/);assert.match(review,/const selected = selectedPages\(\)/);
 const preview=source.slice(end,source.indexOf('function finalWorkPrintPageHtml(',end));
 assert.match(preview,/print.disabled = true/);assert.match(preview,/image.decode\(\)/);assert.match(preview,/URL.revokeObjectURL/);
});

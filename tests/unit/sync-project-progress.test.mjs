import {test} from 'node:test';import assert from 'node:assert/strict';import {transferTotals,projectProgressHTML} from '../../js/services/sync-project-progress.js';
test('byte progress uses unique verified files and group rosters, not metadata-only photos',()=>{
 const snapshot={scope:'p',name:'School',files:[{id:'a',bytes:100,ready:true},{id:'b',bytes:300,ready:false}],groups:[{id:'g',name:'1A'},{id:'empty',name:'Empty'}],students:[{id:'s',classId:'g'},{id:'t',classId:'g'}],media:[{id:'m',studentId:'s',type:'photo',files:['a']},{id:'n',studentId:'t',type:'photo',files:['b']}],records:[{id:'m',studentId:'s',files:['a','a']},{id:'n',studentId:'t',files:['b']}]};
 const local={files:new Map([['a',100],['b',299]]),records:new Set(['media:m','media:n']),projects:new Set(['p']),groups:new Set(['g']),students:new Set(['s']),pending:new Map([['p',2]])};
 const v=transferTotals(snapshot,local);assert.equal(v.totalBytes,400);assert.equal(v.localBytes,100);assert.equal(v.serverBytes,100);assert.equal(v.localPhotos,1);assert.equal(v.localStudents,1);assert.equal(v.groups[0].localBytes,100);assert.equal(v.groups[0].bytes,400);assert.equal(v.groups[1].bytes,0);
 const html=projectProgressHTML(snapshot,local);assert.match(html,/25%/);assert.match(html,/Учащиеся: 1 \/ 2/);assert.match(html,/Локальных изменений в очереди: 2/);assert.match(html,/Нет файлов/);
});

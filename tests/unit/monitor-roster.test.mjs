import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMonitor,estimateMonitorSkew,monitorLineBands} from '../../js/services/monitor-image.js';
import {monitorLineText,assembleMonitorRows} from '../../js/services/monitor-roster.js';
const line=(text,top,alternates=[])=>({top,bottom:top+30,variants:[{text,confidence:80},...alternates.map(text=>({text,confidence:80}))]});
test('monitor parser ignores UI icons and keeps compound names',()=>{
 assert.deepEqual(monitorLineText('| 12° Алиев Сайд-Ахмад «7'),{words:['Алиев','Сайд-Ахмад'],number:12});
 assert.deepEqual(monitorLineText('1 ФВашаев Якуб'),{words:['Якуб'],number:1});
});
test('monitor parser recovers spaces from another rendering, without inventing letters',()=>{
 assert.equal(assembleMonitorRows([line('2 АлиевАли',0,['2 Алиев Али'])],'a')[0].name,'Алиев Али');
});
test('monitor parser joins wrapped names only on close neighbouring lines',()=>{
 const rows=assembleMonitorRows([line('7 Алиева',0),line('Амина',35)],'a');
 assert.deepEqual(rows.map(row=>[row.name,row.number]),[['Алиева Амина',7]]);
 assert.equal(assembleMonitorRows([line('Алиева',0),line('Амина',200)],'a').length,0);
});
test('number recovery requires a strong existing sequence and never supplies missing names',()=>{
 const rows=assembleMonitorRows([line('Алиев Али',0),line('2 Иванов Иван',40),line('3 Петров Пётр',80),line('4 Сидоров Сидор',120)],'a');
 assert.deepEqual(rows.map(row=>row.number),[1,2,3,4]);assert.equal(rows[0].numberInferred,true);
 const short=assembleMonitorRows([line('Алиев Али',0),line('2 Иванов Иван',40)],'a');
 assert.equal(short[0].number,null);
});
test('flat monitor background becomes light without inventing foreground',()=>{
 const image=new Uint8Array(100*80).fill(130),normalized=normalizeMonitor(image,100,80);
 assert(normalized.every(value=>value===235));assert.deepEqual(monitorLineBands(normalized,100,80),[]);
});
test('deskew estimates the visible line angle, not a photograph-specific constant',()=>{
 const width=300,height=240,gray=new Uint8Array(width*height).fill(255),degrees=4;
 for(let x=10;x<width-10;x++)for(const base of [50,100,150,200])for(let t=0;t<3;t++){
  const y=Math.round(base-x*Math.tan(degrees*Math.PI/180))+t;gray[y*width+x]=0;
 }
 assert(Math.abs(estimateMonitorSkew(gray,width,height)-degrees)<=.5);
});
test('unsupported toolbar words cannot form a fake student',()=>{
 const rows=assembleMonitorRows([
  {top:0,bottom:25,variants:[{text:'Текст',confidence:3},{text:'Слово',confidence:23}]},
  {top:35,bottom:60,variants:[{text:'—',confidence:17},{text:'Рь',confidence:41}]}
 ],'a');
 assert.equal(rows.length,0);
});
test('a stray digit in a failed variant cannot split a wrapped name',()=>{
 const rows=assembleMonitorRows([line('Алиев',0),line('Али',35,['1 о али'])],'a');
 assert.equal(rows[0].name,'Алиев Али');assert.equal(rows[0].number,null);
});
test('real missing row numbers are not rewritten into a complete-looking list',()=>{
 const rows=assembleMonitorRows([1,2,4,5,6].map((n,i)=>line(`${n} Алиев Али`,i*50)),'a');
 assert.deepEqual(rows.map(row=>row.number),[1,2,4,5,6]);
});
test('a blank image has no invented deskew angle',()=>{
 assert.equal(estimateMonitorSkew(new Uint8Array(100*80).fill(255),100,80),0);
});

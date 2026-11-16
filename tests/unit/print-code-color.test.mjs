import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {printCodeLayout} from '../../js/services/print-code-layout.js';
const source=readFileSync(process.env.PRINT_COLOR_SOURCE || new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
function fn(name,next){const start=source.indexOf(`function ${name}(`);return source.slice(start,source.indexOf(`\n${next}`,start));}
const settingsFn=fn('finalWorkPrintSettings','function printSettingsFromView(');
const clampNumber=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
test('saved color survives settings normalization; old/invalid settings keep black',()=>{
 for(const [saved,expected] of [[{},'#000000'],[{codeColor:'#ffffff'},'#ffffff'],[{codeColor:'#12abEF'},'#12abEF'],[{codeColor:'url(evil)'},'#000000']]){
  const c=vm.createContext({state:{data:{settings:[{id:'print',codeLayoutVersion:2,...saved}]}},SETTING_IDS:{finalWorkPrint:'print'},clampNumber});vm.runInContext(settingsFn,c);assert.equal(c.finalWorkPrintSettings().codeColor,expected);
 }
});
test('save action persists the chosen color through the normal settings store',async()=>{
 let stored;const c=vm.createContext({printSettingsFromView:()=>({id:'print',codeColor:'#ffffff'}),withBusy:async(_,action)=>action(),put:async(store,record)=>stored={store,record},refreshData:async()=>{},rebuildStoredFinalWorkPrintImages:async()=>({rebuilt:0,skipped:0}),state:{data:{finalWorks:[]}},notify(){},showSettingsDetail(){}});
 vm.runInContext('async '+fn('saveFinalPrintSettingsFromView','const FINAL_WORK_PRINT_QR_PREFIX'),c);await c.saveFinalPrintSettingsFromView();assert.equal(stored.store,'settings');assert.equal(stored.record.codeColor,'#ffffff');
});
test('both Code128 and QR receive the selected ink color with no backing',async()=>{
 let barcode,qr;const c=vm.createContext({Blob,printCodeLayout,document:{createElement:()=>({})},window:{JsBarcode:(_,payload,options)=>barcode=options},finalWorkQrOverlayImage:async(...args)=>{qr=args;return {};}});
 vm.runInContext('async '+fn('drawFinalWorkCodeOverlay','async function createPdfBlobFromJpeg('),c);
 let fills=0;const ctx={save(){},restore(){},drawImage(){},fillRect(){fills++;}};const settings={qrEnabled:true,codeBackground:'transparent',codeColor:'#ffffff'};
 await c.drawFinalWorkCodeOverlay(ctx,2480,3508,'student_abc',null,{...settings,codeType:'barcode'});assert.equal(barcode.lineColor,'#ffffff');assert.equal(barcode.background,'transparent');
 await c.drawFinalWorkCodeOverlay(ctx,2480,3508,'student_abc',null,{...settings,codeType:'qr'});assert.equal(qr[2],false);assert.equal(qr[3],'#ffffff');assert.equal(fills,0);
});
test('QR SVG colors only its modules and validates color input',()=>{
 const c=vm.createContext({createQrModules:()=>[[true,false],[false,true]]});vm.runInContext(fn('createQrSvg','function createQrModules('),c);
 const white=c.createQrSvg('child',8,false,'#ffffff');assert.match(white,/<g fill="#ffffff">/);assert.doesNotMatch(white,/<rect width="100%"/);assert.equal((white.match(/width="1"/g)||[]).length,2);
 assert.match(c.createQrSvg('child',8,false,'\" onload=evil'),/<g fill="#000000">/);
});
test('imported QR recoloring preserves module mask and transparency including antialiasing',()=>{
 const c=vm.createContext({});vm.runInContext(fn('recolorPrintCodePixels','async function finalWorkQrOverlayImage('),c);
 const data=new Uint8ClampedArray([0,0,0,255,255,255,255,255,128,128,128,255,0,0,0,0]);c.recolorPrintCodePixels(data,'#ffffff');assert.deepEqual([...data],[255,255,255,255,255,255,255,0,255,255,255,127,255,255,255,0]);
});
test('real QR module pattern remains scannable in black-on-light and white-on-dark palettes',()=>{
 const c=vm.createContext({TextEncoder});vm.runInContext(source.slice(source.indexOf('function createQrModules('),source.indexOf('\nfunction safeFileName(')),c);
 const decoder=vm.createContext({module:{exports:{}},exports:{},Uint8ClampedArray,Uint8Array,Int32Array});vm.runInContext(readFileSync(new URL('../../vendor/jsQR.js',import.meta.url),'utf8'),decoder);
 const payload='student_00000000-0000-4000-8000-000000000001';const modules=c.createQrModules(payload);const quiet=4,scale=8,size=(modules.length+quiet*2)*scale;
 for(const [ink,paper] of [[0,255],[255,0]]){
  const data=new Uint8ClampedArray(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const cell=modules[Math.floor(y/scale)-quiet]?.[Math.floor(x/scale)-quiet];const v=cell?ink:paper;const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;
  }
  assert.equal(decoder.module.exports(data,size,size,{inversionAttempts:'attemptBoth'})?.data,payload);
 }
});

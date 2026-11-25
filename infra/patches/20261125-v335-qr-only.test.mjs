import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {printCodeLayout} from '../../js/services/print-code-layout.js';
const source=readFileSync(process.env.QR_ONLY_SOURCE || new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
const part=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
test('saved barcode preference migrates to QR without re-enabling disabled printing',()=>{
 const saved={id:'print',codeType:'barcode',codeLayoutVersion:2,qrEnabled:false,qrPixelSize:130};
 const context=vm.createContext({state:{data:{settings:[saved]}},SETTING_IDS:{finalWorkPrint:'print'},clampNumber:(x,min,max,f)=>Number.isFinite(Number(x))?Math.min(max,Math.max(min,Number(x))):f});
 vm.runInContext(part('function finalWorkPrintSettings()', '\nfunction printSettingsFromView'),context);
 const settings=context.finalWorkPrintSettings();assert.equal(settings.codeType,'qr');assert.equal(settings.qrEnabled,false);assert.equal(settings.qrPixelSize,130);
});
test('A4 renders square QR even with a stale barcode setting',async()=>{
 const draws=[];let payload;
 const context=vm.createContext({Blob,printCodeLayout,finalWorkQrOverlayImage:async p=>{payload=p;return {}},window:{JsBarcode(){throw Error('barcode encoder called')}}});
 vm.runInContext(part('async function drawFinalWorkCodeOverlay(', '\nasync function createPdfBlobFromJpeg'),context);
 const ctx={save(){},restore(){},fillRect(){},drawImage(...args){draws.push(args)}};
 await context.drawFinalWorkCodeOverlay(ctx,2480,3508,'student-test',null,{qrEnabled:true,codeType:'barcode',qrPixelSize:130});
 assert.equal(payload,'student-test');assert.equal(draws[0].at(-2),130);assert.equal(draws[0].at(-1),130);
});
test('card code panel and print settings offer no barcode switch or encoder',()=>{
 const panel=part('function showQrPanel(', '\nfunction studentQrPayload');
 assert.match(panel,/createQrSvg\(value, 7\)/);assert.doesNotMatch(panel,/barcode|JsBarcode/);
 assert.doesNotMatch(source,/data-final-print-code-type|data-final-print-barcode-width|data-final-print-barcode-height|window\.JsBarcode/);
});

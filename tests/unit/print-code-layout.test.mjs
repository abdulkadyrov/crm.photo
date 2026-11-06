import test from 'node:test';
import assert from 'node:assert/strict';
import {printCodeLayout} from '../../js/services/print-code-layout.js';
import {withPortraitIdentityPolicy, PORTRAIT_IDENTITY_POLICY} from '../../js/services/portrait-identity-policy.js';
test('QR and barcode layout applies exact size, corner, margin and opacity within A4', () => {
  for (const codeType of ['qr','barcode']) for (const qrPosition of ['top-left','top-right','bottom-left','bottom-right']) {
    const l=printCodeLayout(2480,3508,{codeType,qrPosition,qrPixelSize:200,qrMargin:'20px',codeOpacity:0.45});
    assert.equal(l.codeWidth,codeType==='qr'?200:800);
    assert.equal(l.codeHeight,200);
    assert.equal(l.opacity,0.45);
    assert.equal(qrPosition.endsWith('left')?l.x:l.x+l.boxWidth,qrPosition.endsWith('left')?20:2460);
    assert.equal(qrPosition.startsWith('top')?l.y:l.y+l.boxHeight,qrPosition.startsWith('top')?20:3488);
  }
});
test('tiny legacy code settings are upgraded to a scannable print size',()=>{
  const qr=printCodeLayout(2480,3508,{codeType:'qr',qrPixelSize:48,qrMargin:10});
  const barcode=printCodeLayout(2480,3508,{codeType:'barcode',qrPixelSize:72,qrMargin:10});
  assert.equal(qr.codeWidth,160);
  assert.equal(qr.codeHeight,160);
  assert.equal(barcode.codeWidth,640);
  assert.equal(barcode.codeHeight,160);
});
test('maximum barcode stays inside A4 even with large margins',()=>{
  const l=printCodeLayout(2480,3508,{codeType:'barcode',qrPixelSize:600,qrMargin:300});
  assert(l.x>=300); assert(l.x+l.boxWidth<=2180); assert(l.codeWidth>0);
});
test('copied portrait instructions always carry the exact-face policy once',()=>{
  const p=withPortraitIdentityPolicy('Рыцарь у замка');
  assert(p.startsWith(PORTRAIT_IDENTITY_POLICY));
  assert.equal(withPortraitIdentityPolicy(p),p);
  assert.equal(withPortraitIdentityPolicy(''),'');
});

test('the shared live/print renderer applies opacity and generates a real Code128 symbol', async()=>{
  const {readFileSync}=await import('node:fs');
  const vm=await import('node:vm');
  const src=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
  const fn=src.slice(src.indexOf('async function drawFinalWorkCodeOverlay('),src.indexOf('\nasync function createPdfBlobFromJpeg'));
  const calls=[]; let encoded;
  const code={}; const ctx={save(){},restore(){},fillRect(...a){calls.push(['box',...a])},drawImage(...a){calls.push(['code',this.globalAlpha,...a])}};
  const sandbox=vm.createContext({Blob, printCodeLayout,document:{createElement:()=>code},window:{JsBarcode:(canvas,payload,options)=>encoded={payload,options}}});
  vm.runInContext(fn,sandbox);
  await sandbox.drawFinalWorkCodeOverlay(ctx,2480,3508,'student_abc',null,{qrEnabled:true,codeType:'barcode',qrPixelSize:200,qrMargin:10,codeOpacity:0.6});
  assert.equal(encoded.payload,'student_abc'); assert.equal(encoded.options.format,'CODE128');
  assert.equal(calls[1][1],0.6); assert.equal(calls[1].at(-2),800);assert.equal(calls[1].at(-1),200);
});

test('transparent print mode omits the backing rectangle and requests transparent barcode pixels', async()=>{
  const {readFileSync}=await import('node:fs'); const vm=await import('node:vm');
  const src=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
  const fn=src.slice(src.indexOf('async function drawFinalWorkCodeOverlay('),src.indexOf('\nasync function createPdfBlobFromJpeg'));
  let fills=0, barcodeOptions, qrBackground;
  const sandbox=vm.createContext({Blob,printCodeLayout,document:{createElement:()=>({})},window:{JsBarcode:(c,p,options)=>barcodeOptions=options},finalWorkQrOverlayImage:async(p,f,background)=>{qrBackground=background;return {}}});
  vm.runInContext(fn,sandbox);
  const ctx={save(){},restore(){},fillRect(){fills++},drawImage(){}};
  const settings={qrEnabled:true,codeBackground:'transparent',codeType:'barcode',qrPixelSize:200};
  await sandbox.drawFinalWorkCodeOverlay(ctx,2480,3508,'student_abc',null,settings);
  assert.equal(fills,0); assert.equal(barcodeOptions.background,'transparent');
  await sandbox.drawFinalWorkCodeOverlay(ctx,2480,3508,'student_abc',null,{...settings,codeType:'qr'});
  assert.equal(fills,0); assert.equal(qrBackground,false);
});
test('transparent QR SVG omits white modules and quiet-zone backing',async()=>{
  const {readFileSync}=await import('node:fs'); const vm=await import('node:vm');
  const src=readFileSync(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
  const fn=src.slice(src.indexOf('function createQrSvg('),src.indexOf('\nfunction createQrModules('));
  const sandbox=vm.createContext({createQrModules:()=>[[true,false],[false,true]]});vm.runInContext(fn,sandbox);
  assert(!sandbox.createQrSvg('test',6,false).includes('fill="#fff"'));
  assert(sandbox.createQrSvg('test',6,true).includes('fill="#fff"'));
});

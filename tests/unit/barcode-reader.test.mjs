import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {decodeCode128ImageData} from '../../js/services/barcode-reader.js';
const encoderContext=vm.createContext({window:{}});
vm.runInContext(readFileSync(new URL('../../vendor/JsBarcode.code128.min.js',import.meta.url),'utf8'),encoderContext);
const decoderContext=vm.createContext({module:{exports:{}},exports:{},TextDecoder,TextEncoder,BigInt,global:{BigInt},Uint8ClampedArray,Int32Array,Uint8Array,Map});
vm.runInContext(readFileSync(new URL('../../vendor/zxing.min.js',import.meta.url),'utf8'),decoderContext);
const ZXing=decoderContext.exports;
test('fallback decodes actual printed Code128 student IDs without native BarcodeDetector',()=>{
 const payload='student_00000000-0000-4000-8000-000000000001';
 const target={};encoderContext.window.JsBarcode(target,payload,{format:'CODE128'});
 const bits=target.encodings.map(e=>e.data).join('');
 const width=bits.length*3+60,height=100;
 const data=new Uint8ClampedArray(width*height*4).fill(255);
 for(let y=10;y<90;y++)for(let x=0;x<bits.length*3;x++)if(bits[Math.floor(x/3)]==='1'){
  const i=(y*width+x+30)*4;data[i]=data[i+1]=data[i+2]=0;
 }
 assert.equal(decodeCode128ImageData({data,width,height},ZXing),payload);
 assert.equal(decodeCode128ImageData({data:new Uint8ClampedArray(100*100*4).fill(255),width:100,height:100},ZXing),'');
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
test('class QR decodes to the complete parent capability URL',async()=>{
 const source=await fs.readFile(new URL('../../js/core/legacy-app.js',import.meta.url),'utf8');
 const ctx=vm.createContext({TextEncoder,module:{exports:{}},exports:{}});
 vm.runInContext(source.slice(source.indexOf('function createQrModules('),source.indexOf('function safeFileName(')),ctx);
 vm.runInContext(await fs.readFile(new URL('../../vendor/jsQR.js',import.meta.url),'utf8'),ctx);
 const url='https://zakaz.khanzama.ru/p/'+'a'.repeat(43),grid=ctx.createQrModules(url),scale=6,size=(grid.length+8)*scale;
 const pixels=new Uint8ClampedArray(size*size*4).fill(255);
 for(let y=0;y<grid.length;y++)for(let x=0;x<grid.length;x++)if(grid[y][x])for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){
  const i=(((y+4)*scale+dy)*size+(x+4)*scale+dx)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;
 }
 assert.equal(ctx.module.exports(pixels,size,size)?.data,url);
});

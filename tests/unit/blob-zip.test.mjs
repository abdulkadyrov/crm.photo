import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createBlobZip} from '../../js/services/blob-zip.js';
test('ZIP preserves binary payloads, UTF-8 paths and CRC while reading large files in bounded slices',async()=>{
 let largestRead=0;
 class BoundedBlob extends Blob {
  arrayBuffer(){throw new Error('Whole-file read is forbidden');}
  slice(start,end){largestRead=Math.max(largestRead,end-start);return super.slice(start,end);}
 }
 const bytes=new Uint8Array(1024*1024+17).map((_,index)=>index%251);
 const blob=await createBlobZip([{path:'фото/оригинал.bin',data:new BoundedBlob([bytes])},{path:'empty',data:new Blob([])},{path:'data.json',data:new TextEncoder().encode('{"ok":true}')}]);
 assert(largestRead<=256*1024);
 const dir=mkdtempSync(join(tmpdir(),'crm-zip-'));
 try{
  writeFileSync(join(dir,'test.zip'),new Uint8Array(await blob.arrayBuffer()));
  const result=spawnSync('python3',['-c',`import zipfile,sys,json
with zipfile.ZipFile(sys.argv[1]) as z:
 assert z.testzip() is None
 assert z.read('фото/оригинал.bin') == bytes(i%251 for i in range(1024*1024+17))
 assert z.read('empty') == b''
 assert json.loads(z.read('data.json')) == {'ok': True}
`,join(dir,'test.zip')],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('ZIP refuses unsupported ZIP64 sizes before reading the file',async()=>{
 class Oversized extends Blob {get size(){return 0x100000000;}}
 await assert.rejects(createBlobZip([{path:'huge',data:new Oversized()}]),/4 ГБ/);
});

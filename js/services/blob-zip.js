const table = Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++) n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const num=(n,size)=>{const bytes=new Uint8Array(size);const view=new DataView(bytes.buffer);size===2?view.setUint16(0,n,true):view.setUint32(0,n,true);return bytes;};
const u16=n=>num(n,2),u32=n=>num(n,4);
// ZIP store mode: payloads stay as file-backed Blob parts. Only one small CRC
// chunk is read into JS memory at a time, even for a large video.
export async function createBlobZip(files,{onProgress=()=>{},chunkSize=256*1024}={}) {
 if(files.length>65535) throw new Error('Слишком много файлов для одного ZIP. Экспортируйте по группам.');
 const parts=[], central=[];let offset=0,centralSize=0;
 for(let index=0;index<files.length;index++) {
  const file=files[index];const blob=file.data instanceof Blob?file.data:new Blob([file.data]);
  const name=new TextEncoder().encode(file.path);
  if(blob.size>0xffffffff||offset+blob.size+name.length+30>0xffffffff||name.length>65535) throw new Error('ZIP больше 4 ГБ. Экспортируйте по группам.');
  let crc=0xffffffff;
  for(let start=0;start<blob.size;start+=chunkSize) {
   const bytes=new Uint8Array(await blob.slice(start,start+chunkSize).arrayBuffer());
   for(const byte of bytes) crc=(crc>>>8)^table[(crc^byte)&255];
   if(start%(chunkSize*8)===0) await new Promise(resolve=>setTimeout(resolve,0));
  }
  crc=(crc^0xffffffff)>>>0;
  const header=new Blob([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(blob.size),u32(blob.size),u16(name.length),u16(0),name]);
  parts.push(header,blob);
  const entry=new Blob([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(blob.size),u32(blob.size),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);
  central.push(entry);centralSize+=entry.size;offset+=header.size+blob.size;
  onProgress({index:index+1,total:files.length,path:file.path});
 }
 if(offset+centralSize>0xffffffff) throw new Error('ZIP больше 4 ГБ. Экспортируйте по группам.');
 return new Blob([...parts,...central,u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralSize),u32(offset),u16(0)],{type:'application/zip'});
}

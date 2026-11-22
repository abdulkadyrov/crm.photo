// Face verification only within the child's explicitly selected original photos.
export const PORTRAIT_MODEL_VERSION='face-api-1.7.15-recognition-v1';
let enginePromise,queue=Promise.resolve();
const descriptors=new Map();
const abort=signal=>{if(signal?.aborted)throw new DOMException('Проверка отменена','AbortError');};
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
export function descriptorDistance(a,b){
 if(!a?.length||a.length!==b?.length||!Array.from(a).every(Number.isFinite)||!Array.from(b).every(Number.isFinite))throw new Error('Некорректный вектор лица');
 return Math.sqrt(Array.from(a).reduce((sum,v,i)=>sum+(v-b[i])**2,0));
}
export function portraitSimilarityIndex(distance){return Math.round(Math.max(0,Math.min(1,1-distance))*1000)/10;}
export function aggregatePortraitDistances(distances){
 if(!distances.length||!distances.every(d=>Number.isFinite(d)&&d>=0))throw new Error('Нет измерений для сравнения');
 const sorted=[...distances].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);
 const distance=sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
 return {similarity:portraitSimilarityIndex(distance),rawScore:distance,spread:sorted.at(-1)-sorted[0]};
}
async function engine(){
 if(!enginePromise)enginePromise=(async()=>{
  const api=await import('../../third_party/portrait-face/dist/face-api.esm.js');
  try{await api.tf.setBackend('webgl');}catch{await api.tf.setBackend('cpu');}await api.tf.ready();
  const base=new URL('../../third_party/portrait-face/model/',import.meta.url).href;
  await Promise.all([api.nets.tinyFaceDetector.loadFromUri(base),api.nets.faceLandmark68TinyNet.loadFromUri(base),api.nets.faceRecognitionNet.loadFromUri(base)]);
  return api;
 })().catch(error=>{enginePromise=null;throw new Error('Не удалось загрузить модель проверки. Проверьте подключение и повторите.',{cause:error});});
 return enginePromise;
}
async function face(blob,signal){
 abort(signal);if(!(blob instanceof Blob)||!blob.size)throw new Error('Фотография недоступна');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');
 abort(signal);if(descriptors.has(hash))return descriptors.get(hash);
 const api=await engine();abort(signal);
 const image=new Image(),url=URL.createObjectURL(blob);
 try{
  image.src=url;await image.decode();abort(signal);
  const scale=Math.min(1,800/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);await pause();abort(signal);
  const found=await api.detectAllFaces(canvas,new api.TinyFaceDetectorOptions({inputSize:416,scoreThreshold:.6})).withFaceLandmarks(true).withFaceDescriptors();
  abort(signal);
  if(!found.length)throw new Error('Лицо не найдено: нужен чёткий снимок анфас');
  if(found.length!==1)throw new Error('На фотографии несколько лиц — выберите снимок с одним ребёнком');
  const item=found[0],box=item.detection.box;
  if(Math.min(box.width,box.height)<48)throw new Error('Лицо слишком маленькое для надёжного сравнения');
  const value={descriptor:Array.from(item.descriptor),quality:{detectionScore:item.detection.score,faceWidth:Math.round(box.width),faceHeight:Math.round(box.height)}};
  descriptors.set(hash,value);if(descriptors.size>40)descriptors.delete(descriptors.keys().next().value);
  canvas.width=canvas.height=0;return value;
 }finally{URL.revokeObjectURL(url);image.src='';}
}
async function compare({originals=[],result,signal,onProgress=()=>{}}){
 abort(signal);if(!originals.length)return {status:'unavailable',similarity:null,explanation:'Нет оригинальных фотографий этого ребёнка',modelVersion:PORTRAIT_MODEL_VERSION};
 onProgress({done:0,total:originals.length+1,message:'Загружаю модель и проверяю лицо результата…'});
 let target;try{target=await face(result,signal);}catch(error){if(error.name==='AbortError')throw error;return {status:'unavailable',similarity:null,explanation:'Результат: '+error.message,modelVersion:PORTRAIT_MODEL_VERSION};}
 const perOriginal=[];
 for(let i=0;i<originals.length;i++){
  abort(signal);onProgress({done:i+1,total:originals.length+1,message:`Сравниваю с оригиналом ${i+1} из ${originals.length}…`});
  try{const original=await face(originals[i],signal);const distance=descriptorDistance(original.descriptor,target.descriptor);perOriginal.push({index:i,rawScore:distance,similarity:portraitSimilarityIndex(distance),quality:original.quality});}
  catch(error){if(error.name==='AbortError')throw error;perOriginal.push({index:i,similarity:null,explanation:error.message});}await pause();
 }
 const valid=perOriginal.filter(row=>row.similarity!==null);
 if(!valid.length)return {status:'unavailable',similarity:null,perOriginal,explanation:'Не удалось проверить оригиналы: '+perOriginal[0].explanation,modelVersion:PORTRAIT_MODEL_VERSION};
 const summary=aggregatePortraitDistances(valid.map(row=>row.rawScore));
 return {status:'ok',...summary,quality:target.quality,perOriginal,compared:valid.length,total:originals.length,modelVersion:PORTRAIT_MODEL_VERSION,explanation:summary.spread>.2?'Оригиналы дают разные оценки. Проверьте, что на всех фото один ребёнок.':'Индекс сходства лиц. Не является вероятностью идентичности; проверьте лицо визуально.'};
}
export function comparePortraitIdentity(options){
 // Serialize GPU inference, recover the queue after a failure or cancellation.
 const pending=queue.then(()=>compare(options));queue=pending.catch(()=>{});return pending;
}

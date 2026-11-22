// Face verification only within the child's explicitly selected original photos.
export const PORTRAIT_MODEL_VERSION='face-api-1.7.15-recognition-v2';
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
async function face(blob,signal,multiple=false){
 abort(signal);if(!(blob instanceof Blob)||!blob.size)throw new Error('Фотография недоступна');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');
 abort(signal);if(descriptors.has(hash)){const cached=descriptors.get(hash);if(!multiple&&cached.length!==1)throw new Error('На оригинале несколько лиц');return multiple?cached:cached[0];}
 const api=await engine();abort(signal);
 const image=new Image(),url=URL.createObjectURL(blob);
 try{
  image.src=url;await image.decode();abort(signal);
  const scale=Math.min(1,1400/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);await pause();abort(signal);
  // withFaceLandmarks aligns each detected face; withFaceDescriptors extracts the aligned face crop, not the scene.
  const found=await api.detectAllFaces(canvas,new api.TinyFaceDetectorOptions({inputSize:608,scoreThreshold:.6})).withFaceLandmarks(true).withFaceDescriptors();
  abort(signal);
  if(!found.length)throw new Error('Лицо не найдено: нужен чёткий снимок анфас');
  const candidates=found.filter(item=>Math.min(item.detection.box.width,item.detection.box.height)>=48).map(item=>({descriptor:Array.from(item.descriptor),quality:{detectionScore:item.detection.score,faceWidth:Math.round(item.detection.box.width),faceHeight:Math.round(item.detection.box.height)}}));
  if(!candidates.length)throw new Error('Лицо слишком маленькое для надёжного сравнения');
  descriptors.set(hash,candidates);if(descriptors.size>40)descriptors.delete(descriptors.keys().next().value);
  if(!multiple&&candidates.length!==1)throw new Error('На оригинале несколько лиц — нужен снимок одного ребёнка');
  const value=multiple?candidates:candidates[0];
  canvas.width=canvas.height=0;return value;
 }finally{URL.revokeObjectURL(url);image.src='';}
}
export function selectPortraitCandidate(candidates,references){
 const ranked=candidates.map((candidate,index)=>({index,...aggregatePortraitDistances(references.map(ref=>descriptorDistance(ref.descriptor,candidate.descriptor)))})).sort((a,b)=>a.rawScore-b.rawScore);
 if(!ranked.length)throw new Error('Лицо результата не найдено');
 const margin=ranked.length>1?ranked[1].rawScore-ranked[0].rawScore:null;
 if(margin!==null&&margin<.06)throw new Error('Несколько похожих лиц: не удалось однозначно выбрать лицо ребёнка');
 return {candidate:candidates[ranked[0].index],candidateCount:candidates.length,margin};
}
async function compare({originals=[],result,signal,onProgress=()=>{}}){
 abort(signal);if(!originals.length)return {status:'unavailable',similarity:null,explanation:'Нет оригинальных фотографий этого ребёнка',modelVersion:PORTRAIT_MODEL_VERSION};
 const references=[],perOriginal=[];
 for(let i=0;i<originals.length;i++){
  abort(signal);onProgress({done:i,total:originals.length+1,message:`Проверяю оригинал ${i+1} из ${originals.length}…`});
  try{references.push({index:i,...await face(originals[i],signal)});}catch(error){if(error.name==='AbortError')throw error;perOriginal.push({index:i,similarity:null,explanation:error.message});}await pause();
 }
 if(!references.length)return {status:'unavailable',similarity:null,perOriginal,explanation:'Не удалось проверить оригиналы: '+perOriginal[0].explanation,modelVersion:PORTRAIT_MODEL_VERSION};
 onProgress({done:originals.length,total:originals.length+1,message:'Сравниваю лицо ребёнка на результате…'});
 let selected;try{selected=selectPortraitCandidate(await face(result,signal,true),references);}catch(error){if(error.name==='AbortError')throw error;return {status:'unavailable',similarity:null,explanation:'Результат: '+error.message,modelVersion:PORTRAIT_MODEL_VERSION};}
 for(const reference of references){const distance=descriptorDistance(reference.descriptor,selected.candidate.descriptor);perOriginal.push({index:reference.index,rawScore:distance,similarity:portraitSimilarityIndex(distance),quality:reference.quality});}
 perOriginal.sort((a,b)=>a.index-b.index);
 const valid=perOriginal.filter(row=>row.similarity!==null),summary=aggregatePortraitDistances(valid.map(row=>row.rawScore));
 return {status:'ok',...summary,quality:{...selected.candidate.quality,candidateCount:selected.candidateCount,selectionMargin:selected.margin},perOriginal,compared:valid.length,total:originals.length,modelVersion:PORTRAIT_MODEL_VERSION,explanation:summary.spread>.2?'Оригиналы дают разные оценки. Проверьте, что на всех фото один ребёнок.':selected.candidateCount>1?'Лицо ребёнка выбрано среди нескольких кандидатов по сравнению с его оригиналами. Индекс не является вероятностью идентичности.':'Индекс сходства лиц. Не является вероятностью идентичности; проверьте лицо визуально.'};
}

export function comparePortraitIdentity(options){
 // Serialize GPU inference, recover the queue after a failure or cancellation.
 const pending=queue.then(()=>compare(options));queue=pending.catch(()=>{});return pending;
}

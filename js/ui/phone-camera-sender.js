import {bindTapFocus} from '../services/camera-focus.js';
const form=document.querySelector('#pair'),video=document.querySelector('#video'),status=document.querySelector('#status'),live=document.querySelector('#live'),device=document.querySelector('#device'),stopButton=document.querySelector('#stop'),resume=document.querySelector('#resume');
let focusUntil=0;
const tapFocus=bindTapFocus(video,{getTrack:()=>stream?.getVideoTracks()[0],onStatus:message=>{focusUntil=Date.now()+1800;status.textContent=message;}});
let session=null,stream=null,timer=null,generation=0,wake=null;
const say=message=>status.textContent=message;
function stop(message='Передача остановлена.'){generation++;clearTimeout(timer);stream?.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;void wake?.release().catch(()=>{});wake=null;resume.hidden=!session;stopButton.disabled=true;say(message);}
async function start(deviceId=''){
 stop('Открываем камеру…');const token=generation;
 try{const acquired=await navigator.mediaDevices.getUserMedia({video:deviceId?{deviceId:{exact:deviceId}}:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30}},audio:false});if(token!==generation){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;tapFocus.reset();video.srcObject=stream;live.hidden=false;form.hidden=true;await video.play();if(token!==generation)return;
  const cameras=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');if(token!==generation)return;device.replaceChildren(...cameras.map((d,i)=>new Option(d.label||`Камера ${i+1}`,d.deviceId)));device.value=stream.getVideoTracks()[0]?.getSettings().deviceId||cameras[0]?.deviceId||'';stopButton.disabled=false;resume.hidden=true;say('Камера включена · передаём изображение на Mac');
  try{const lock=await navigator.wakeLock?.request('screen');if(token!==generation)void lock?.release().catch(()=>{});else wake=lock;}catch{}
  const canvas=document.createElement('canvas');
  const tick=async()=>{if(token!==generation||!stream)return;
   try{if(!video.videoWidth)throw new Error('Камера ещё не готова');const ratio=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight));canvas.width=Math.round(video.videoWidth*ratio);canvas.height=Math.round(video.videoHeight*ratio);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.67));if(token!==generation)return;if(!blob||blob.size>320*1024)throw new Error('Не удалось подготовить изображение');
    const response=await fetch('/api/v1/public/camera/frame/'+session.id,{method:'POST',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'image/jpeg',Authorization:'Bearer '+session.token},body:await blob.arrayBuffer()});
    if(token!==generation)return;
    if(!response.ok){if([401,403,404,410].includes(response.status)){session=null;try{sessionStorage.removeItem('crm-phone-camera');}catch{}stop('Mac отключил камеру. Получите новый код подключения.');live.hidden=true;form.hidden=false;return;}throw new Error('Нет связи');}
    const result=await response.json();if(Date.now()>focusUntil)say(result.notice==='recognized'?'QR распознан · выберите услугу на Mac':'Передаём на Mac · наведите рамку на QR');
   }catch{if(token===generation)say('Связь прервалась · камера видна здесь, повторяем передачу…');}
   if(token===generation&&stream)timer=setTimeout(tick,180);
  };void tick();
 }catch(error){if(token===generation){stop('Камера недоступна. Отключите iPhone как системную камеру Mac и разрешите камеру в браузере телефона.');live.hidden=false;form.hidden=true;}}
}
form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button');button.disabled=true;say('Подключаемся к Mac…');try{const response=await fetch('/api/v1/public/camera/pair',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:new FormData(form).get('code')})});const result=await response.json();if(!response.ok)throw new Error(result.error);session={id:result.id,token:result.token};try{sessionStorage.setItem('crm-phone-camera',JSON.stringify(session));}catch{}await start();}catch(error){say(error.message);}finally{button.disabled=false;}};
stopButton.onclick=()=>stop();resume.onclick=()=>void start();device.onchange=()=>void start(device.value);
window.addEventListener('pagehide',()=>stop());document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream)stop('Камера приостановлена. Вернитесь на эту страницу и нажмите «Включить камеру снова».');});
try{const saved=JSON.parse(sessionStorage.getItem('crm-phone-camera')||'null');if(saved?.id&&saved?.token){session=saved;live.hidden=false;form.hidden=true;resume.hidden=false;say('Соединение сохранено. Нажмите «Включить камеру снова».');}}catch{}

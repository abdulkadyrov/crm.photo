// Frames are relayed only to the authenticated owner; phone credentials are send-only.
export async function phoneCameraRequest(method,id='',body,after=0){
 const response=await fetch('/api/v1/sync/phone-camera'+(id?'/'+encodeURIComponent(id):'')+(method==='GET'?'?after='+after:''),{method,credentials:'same-origin',cache:'no-store',keepalive:body?.action==='stop',signal:AbortSignal.timeout(12000),headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 if(!response.ok){const error=new Error((await response.json().catch(()=>({}))).error||'Нет связи с камерой');error.status=response.status;throw error;}return response.json();
}
export function receivePhoneCamera({session,request=phoneCameraRequest,onStream,onStatus=()=>{},onFrame=()=>{}}){
 let stopped=false,timer,seq=0,stream=null,failures=0;const canvas=document.createElement('canvas');
 const tick=async()=>{if(stopped)return;
  try{const reply=await request('GET',session.id,null,seq);if(stopped)return;
   if(reply.frame){const image=new Image();image.src=reply.frame;await image.decode();if(stopped)return;canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);if(!stream){stream=canvas.captureStream(10);onStream(stream);}seq=reply.seq;onFrame();onStatus('Камера телефона · изображение поступает');}
   else onStatus(reply.connected?(Date.now()/1000-reply.lastFrame<3?'Камера телефона · изображение поступает':'Телефон подключён · включите камеру на телефоне'):'Откройте страницу камеры на телефоне и введите код');failures=0;
  }catch(error){if(stopped)return;if([401,403,410].includes(error.status)){onStatus(error.message);stop();return;}onStatus('Нет связи с телефоном · повторяем подключение…');failures++;}
  if(!stopped)timer=setTimeout(tick,failures?1200:180);
 };
 const stop=()=>{if(stopped)return;stopped=true;clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());void request('POST',session.id,{action:'stop'}).catch(()=>{});};
 const notice=value=>void request('POST',session.id,{action:'notice',notice:value}).catch(()=>{});
 void tick();return {stop,notice};
}

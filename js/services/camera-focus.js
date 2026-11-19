// Camera APIs expose focus requests, but no portable "focus locked" event.
// Never label an unsupported/ignored request as confirmed hardware focus.
export function cameraFocusPoint({x,y,rect,width,height,fit='cover'}) {
 if(!width||!height||!rect.width||!rect.height)return null;
 const scale=(fit==='contain'?Math.min:Math.max)(rect.width/width,rect.height/height);
 const left=(rect.width-width*scale)/2,top=(rect.height-height*scale)/2;
 const px=(x-rect.left-left)/(width*scale),py=(y-rect.top-top)/(height*scale);
 if(px<0||px>1||py<0||py>1)return null;
 return {x:px,y:py};
}
export function createCameraFocus({getTrack,getSupported=()=>navigator.mediaDevices.getSupportedConstraints?.()||{},sleep=ms=>new Promise(r=>setTimeout(r,ms)),onStatus=()=>{}}){
 let point=null,pending=Promise.resolve(),disposed=false;
 async function request(track,selected){
  const caps=track?.getCapabilities?.()||{},modes=caps.focusMode||[];
  const mode=modes.includes('single-shot')?'single-shot':modes.includes('continuous')?'continuous':null;
  const values={};if(mode)values.focusMode=mode;
  const targeted=!!(selected&&mode&&getSupported().pointsOfInterest);
  if(targeted)values.pointsOfInterest=[selected];
  if(Object.keys(values).length){
   // Preserve zoom, torch, resolution and frame rate when updating focus.
   const current=track.getConstraints?.()||{};
   const advanced=(current.advanced||[]).map(({focusMode,pointsOfInterest,...rest})=>rest).filter(v=>Object.keys(v).length);
   let timer;try{await Promise.race([track.applyConstraints({...current,advanced:[...advanced,values]}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Камера не ответила. Повторите фокусировку.')),1500);})]);}finally{clearTimeout(timer);}
  }
  return targeted;
 }
 return {
  tap(selected){if(disposed||!getTrack())return Promise.resolve();point=selected;const track=getTrack();onStatus('Фокусируемся…');
   pending=pending.catch(()=>{}).then(()=>request(track,selected));return pending.then(targeted=>{if(!disposed&&getTrack()===track)onStatus(targeted?'Запрос фокусировки отправлен':'Автофокус · выбор точки недоступен в этом браузере');}).catch(error=>{if(!disposed)onStatus(error.message);});
  },
  async prepare(){const track=getTrack();if(disposed||!track)throw new Error('Камера выключена');onStatus('Фокусировка перед снимком · держите камеру неподвижно');await pending.catch(()=>{});await request(track,point);await sleep(500);if(disposed||track!==getTrack()||track.readyState==='ended')throw new Error('Камера переключена или выключена');},
  reset(){point=null;pending=Promise.resolve();},dispose(){disposed=true;}
 };
}
export function bindTapFocus(video,{getTrack,onStatus=()=>{},enabled=()=>true}){
 const focus=createCameraFocus({getTrack,onStatus}),parent=video.parentElement;
 const ring=document.createElement('span');ring.setAttribute('aria-hidden','true');ring.style.cssText='position:absolute;width:54px;height:54px;border:2px solid #facc15;border-radius:8px;transform:translate(-50%,-50%);pointer-events:none;z-index:5;display:none';
 const originalPosition=parent.style.position;if(getComputedStyle(parent).position==='static')parent.style.position='relative';parent.append(ring);let down=null,timer;
 const start=e=>{if(e.isPrimary!==false&&e.button<=0&&e.target===video)down={x:e.clientX,y:e.clientY};};
 const end=e=>{const origin=down;down=null;if(!origin||!enabled()||Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>8)return;
  const point=cameraFocusPoint({x:e.clientX,y:e.clientY,rect:video.getBoundingClientRect(),width:video.videoWidth,height:video.videoHeight,fit:getComputedStyle(video).objectFit});if(!point)return;
  const bounds=parent.getBoundingClientRect();ring.style.left=(e.clientX-bounds.left+parent.scrollLeft)+'px';ring.style.top=(e.clientY-bounds.top+parent.scrollTop)+'px';ring.style.display='block';clearTimeout(timer);timer=setTimeout(()=>ring.style.display='none',1200);void focus.tap(point);
 };
 video.addEventListener('pointerdown',start);video.addEventListener('pointerup',end);
 return {...focus,dispose(){focus.dispose();clearTimeout(timer);ring.remove();parent.style.position=originalPosition;video.removeEventListener('pointerdown',start);video.removeEventListener('pointerup',end);}};
}

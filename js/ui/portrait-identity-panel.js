import {comparePortraitIdentity} from '../services/portrait-identity.js?v=316';
export function mountPortraitIdentityPanel({host,loadOriginals,loadResult,onResult=()=>{},cachedResult=null}){
 const controller=new AbortController(),{signal}=controller;
 const section=document.createElement('section');section.className='portrait-identity-panel';section.setAttribute('aria-label','Сходство с оригиналами');
 section.innerHTML='<div class="portrait-identity-heading"><strong>Сходство с оригиналами</strong><button type="button" class="secondary-button compact">Проверить</button></div><p role="status" aria-live="polite">Сравнение лиц выполняется на этом устройстве.</p><details hidden><summary>Подробности проверки</summary><div></div></details>';
 host.querySelector('.final-work-viewer-meta')?.after(section);
 const button=section.querySelector('button'),status=section.querySelector('[role=status]'),details=section.querySelector('details'),body=details.querySelector('div');
 let busy=false;
 const run=async()=>{
  if(busy||signal.aborted)return;busy=true;button.disabled=true;details.hidden=true;status.textContent='Загружаю оригиналы ребёнка…';
  try{
   const originals=await loadOriginals(signal);if(signal.aborted)return;
   const result=await loadResult(signal);if(signal.aborted)return;
   const value=await comparePortraitIdentity({originals,result,signal,onProgress:p=>{if(!signal.aborted)status.textContent=p.message;}});
   if(signal.aborted)return;
   onResult(value);
   status.textContent=value.status==='ok'?`Сходство: ${value.similarity}% · проверено оригиналов: ${value.compared} из ${value.total}`:value.explanation;
   body.replaceChildren();
   const explanation=document.createElement('p');explanation.textContent=value.explanation;body.append(explanation);
   for(const row of value.perOriginal||[]){const p=document.createElement('p');p.textContent=`Оригинал ${row.index+1}: ${row.similarity===null?row.explanation:row.similarity+'%'}`;body.append(p);}
   const note=document.createElement('p');note.textContent='Локальная модель FaceAPI. Индекс 0–100%, а не вероятность идентичности. Оценка на детских фото и после ретуши может ошибаться. Оплата и готовность работы не меняются.';body.append(note);details.hidden=false;button.textContent='Повторить';
  }catch(error){if(!signal.aborted)status.textContent=error.message||'Не удалось сравнить лица. Повторите проверку.';}
  finally{busy=false;button.disabled=false;}
 };
 button.onclick=run;
 // Defer until the viewer has painted; never block opening the result.
 if(cachedResult){status.textContent=Number.isFinite(cachedResult.similarity)?`Сходство: ${cachedResult.similarity}% · сохранённая проверка`:cachedResult.explanation;button.textContent='Перепроверить';}
 const timer=cachedResult?null:setTimeout(run,350);
 return ()=>{clearTimeout(timer);controller.abort();section.remove();};
}

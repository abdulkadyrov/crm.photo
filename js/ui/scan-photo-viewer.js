// Independent head frames let differently cropped originals and results share a zoom.
export function headTransform(width,height,head,zoom=1,pan={x:0,y:0}) {
  const scale=Math.min(width,height)*0.55/Math.max(1,head.size)*zoom;
  return {scale,x:width/2-head.x*scale+pan.x*width,y:height/2-head.y*scale+pan.y*height};
}
export function openScanPhotoViewer({items,index=0,compare=false,mountHistory}) {
  const available=items.filter(item=>item?.url);if(!available.length)return;
  const origin=document.activeElement,root=document.createElement('div');root.className='scan-photo-viewer';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Просмотр и сравнение фотографий');
  root.innerHTML=`<style>
.scan-photo-viewer{position:fixed;inset:0;z-index:10050;background:#101318;color:white;display:flex;flex-direction:column;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);font:15px system-ui;box-sizing:border-box}.scan-photo-viewer *{box-sizing:border-box}.spv-head,.spv-tools{display:flex;align-items:center;gap:8px;padding:10px;flex-wrap:wrap}.spv-head strong{flex:1}.scan-photo-viewer button{border:1px solid #647084;border-radius:12px;background:#242d3b;color:white;min-height:44px;padding:8px 12px;font:inherit}.scan-photo-viewer button[aria-pressed=true]{background:#245ff0}.spv-panes{display:flex;flex:1;min-height:0;gap:4px}.spv-pane{position:relative;flex:1;min-width:0;overflow:hidden;touch-action:none;background:#080a0d}.spv-pane img{position:absolute;max-width:none;max-height:none;transform-origin:0 0;pointer-events:none;user-select:none}.spv-label{position:absolute;top:8px;left:8px;background:#101318cc;padding:4px 8px;border-radius:8px;pointer-events:none;z-index:1}.spv-box{position:absolute;border:2px solid #ffdf61;background:#ffdf6120;pointer-events:none}.spv-hint{margin:0;padding:0 12px 10px;color:#d6deeb;min-height:32px}.spv-tools input{width:100px;flex:1;min-width:70px}.spv-error{padding:50px 12px;color:#ffb3b3}
</style><header class="spv-head"><strong>${compare?'Оригинал и результат':'Просмотр фотографии'}</strong><button type="button" data-close aria-label="Закрыть просмотр">Закрыть</button></header><div class="spv-panes"></div><div class="spv-tools"><button type="button" data-minus aria-label="Уменьшить">−</button><input type="range" min="1" max="8" step="0.05" value="1" aria-label="Масштаб" /><button type="button" data-plus aria-label="Увеличить">+</button><button type="button" data-fit>Целиком</button>${compare?'<button type="button" data-head aria-pressed="false">Выделить головы</button>':''}</div><p class="spv-hint" role="status"></p>`;
  let history,closed=false,zoom=1,pan={x:0,y:0},align=false,headMode=false;
  const chosen=compare?available: [items[index]?.url?items[index]:available[0]];
  const panes=chosen.map(item=>{
    const el=document.createElement('div');el.className='spv-pane';const img=new Image();img.alt=item.label||'Фото';img.draggable=false;
    const label=document.createElement('span');label.className='spv-label';label.textContent=item.label||'Фото';el.append(img,label);root.querySelector('.spv-panes').append(el);
    const pane={el,img,head:null,points:new Map(),drag:null};
    img.onload=()=>draw();img.onerror=()=>{const error=document.createElement('p');error.className='spv-error';error.textContent='Фото не загрузилось. Проверьте подключение.';el.append(error);};img.src=item.url;return pane;
  });
  const hint=text=>root.querySelector('.spv-hint').textContent=text;
  function draw(){for(const p of panes){const w=p.el.clientWidth,h=p.el.clientHeight,iw=p.img.naturalWidth,ih=p.img.naturalHeight;if(!iw||!ih)continue;let t;if(headMode&&p.head)t=headTransform(w,h,p.head,zoom,pan);else{const scale=Math.min(w/iw,h/ih)*zoom;t={scale,x:(w-iw*scale)/2+pan.x*w,y:(h-ih*scale)/2+pan.y*h};}p.transform=t;p.img.style.width=iw+'px';p.img.style.height=ih+'px';p.img.style.transform=`translate(${t.x}px,${t.y}px) scale(${t.scale})`;}root.querySelector('input').value=zoom;}
  const setZoom=value=>{zoom=Math.max(1,Math.min(8,value));draw();};
  for(const p of panes){
    const point=e=>{const r=p.el.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
    p.el.onpointerdown=e=>{e.preventDefault();p.el.setPointerCapture(e.pointerId);p.points.set(e.pointerId,point(e));if(align){p.drag={start:point(e),end:point(e)};p.box=document.createElement('div');p.box.className='spv-box';p.el.append(p.box);}else p.drag=null;};
    p.el.onpointermove=e=>{if(!p.points.has(e.pointerId))return;const before=p.points.get(e.pointerId),next=point(e);if(align&&p.drag){p.drag.end=next;Object.assign(p.box.style,{left:Math.min(next.x,p.drag.start.x)+'px',top:Math.min(next.y,p.drag.start.y)+'px',width:Math.abs(next.x-p.drag.start.x)+'px',height:Math.abs(next.y-p.drag.start.y)+'px'});}else if(p.points.size===2){const other=[...p.points.entries()].find(([id])=>id!==e.pointerId)[1];const oldDistance=Math.hypot(before.x-other.x,before.y-other.y);if(oldDistance>5)setZoom(zoom*Math.hypot(next.x-other.x,next.y-other.y)/oldDistance);}else{pan.x+=(next.x-before.x)/p.el.clientWidth;pan.y+=(next.y-before.y)/p.el.clientHeight;draw();}p.points.set(e.pointerId,next);};
    const end=e=>{p.points.delete(e.pointerId);if(align&&p.drag){const {start,end}=p.drag,t=p.transform;if(t&&Math.abs(end.x-start.x)>12&&Math.abs(end.y-start.y)>12){p.head={x:((start.x+end.x)/2-t.x)/t.scale,y:((start.y+end.y)/2-t.y)/t.scale,size:Math.max(Math.abs(end.x-start.x),Math.abs(end.y-start.y))/t.scale};p.el.querySelector('.spv-label').textContent=(chosen[panes.indexOf(p)].label||'Фото')+' · голова выбрана';}p.box?.remove();p.drag=null;if(panes.every(row=>row.head)){align=false;headMode=true;zoom=1;pan={x:0,y:0};root.querySelector('[data-head]').setAttribute('aria-pressed','false');hint('Головы совмещены. Масштаб и перемещение общие для двух фото.');draw();}}};
    p.el.onpointerup=end;p.el.onpointercancel=e=>{p.points.delete(e.pointerId);p.box?.remove();p.drag=null;};p.el.onwheel=e=>{e.preventDefault();setZoom(zoom*Math.exp(-e.deltaY*0.002));};
    p.el.ondblclick=()=>setZoom(zoom===1?2:1);
  }
  root.querySelector('[data-minus]').onclick=()=>setZoom(zoom/1.25);root.querySelector('[data-plus]').onclick=()=>setZoom(zoom*1.25);root.querySelector('input').oninput=e=>setZoom(Number(e.target.value));
  root.querySelector('[data-fit]').onclick=()=>{align=false;headMode=false;zoom=1;pan={x:0,y:0};root.querySelector('[data-head]')?.setAttribute('aria-pressed','false');hint('Раздвигайте пальцы для увеличения. Перетаскивайте фото.');draw();};
  root.querySelector('[data-head]')?.addEventListener('click',()=>{align=!align;headMode=false;zoom=1;pan={x:0,y:0};panes.forEach(p=>p.head=null);root.querySelector('[data-head]').setAttribute('aria-pressed',String(align));hint(align?'Обведите голову прямоугольником на каждом фото: от верхнего угла до нижнего.':'Раздвигайте пальцы для увеличения.');draw();});
  const observer=new ResizeObserver(draw);const siblings=[...document.body.children].map(el=>[el,el.inert]);siblings.forEach(([el])=>el.inert=true);const finish=()=>{if(closed)return;closed=true;observer.disconnect();root.remove();siblings.forEach(([el,inert])=>el.inert=inert);origin?.focus({preventScroll:true});};
  const close=()=>history?history.close():finish();root.querySelector('[data-close]').onclick=close;
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(e.key==='Tab'){const nodes=[...root.querySelectorAll('button,input')];if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}}});
  document.body.append(root);observer.observe(root.querySelector('.spv-panes'));history=mountHistory?.(finish);hint(compare?'Для сравнения лиц нажмите «Выделить головы» и обведите их на обоих фото.':'Раздвигайте пальцы для увеличения. Перетаскивайте фото.');root.querySelector('[data-close]').focus({preventScroll:true});draw();return root;
}

export function enhanceScanPhotoPair(container,{mountHistory}={}) {
  const images=[...container.querySelectorAll('img')];if(!images.length)return;
  const items=images.map(img=>({label:img.alt||'Фото',url:img.currentSrc||img.src}));
  for(const [index,img] of images.entries()){
    const button=document.createElement('button');button.type='button';button.className='scan-photo-open';button.setAttribute('aria-label','Увеличить: '+items[index].label);Object.assign(button.style,{display:'block',padding:'0',border:'0',background:'transparent',width:'100%',cursor:'zoom-in'});img.replaceWith(button);button.append(img);button.onclick=()=>openScanPhotoViewer({items,index,mountHistory});
  }
  if(images.length>1){const button=document.createElement('button');button.type='button';button.className='secondary-button compact';button.textContent='Сравнить лица · увеличение';button.style.gridColumn='1 / -1';button.onclick=()=>openScanPhotoViewer({items,compare:true,mountHistory});container.append(button);}
}

import {serviceFilterChoices,filterServiceEntries,matchesServiceFilter} from '../services/service-filter.js';
import {fulfillmentStatusOptions,matchesFulfillmentStatus,fulfillmentPriceSummary} from '../services/fulfillment-pricing.js';
import { splitFulfillmentList, restoreFulfillmentSelection } from '../services/fulfillment-sorting.js';
import { fulfillmentCardSlides } from '../services/fulfillment-cards.js';
import { PAYMENT_METHODS, CORRECTION_REASONS, paymentLabel, needsCorrection, isDelivered, matchesFulfillment } from '../services/fulfillment.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options = values => Object.entries(values).map(([value,label]) => `<option value="${value}">${label}</option>`).join('');

// The underlying page stays mounted: selection, open rows, filters and scroll survive nested previews.
export function openFulfillmentPanel({ title, getData, money = false, canManage = true, canPay = true, initialStudentId = '', initialStudentIds = [], selectionKey = '', scopedWorks = false, saveBatch, saveWork, preview, imageBlob, imageUrl, orderedItems, mountHistory, restore, onClose }) {
  const panel = document.createElement('div');
  panel.className = 'qr-panel-backdrop fulfillment-backdrop';
  panel.innerHTML = `<section class="fulfillment-panel" role="dialog" aria-modal="true" aria-labelledby="fulfillment-title" tabindex="-1">
    <header class="fulfillment-head"><div><h2 id="fulfillment-title">Оплата и выдача</h2><p>${esc(title)}</p></div><button class="secondary-button compact" data-close type="button">Закрыть</button></header>
    <div class="fulfillment-searchbar"><label class="visually-hidden" for="fulfillment-search">Найти ребёнка</label><input id="fulfillment-search" class="input" data-search type="search" placeholder="Фамилия или имя" /><button class="secondary-button compact" data-toggle-filters aria-expanded="false" type="button">Фильтры</button></div><div class="fulfillment-filters" hidden><label>Показать<select class="select" data-filter>${options({all:'Всех детей',unpaid:'Не оплатили',paid:'Оплатили',...(money ? {cash:'Наличные',transfer:'Переводы',unknown:'Без способа оплаты'} : {}),waiting:'Фото ещё не выданы',delivered:'Фото выданы',correction:'Есть замечания'})}</select></label><label>Статус работ<select class="select" data-work-status aria-label="Статус работ">${options(fulfillmentStatusOptions)}</select></label>${money?'<label>Цена услуги<select class="select" data-unit-price aria-label="Цена услуги"><option value="">Все цены</option></select></label>':''}<details data-services><summary>Услуги <span data-services-count></span></summary><div data-services-options style="max-height:170px;overflow:auto;display:grid;gap:4px"></div></details><label>Группа<select class="select" data-group><option value="">Все группы</option></select></label></div>
    ${scopedWorks?'<p class="group-scan-scope-note">Печать и выдача изменят только фотографии из этой проверки. Оплата отмечается целиком у выбранных детей.</p>':''}<p class="fulfillment-summary" data-summary></p>${money?'<p class="fulfillment-summary" data-price-summary role="status" style="margin:0;font-size:13px;overflow-wrap:anywhere"></p><div data-price-buckets aria-label="Разбивка по ценам" style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px"></div>':''}
    <nav class="fulfillment-sort-tabs" aria-label="Списки для сортировки"><button type="button" data-sort-list="remaining" aria-pressed="true">Осталось <span data-remaining-count>0</span></button><button type="button" data-sort-list="picked" aria-pressed="false">Выбрано <span data-picked-count>0</span></button><button type="button" data-sort-list="all" aria-pressed="false">Весь список</button></nav>
    <div class="fulfillment-select"><label><input type="checkbox" data-select-all /> Все найденные</label><button class="secondary-button compact" data-clear type="button">Снять выбор</button><span data-selected role="status"></span></div>
    <div class="fulfillment-list" data-list></div>
    <footer class="fulfillment-footer"><div class="fulfillment-batch-bar" hidden><strong data-batch-count aria-live="polite"></strong><button class="primary-button compact" data-open-batch type="button" aria-expanded="false">Действия</button></div><form data-batch hidden><label>Действие с выбранными<select class="select" name="action">${canPay ? '<option value="pay">Отметить оплату</option><option value="unpay">Снять оплату</option>' : ''}${canManage ? '<option value="printed">Фото напечатаны</option><option value="deliver">Фото выданы</option><option value="undeliver">Снять выдачу</option>' : ''}</select></label><label data-method ${money ? '' : 'hidden'}>Способ оплаты<select class="select" name="method"><option value="">Выберите способ</option>${options({cash:'Наличными',transfer:'Переводом',unknown:'Способ не указан'})}</select></label><label data-recipient ${money ? '' : 'hidden'}><span data-recipient-label>Кому / на какой счёт</span><input class="input" name="recipient" maxlength="200" placeholder="Имя получателя или банк (необязательно)" /></label><button class="primary-button" type="submit" data-apply>Применить</button></form><p data-message role="status" aria-live="polite">Выберите детей на карточках.</p></footer>
  </section>`;
  const list = panel.querySelector('[data-list]'), selected = new Set(initialStudentIds), open = new Set(initialStudentId ? [initialStudentId] : []), drafts = new Map(), urls = new Map(), slidePositions = new Map();
  let busy = false, closed = false, closePending = false, batchExpanded = false, activeList = initialStudentIds.length ? 'picked' : 'remaining', history;
  let snapshot=getData();
  if(selectionKey&&!initialStudentIds.length){try{restoreFulfillmentSelection(localStorage.getItem(selectionKey),snapshot.students).forEach(id=>selected.add(id));}catch{}}
  const paneScroll=new Map();
  const paneQueries=new Map();
  function persistSelection(){if(!selectionKey)return;try{localStorage.setItem(selectionKey,JSON.stringify({studentIds:[...selected],updatedAt:new Date().toISOString()}));}catch{panel.querySelector('[data-message]').hidden=false;panel.querySelector('[data-message]').textContent='Выбор сохранён только до закрытия панели: не удалось записать его на устройство.';}}
  const calculationLabel=()=>({generated:'Готовые услуги',all:'Готовые услуги',delivered:'Выданные услуги',unprinted:'Готовые, не распечатанные'}[panel.querySelector('[data-work-status]').value]||'Распечатанные услуги');
  const rubles=value=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:2}).format(value);
  const serviceIds=new Set();
  const entriesFor=student=>{const entries=filterServiceEntries(orderedItems?.(student)||[],[...serviceIds]),price=panel.querySelector('[data-unit-price]')?.value;return price?entries.filter(e=>typeof e.unitPrice==='number'&&Math.round(e.unitPrice*100)===Number(price)):entries;};
  const data = () => snapshot;
  const worksFor = id => data().works.filter(work => work.studentId === id);
  const name = student => `${student.lastName || ''} ${student.firstName || ''}`.trim();
  const groupName = id => data().groups.find(group => group.id === id)?.name || '';
  const visible = () => {
    const query = panel.querySelector('[data-search]').value.trim().toLocaleLowerCase('ru');
    const group = panel.querySelector('[data-group]').value, filter = panel.querySelector('[data-filter]').value;
    return data().students.filter(student => (!group || group === student.classId) && (!query || `${name(student)} ${groupName(student.classId)}`.toLocaleLowerCase('ru').includes(query)) && matchesFulfillment(student,worksFor(student.id),filter) && matchesServiceFilter(orderedItems?.(student)||[],[...serviceIds]) && (!panel.querySelector('[data-unit-price]')?.value||entriesFor(student).length>0) && matchesFulfillmentStatus(student,worksFor(student.id),entriesFor(student),panel.querySelector('[data-work-status]').value)).sort((a,b)=>name(a).localeCompare(name(b),'ru'));
  };
  function paneRows() {
    if(activeList==='picked') {
      const query=panel.querySelector('[data-search]').value.trim().toLocaleLowerCase('ru');
      return data().students.filter(student=>selected.has(student.id)&&(!query||`${name(student)} ${groupName(student.classId)}`.toLocaleLowerCase('ru').includes(query))).sort((a,b)=>name(a).localeCompare(name(b),'ru'));
    }
    const rows=visible();return activeList==='remaining'?splitFulfillmentList(rows,selected).remaining:rows;
  }
  function moveStudent(id, picked) {
    picked?selected.add(id):selected.delete(id);persistSelection();renderList();
    const replacement=list.querySelector(`[data-child="${CSS.escape(id)}"]`);
    (replacement||panel.querySelector(`[data-sort-list="${activeList==='picked'?'remaining':'picked'}"]`))?.focus({preventScroll:true});
  }
  const image = work => {
    if (urls.has(work.id)) return urls.get(work.id);
    const blob = imageBlob?.(work);
    if (!(blob instanceof Blob)) return imageUrl?.(work) || '';
    const url = URL.createObjectURL(blob); urls.set(work.id,url); return url;
  };
  function childGallery(student, works) {
    const info=fulfillmentCardSlides(student,works,orderedItems?.(student)||[]);
    const slides=info.slides.length?info.slides:[{key:'empty',title:'Работы пока не заказаны',quantity:null}];
    const index=Math.min(slidePositions.get(student.id)||0,slides.length-1);
    const arrow=direction=>`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${direction<0?'m15 6-6 6 6 6':'m9 6 6 6-6 6'}"/></svg>`;
    return `<div class="fulfillment-gallery" data-gallery="${esc(student.id)}"><div class="fulfillment-gallery-track" tabindex="0" role="region" aria-label="Заказанные работы ${esc(name(student))}">${slides.map((slide,n)=>{const url=slide.work?image(slide.work):'';return `<div class="fulfillment-slide" role="group" aria-label="Работа ${n+1} из ${slides.length}"><button class="fulfillment-cover" type="button" ${slide.work?`data-preview="${esc(slide.work.id)}" aria-label="Посмотреть ${esc(slide.title)}"`:'disabled'}>${url?`<img src="${esc(url)}" alt="${esc(slide.title)}" loading="lazy" />`:`<span>${slide.work?'Фото загружается':'Результат ещё не добавлен'}</span>`}</button><div class="fulfillment-slide-caption"><span>${esc(slide.title)}</span><strong>${slide.quantity===null?'Вне заказа':`Заказано: ${slide.quantity} шт.`}</strong></div></div>`;}).join('')}</div><div class="fulfillment-gallery-nav"><button type="button" data-gallery-step="-1" aria-label="Предыдущая работа" ${index===0?'disabled':''}>${arrow(-1)}</button><span data-gallery-index>${index+1} / ${slides.length}</span><button type="button" data-gallery-step="1" aria-label="Следующая работа" ${index===slides.length-1?'disabled':''}>${arrow(1)}</button></div><p class="fulfillment-order-count">Всего заказано: ${info.totalQuantity} шт.</p></div>`;
  }
  function workRow(work) {
    const correction = work.correction, draft = drafts.get(work.id), url = image(work);
    return `<article class="fulfillment-work" data-work-id="${esc(work.id)}"><div class="fulfillment-work-head"><button type="button" data-preview="${esc(work.id)}" class="fulfillment-thumb" aria-label="Посмотреть ${esc(work.title || work.fileName || 'работу')}">${url ? `<img src="${url}" alt="" loading="lazy" />` : '<span>Фото</span>'}</button><div><strong>${esc(work.title || work.fileName || 'Готовая работа')}</strong><p>${work.status === 'delivered' ? 'Выдано' : 'Не выдано'}${needsCorrection(work) ? ' · На исправлении' : ''}</p>${work.deliveredAt ? `<small>Выдано ${esc(new Date(work.deliveredAt).toLocaleDateString('ru-RU'))}${work.deliveredTo ? ` · ${esc(work.deliveredTo)}` : ''}</small>` : ''}</div>${canManage ? `<button type="button" class="secondary-button compact" data-deliver-work="${esc(work.id)}">${work.status === 'delivered' ? 'Снять выдачу' : 'Выдать фото'}</button>` : ''}</div>
    ${canManage ? `<details class="fulfillment-correction" ${needsCorrection(work) || draft ? 'open' : ''}><summary>${needsCorrection(work) ? 'Замечание к этой работе' : 'Брак / изменить внешность'}</summary><form data-correction="${esc(work.id)}"><label>Причина<select class="select" name="reason">${Object.entries(CORRECTION_REASONS).map(([value,label])=>`<option value="${value}" ${(draft?.reason || correction?.reason) === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Что исправить<textarea class="input" name="comment" rows="2" maxlength="2000" required placeholder="Например: не похож на оригинал, исправить нос или руку">${esc(draft?.comment ?? (needsCorrection(work) ? correction.comment : ''))}</textarea></label><div class="fulfillment-work-actions"><button class="secondary-button compact" type="submit">Сохранить замечание</button>${needsCorrection(work) ? `<button class="secondary-button compact" type="button" data-resolve="${esc(work.id)}">Исправлено</button>` : ''}</div></form></details>` : needsCorrection(work) ? `<p>${esc(CORRECTION_REASONS[correction.reason])}: ${esc(correction.comment)}</p>` : ''}</article>`;
  }
  function updateSelection() {
    const rows = paneRows(), all = panel.querySelector('[data-select-all]');
    all.checked = !!rows.length && rows.every(row=>selected.has(row.id));
    all.indeterminate = rows.some(row=>selected.has(row.id)) && !all.checked;
    const hiddenSelected=selected.size-visible().filter(row=>selected.has(row.id)).length;
    const pickedPrice=money?fulfillmentPriceSummary(data().students.filter(s=>selected.has(s.id)),data().works,orderedItems,panel.querySelector('[data-work-status]').value):null;
    panel.querySelector('[data-selected]').textContent = `Выбрано: ${selected.size}${hiddenSelected ? ` · вне фильтра: ${hiddenSelected}` : ''}${money&&selected.size?' · К расчёту: '+rubles(pickedPrice.amount)+(pickedPrice.unpriced?' + есть услуги без цены':''):''}`;
    panel.querySelector('[data-apply]').textContent = selected.size ? `Применить к ${selected.size}` : 'Применить';
    panel.querySelector('[data-apply]').disabled = busy || !selected.size || (!canManage && !canPay);
    if(!selected.size)batchExpanded=false;
    panel.querySelector('[data-batch]').hidden = !batchExpanded || !selected.size || (!canManage && !canPay);
    panel.querySelector('.fulfillment-batch-bar').hidden=!selected.size || (!canManage&&!canPay);
    panel.querySelector('[data-batch-count]').textContent=`Выбрано: ${selected.size}${hiddenSelected?` · вне фильтра: ${hiddenSelected}`:''}`;
    panel.querySelector('[data-open-batch]').textContent=batchExpanded?'Свернуть':'Действия';
    panel.querySelector('[data-open-batch]').setAttribute('aria-expanded',String(batchExpanded));
    panel.querySelector('[data-toggle-filters]').hidden=activeList==='picked';
    const parts=splitFulfillmentList(visible(),selected);panel.querySelector('[data-remaining-count]').textContent=parts.remaining.length;panel.querySelector('[data-picked-count]').textContent=selected.size;
    panel.querySelector('[data-toggle-filters]').hidden=activeList==='picked';
    for(const button of panel.querySelectorAll('[data-sort-list]'))button.setAttribute('aria-pressed',String(button.dataset.sortList===activeList));
    panel.querySelector('[data-clear]').textContent=activeList==='picked'?'Вернуть всех':'Снять выбор';
    const message=panel.querySelector('[data-message]');message.hidden=!!selected.size&&message.textContent==='Выберите детей на карточках.';
  }
  function renderList() {
    const y = list.scrollTop;
    snapshot=getData();
    const availableIds=new Set(snapshot.students.map(student=>student.id));
    for(const id of selected)if(!availableIds.has(id))selected.delete(id);
    const rows = paneRows(), all = data().students, works = data().works;
    list.classList.toggle('is-directory',activeList==='all');
    persistSelection();
    const summaryRows=activeList==='picked'?rows:visible(),summaryIds=new Set(summaryRows.map(s=>s.id)),summaryWorks=works.filter(w=>summaryIds.has(w.studentId));
    panel.querySelector('[data-summary]').textContent = `Показано ${rows.length} из ${summaryRows.length} · Оплатили ${summaryRows.filter(s=>s.paymentStatus==='paid').length} · Выдано ${summaryRows.filter(s=>isDelivered(s,worksFor(s.id))).length}${summaryWorks.some(needsCorrection)?` · Замечания ${summaryWorks.filter(needsCorrection).length}`:''}`;
    if(money){const found=activeList==='picked'?rows:visible(),price=fulfillmentPriceSummary(found,works,activeList==='picked'?orderedItems:entriesFor,panel.querySelector('[data-work-status]').value);panel.querySelector('[data-price-summary]').textContent=`Детей: ${found.length} · Фото к расчёту: ${price.services} · Сумма: ${rubles(price.amount)}${price.unpriced?' + '+price.unpriced+' без цены':''}${price.unbound&&!serviceIds.size?' · Без привязки к заказу: '+price.unbound:''}`;panel.querySelector('[data-price-buckets]').innerHTML=price.buckets.map(bucket=>`<button type="button" data-price-bucket="${Math.round(bucket.unitPrice*100)}" aria-pressed="${panel.querySelector('[data-unit-price]')?.value===String(Math.round(bucket.unitPrice*100))}" style="border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--text);padding:6px;font-size:12px;min-height:36px" ${activeList==='picked'?'disabled':''}><strong>${esc(rubles(bucket.unitPrice))}</strong> × ${bucket.services} = ${esc(rubles(bucket.amount))}</button>`).join('')+(price.unpriced?'<span>Без цены: '+price.unpriced+' услуг · не включены в сумму</span>':'')+(panel.querySelector('[data-unit-price]')?.value?'<button type="button" data-all-prices class="secondary-button compact">Все цены</button>':'');panel.querySelectorAll('[data-price-bucket]').forEach(button=>button.onclick=()=>{panel.querySelector('[data-unit-price]').value=button.dataset.priceBucket;renderList();});panel.querySelector('[data-all-prices]')?.addEventListener('click',()=>{panel.querySelector('[data-unit-price]').value='';renderList();});}
    list.innerHTML = activeList==='all' ? rows.map(student=>`<label class="fulfillment-directory-row"><input type="checkbox" data-child="${esc(student.id)}" ${selected.has(student.id)?'checked':''} /><span><strong>${esc(name(student))}</strong><small>${esc(groupName(student.classId))} · работ: ${worksFor(student.id).length}</small></span><small class="fulfillment-directory-state">${selected.has(student.id)?'В выбранном':'Осталось'}</small></label>`).join('') || '<p class="fulfillment-empty">Дети не найдены.</p>' : rows.map(student => {const works=worksFor(student.id);return `<article class="fulfillment-child"><div class="fulfillment-child-head"><label class="fulfillment-child-select"><input type="checkbox" data-child="${esc(student.id)}" ${selected.has(student.id) ? 'checked' : ''} /><span><strong>${esc(name(student))}</strong><small>${esc(groupName(student.classId))}</small></span></label><div class="fulfillment-statuses"><span class="status-pill ${student.paymentStatus==='paid' ? 'paid' : 'unpaid'}">${esc(paymentLabel(student,money))}</span><span class="status-pill ${isDelivered(student,works) ? 'paid' : 'in-progress'}">${isDelivered(student,works) ? 'Фото выданы' : works.some(w=>w.status==='delivered') ? `Выдано ${works.filter(w=>w.status==='delivered').length} из ${works.length}` : 'Не выданы'}</span>${works.some(needsCorrection) ? '<span class="status-pill unpaid">На исправлении</span>' : ''}</div></div>${childGallery(student,works)}${money && student.paymentStatus==='paid' && student.paymentRecipient ? `<p class="fulfillment-recipient">Получатель: ${esc(student.paymentRecipient)}</p>` : ''}<details data-child-details="${esc(student.id)}" ${open.has(student.id) ? 'open' : ''}><summary>Работы · ${works.length}</summary><div class="fulfillment-works">${works.map(workRow).join('') || '<p>Готовые работы пока не добавлены.</p>'}</div></details></article>`;}).join('') || `<p class="fulfillment-empty">${activeList==='picked'?'Здесь пока пусто. Выберите детей в «Осталось» или «Весь список».':selected.size?'В этом списке больше никого не осталось. Проверьте «Выбрано» или измените фильтры.':'Дети не найдены. Измените поиск или фильтры.'}</p>`;
    list.scrollTop=y;updateSelection();
    for (const details of list.querySelectorAll('[data-child-details]')) details.ontoggle=()=>{details.open ? open.add(details.dataset.childDetails) : open.delete(details.dataset.childDetails);};
    for(const gallery of list.querySelectorAll('[data-gallery]')) {
      const track=gallery.querySelector('.fulfillment-gallery-track'), total=track.children.length;
      const update=()=>{const index=Math.max(0,Math.min(total-1,Math.round(track.scrollLeft/(track.clientWidth||1))));slidePositions.set(gallery.dataset.gallery,index);gallery.querySelector('[data-gallery-index]').textContent=`${index+1} / ${total}`;gallery.querySelector('[data-gallery-step="-1"]').disabled=index===0;gallery.querySelector('[data-gallery-step="1"]').disabled=index===total-1;};
      const step=direction=>track.scrollTo({left:Math.max(0,Math.min(total-1,(slidePositions.get(gallery.dataset.gallery)||0)+direction))*track.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      track.addEventListener('scroll',update,{passive:true});track.addEventListener('keydown',event=>{if(!event.altKey&&!event.ctrlKey&&!event.metaKey&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();step(event.key==='ArrowLeft'?-1:1);}});
      for(const button of gallery.querySelectorAll('[data-gallery-step]'))button.onclick=()=>step(Number(button.dataset.galleryStep));
      requestAnimationFrame(()=>{if(track.isConnected){track.scrollLeft=Math.min(total-1,slidePositions.get(gallery.dataset.gallery)||0)*track.clientWidth;update();}});
    }
    for (const input of list.querySelectorAll('[data-child]')) input.onchange=()=>{moveStudent(input.dataset.child,input.checked);};
    for (const button of list.querySelectorAll('[data-preview]')) button.onclick=()=>preview(button.dataset.preview,button);
    for (const button of list.querySelectorAll('[data-deliver-work]')) button.onclick=()=>run(async()=>{await saveWork(button.dataset.deliverWork,{action:'delivery'});renderList();});
    for (const button of list.querySelectorAll('[data-resolve]')) button.onclick=()=>run(async()=>{await saveWork(button.dataset.resolve,{action:'correction',resolved:true});drafts.delete(button.dataset.resolve);renderList();});
    for (const form of list.querySelectorAll('[data-correction]')) form.onsubmit=event=>{event.preventDefault();const values=new FormData(form);run(async()=>{await saveWork(form.dataset.correction,{action:'correction',reason:values.get('reason'),comment:values.get('comment')});renderList();});};
  }
  async function run(action) {
    if (busy) return;
    busy=true;panel.querySelector('[data-message]').hidden=false;panel.setAttribute('aria-busy','true');panel.querySelector('[data-message]').textContent='Сохраняем…';
    const disabledStates=new Map([...list.querySelectorAll('button')].map(button=>[button,button.disabled]));
    for (const button of disabledStates.keys()) button.disabled=true;
    updateSelection();
    try { await action();panel.querySelector('[data-message]').textContent='Сохранено на устройстве. Отправка на сервер — в панели «Сохранение».'; }
    catch(error) {panel.querySelector('[data-message]').textContent=error.message || 'Не удалось сохранить. Повторите попытку.';}
    finally {busy=false;panel.removeAttribute('aria-busy');for(const button of list.querySelectorAll('button'))if(disabledStates.has(button))button.disabled=disabledStates.get(button);updateSelection();if(closePending)finish();}
  }
  for (const type of ['input','change']) list.addEventListener(type,event=>{const form=event.target.closest('[data-correction]');if(form)drafts.set(form.dataset.correction,{reason:form.elements.reason.value,comment:form.elements.comment.value});});
  for (const selector of ['[data-search]','[data-filter]','[data-group]','[data-work-status]']) panel.querySelector(selector).addEventListener(selector==='[data-search]' ? 'input' : 'change',renderList);
  if(money){const prices=[...new Set(data().students.flatMap(student=>(orderedItems?.(student)||[]).map(e=>e.unitPrice)).filter(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0).map(n=>Math.round(n*100)))].sort((a,b)=>a-b);panel.querySelector('[data-unit-price]').insertAdjacentHTML('beforeend',prices.map(cents=>`<option value="${cents}">${esc(rubles(cents/100))}</option>`).join(''));panel.querySelector('[data-unit-price]').onchange=()=>renderList();}
  panel.querySelector('[data-services-options]').innerHTML=serviceFilterChoices(data().students,student=>orderedItems?.(student)||[]).map(item=>`<label style="display:flex;align-items:center;gap:6px;font-size:13px;min-height:32px"><input type="checkbox" data-service-filter value="${esc(item.id)}" style="width:18px;height:18px;flex:none">${esc(item.title)}</label>`).join('');
  panel.querySelectorAll('[data-service-filter]').forEach(input=>input.onchange=()=>{input.checked?serviceIds.add(input.value):serviceIds.delete(input.value);panel.querySelector('[data-services-count]').textContent=serviceIds.size?'· '+serviceIds.size:'';renderList();});
  panel.querySelector('[data-group]').insertAdjacentHTML('beforeend',data().groups.map(group=>`<option value="${esc(group.id)}">${esc(group.name)}</option>`).join(''));
  panel.querySelector('[data-select-all]').onchange=event=>{paneRows().forEach(row=>event.target.checked ? selected.add(row.id) : selected.delete(row.id));persistSelection();renderList();};
  for(const button of panel.querySelectorAll('[data-sort-list]'))button.onclick=()=>{
    paneScroll.set(activeList,list.scrollTop);paneQueries.set(activeList,panel.querySelector('[data-search]').value);
    activeList=button.dataset.sortList;panel.querySelector('[data-search]').value=paneQueries.get(activeList)||'';
    panel.querySelector('[data-search]').placeholder=activeList==='picked'?'Искать в выбранном':'Фамилия или имя';
    panel.querySelector('[data-toggle-filters]').hidden=activeList==='picked';if(activeList==='picked'){panel.querySelector('.fulfillment-filters').hidden=true;panel.querySelector('[data-toggle-filters]').setAttribute('aria-expanded','false');}
    renderList();list.scrollTop=paneScroll.get(activeList)||0;
  };
  panel.querySelector('[data-open-batch]').onclick=()=>{batchExpanded=!batchExpanded;updateSelection();};
  panel.querySelector('[data-toggle-filters]').onclick=()=>{const filters=panel.querySelector('.fulfillment-filters');filters.hidden=!filters.hidden;panel.querySelector('[data-toggle-filters]').setAttribute('aria-expanded',String(!filters.hidden));};
  panel.querySelector('[data-clear]').onclick=()=>{selected.clear();persistSelection();renderList();};
  const batch=panel.querySelector('[data-batch]');
  const actionFields=()=>{const action=batch.elements.action.value;panel.querySelector('[data-method]').hidden=!money || action!=='pay';panel.querySelector('[data-recipient]').hidden=!(money && action==='pay') && action!=='deliver';panel.querySelector('[data-recipient-label]').textContent=action==='deliver' ? 'Кому отдали фото' : 'Кому / на какой счёт';batch.elements.recipient.placeholder=action==='deliver' ? 'Например: родителю или учителю' : 'Имя получателя или банк (необязательно)';};
  batch.elements.action.onchange=actionFields;actionFields();
  batch.onsubmit=event=>{event.preventDefault();const values=new FormData(batch);if(money&&values.get('action')==='pay'&&!values.get('method')){panel.querySelector('[data-message]').textContent='Выберите способ оплаты.';batch.elements.method.focus();return;}run(async()=>{const result=await saveBatch([...selected],{action:values.get('action'),method:values.get('method'),recipient:values.get('recipient')});if(!result.errors.length)batchExpanded=false;persistSelection();renderList();if(result.errors.length) throw new Error(`Сохранено: ${result.savedIds.length}. ${result.errors.slice(0,2).join(' ') + (result.errors.length>2 ? ` Ещё ошибок: ${result.errors.length-2}.` : '')}`);});};
  const finish=()=>{if(closed)return;if(busy){closePending=true;return;}closed=true;panel.remove();for(const url of urls.values())URL.revokeObjectURL(url);onClose?.();restore?.();};
  const close=()=>{if(busy)return;history ? history.close() : finish();};
  panel.querySelector('[data-close]').onclick=close;
  panel.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
    if(event.key==='Tab') {const items=[...panel.querySelectorAll('button,input,select,textarea,summary')].filter(el=>!el.disabled&&el.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  });
  document.body.append(panel);history=mountHistory?.(finish);renderList();panel.querySelector('[data-search]').focus();
  return panel;
}

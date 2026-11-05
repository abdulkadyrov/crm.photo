export const DEFAULT_TEACHER_MESSAGE = 'Здравствуйте, {учитель}!\nПишем по поводу фотосъёмки: {школа}, класс {класс}.\nПожалуйста, передайте родителям информацию о съёмке. Спасибо!';
export function teacherPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '7' + digits;
  if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : '';
}
export function teacherMessage(template, recipient) {
  const values = {учитель: recipient.name || 'уважаемый учитель', школа: recipient.school, класс: recipient.className};
  return String(template).replace(/\{(учитель|школа|класс)\}/g, (_, key) => values[key] || '');
}
export function teacherWhatsAppUrl(phone, message) {
  const normalized = teacherPhone(phone);
  return normalized && message.trim() ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : '';
}
export function openTeacherBroadcast({recipients, draft = {}, save, restore = () => {}}) {
  const dialog = document.createElement('dialog'); dialog.className = 'cloud-dialog';
  dialog.setAttribute('aria-label', 'Рассылка учителям');
  dialog.innerHTML = `<div class="grid"><div class="card-header"><h2 class="card-title">Рассылка учителям</h2><button type="button" class="icon-button" data-close aria-label="Закрыть">×</button></div>
    <label class="field-label">Общий текст<textarea class="textarea" rows="5" data-template></textarea></label>
    <p class="muted">Подстановки: {учитель}, {школа}, {класс}. Общий текст применяется к сообщениям без индивидуальных правок.</p>
    <label class="field-label">Учитель / класс<select class="select" data-recipient></select></label>
    <p class="muted" data-phone></p>
    <label class="field-label">Сообщение этому учителю<textarea class="textarea" rows="6" data-message></textarea></label>
    <div class="row"><button type="button" class="secondary-button" data-reset>Вернуть общий текст</button><button type="button" class="secondary-button" data-copy>Скопировать</button></div>
    <div class="row"><button type="button" class="secondary-button" data-save>Сохранить черновик</button><a class="primary-button" data-whatsapp target="_blank" rel="noopener noreferrer">Открыть WhatsApp</a></div>
    <p class="muted">Открывается одно сообщение. Нажмите «Отправить» в WhatsApp самостоятельно.</p><p role="status" data-status></p></div>`;
  const template=dialog.querySelector('[data-template]'), select=dialog.querySelector('[data-recipient]'), message=dialog.querySelector('[data-message]'), link=dialog.querySelector('[data-whatsapp]'), status=dialog.querySelector('[data-status]');
  const overrides={...(draft.overrides || {})}; template.value=draft.template ?? DEFAULT_TEACHER_MESSAGE;
  for(const r of recipients) select.add(new Option(`${r.school} · ${r.className} · ${r.name || 'Учитель не указан'}`, r.id));
  const current=()=>recipients.find(r=>r.id===select.value);
  function updateLink() {
    const r=current(), url=teacherWhatsAppUrl(r?.phone, message.value);
    if(url) {link.href=url;link.removeAttribute('aria-disabled');} else {link.removeAttribute('href');link.setAttribute('aria-disabled','true');}
  }
  function render() {
    const r=current(); message.disabled=!r;
    message.value=r ? overrides[r.id] ?? teacherMessage(template.value,r) : '';
    dialog.querySelector('[data-phone]').textContent=r ? teacherPhone(r.phone) ? `Телефон: +${teacherPhone(r.phone)}` : 'В карточке класса нужно указать корректный телефон учителя.' : 'Нет классов. Добавьте класс и контакты учителя.';
    updateLink();
  }
  select.onchange=render;template.oninput=render;
  message.oninput=()=>{if(current())overrides[current().id]=message.value;updateLink();};
  dialog.querySelector('[data-reset]').onclick=()=>{if(current())delete overrides[current().id];render();};
  const persist=async()=>{await save({template:template.value,overrides});};
  dialog.querySelector('[data-save]').onclick=async()=>{try{await persist();status.textContent='Черновик сохранён.';}catch{status.textContent='Не удалось сохранить черновик.';}};
  dialog.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(message.value);status.textContent='Сообщение скопировано.';}catch{status.textContent='Выделите текст и скопируйте вручную.';}};
  link.onclick=event=>{if(!link.hasAttribute('href')){event.preventDefault();return;}status.textContent='WhatsApp открыт. CRM не может проверить, отправлено ли сообщение.';void persist().catch(()=>{status.textContent+=' Черновик не сохранён.';});};
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.onclose=()=>{dialog.remove();restore();};
  document.body.append(dialog);render();dialog.showModal();
  return dialog;
}

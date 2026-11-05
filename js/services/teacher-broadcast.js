export const DEFAULT_TEACHER_MESSAGE = 'Здравствуйте, {учитель}!\nДля класса {класс}, {школа}, готова персональная ссылка на каталог:\n{ссылка}\nПожалуйста, отправьте её родителям этого класса. Спасибо!';

export function teacherPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '7' + digits;
  if (digits.length === 11 && digits[0] === '8') digits = '7' + digits.slice(1);
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : '';
}

export function teacherMessage(template, recipient) {
  const values = {учитель: recipient.name || 'уважаемый учитель', школа: recipient.school, класс: recipient.className, ссылка: recipient.catalogUrl};
  return String(template).replace(/\{(учитель|школа|класс|ссылка)\}/g, (_, key) => values[key] || '');
}

export function teacherWhatsAppUrl(phone, message) {
  const normalized = teacherPhone(phone);
  return normalized && message.trim() ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : '';
}

export function filterTeacherRecipients(recipients, query = '') {
  const needle = String(query).trim().toLocaleLowerCase('ru-RU');
  if (!needle) return recipients;
  return recipients.filter((recipient) => [recipient.name, recipient.school, recipient.className, recipient.phone]
    .some((value) => String(value || '').toLocaleLowerCase('ru-RU').includes(needle)));
}

function recipientInitials(recipient) {
  const source = recipient.name || recipient.className || recipient.school || 'У';
  return source.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('ru-RU');
}

export function openTeacherBroadcast({recipients, draft = {}, save, restore = () => {}}) {
  const dialog = document.createElement('dialog');
  dialog.className = 'cloud-dialog teacher-broadcast-dialog';
  dialog.setAttribute('aria-label', 'Рассылка учителям');
  dialog.innerHTML = `
    <div class="teacher-broadcast-shell">
      <header class="teacher-broadcast-header">
        <div><h2>Рассылка учителям</h2><p><strong data-ready-count>0</strong> с телефоном · <span data-total-count>0</span> всего</p></div>
        <button type="button" class="icon-button" data-close aria-label="Закрыть"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </header>
      <details class="teacher-template-panel">
        <summary><span><strong>Общий текст</strong><small>Шаблон для всех классов</small></span><span class="teacher-template-edit">Изменить</span></summary>
        <div class="teacher-template-content"><textarea class="textarea" rows="7" data-template aria-label="Общий текст сообщения"></textarea><p>Можно использовать <code>{учитель}</code>, <code>{школа}</code>, <code>{класс}</code> и <code>{ссылка}</code>.</p></div>
      </details>
      <div class="teacher-broadcast-layout">
        <aside class="teacher-recipient-panel" aria-label="Учителя и классы">
          <label class="teacher-search"><span class="visually-hidden">Найти учителя или класс</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7"/></svg><input type="search" placeholder="Учитель, школа или класс" data-search /></label>
          <div class="teacher-recipient-list" role="listbox" data-recipient-list></div><p class="teacher-recipient-empty" data-empty hidden>Ничего не найдено.</p>
        </aside>
        <section class="teacher-message-panel">
          <div class="teacher-message-heading"><div><h3 data-recipient-name>Выберите класс</h3><p data-recipient-context></p></div><span class="teacher-phone-state" data-phone-state></span></div>
          <label class="field-label teacher-message-field"><span>Сообщение</span><textarea class="textarea" rows="8" data-message></textarea></label>
          <div class="teacher-message-tools"><button type="button" class="secondary-button" data-reset>Вернуть общий текст</button><button type="button" class="secondary-button" data-copy>Скопировать</button></div>
          <footer class="teacher-message-actions"><button type="button" class="secondary-button" data-save>Сохранить</button><a class="primary-button" data-whatsapp target="_blank" rel="noopener noreferrer">Открыть WhatsApp</a></footer>
          <p class="teacher-broadcast-status" role="status" aria-live="polite" data-status></p>
        </section>
      </div>
    </div>`;

  const template = dialog.querySelector('[data-template]');
  const search = dialog.querySelector('[data-search]');
  const list = dialog.querySelector('[data-recipient-list]');
  const empty = dialog.querySelector('[data-empty]');
  const message = dialog.querySelector('[data-message]');
  const link = dialog.querySelector('[data-whatsapp]');
  const status = dialog.querySelector('[data-status]');
  const overrides = {...(draft.overrides || {})};
  let activeId = recipients.some((recipient) => recipient.id === draft.lastRecipientId) ? draft.lastRecipientId : recipients[0]?.id || '';
  template.value = draft.template ?? DEFAULT_TEACHER_MESSAGE;
  dialog.querySelector('[data-ready-count]').textContent = String(recipients.filter((recipient) => teacherPhone(recipient.phone)).length);
  dialog.querySelector('[data-total-count]').textContent = String(recipients.length);
  const current = () => recipients.find((recipient) => recipient.id === activeId);

  function updateLink() {
    const url = teacherWhatsAppUrl(current()?.phone, message.value);
    if (url) { link.href = url; link.removeAttribute('aria-disabled'); }
    else { link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true'); }
  }

  function renderRecipients() {
    const visible = filterTeacherRecipients(recipients, search.value);
    list.replaceChildren(); empty.hidden = visible.length > 0;
    visible.forEach((recipient) => {
      const phone = teacherPhone(recipient.phone);
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'teacher-recipient'; button.setAttribute('role', 'option'); button.setAttribute('aria-selected', String(recipient.id === activeId));
      const avatar = document.createElement('span'); avatar.className = 'teacher-recipient-avatar'; avatar.textContent = recipientInitials(recipient);
      const copy = document.createElement('span'); copy.className = 'teacher-recipient-copy';
      const name = document.createElement('strong'); name.textContent = recipient.name || `Класс ${recipient.className}`;
      const context = document.createElement('small'); context.textContent = [recipient.school, recipient.className].filter(Boolean).join(' · '); copy.append(name, context);
      const state = document.createElement('span'); state.className = `teacher-recipient-state ${phone ? 'is-ready' : 'is-missing'}`; state.textContent = phone ? 'WhatsApp' : 'Нет телефона';
      button.append(avatar, copy, state); button.onclick = () => { activeId = recipient.id; renderRecipients(); renderMessage(); }; list.append(button);
    });
  }

  function renderMessage() {
    const recipient = current(); message.disabled = !recipient; message.value = recipient ? overrides[recipient.id] ?? teacherMessage(template.value, recipient) : '';
    dialog.querySelector('[data-recipient-name]').textContent = recipient?.name || (recipient ? `Класс ${recipient.className}` : 'Нет классов');
    dialog.querySelector('[data-recipient-context]').textContent = recipient ? [recipient.school, recipient.className].filter(Boolean).join(' · ') : 'Добавьте класс и контакты учителя.';
    const phone = teacherPhone(recipient?.phone), phoneState = dialog.querySelector('[data-phone-state]');
    phoneState.className = `teacher-phone-state ${phone ? 'is-ready' : 'is-missing'}`; phoneState.textContent = phone ? `+${phone}` : 'Добавьте телефон в карточке класса'; updateLink();
  }

  search.oninput = renderRecipients; template.oninput = renderMessage;
  message.oninput = () => { if (current()) overrides[current().id] = message.value; updateLink(); };
  dialog.querySelector('[data-reset]').onclick = () => { if (current()) delete overrides[current().id]; renderMessage(); };
  const persist = async () => save({template: template.value, overrides, lastRecipientId: activeId});
  dialog.querySelector('[data-save]').onclick = async () => { try { await persist(); status.textContent = 'Черновик сохранён.'; } catch { status.textContent = 'Не удалось сохранить. Попробуйте ещё раз.'; } };
  dialog.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(message.value); status.textContent = 'Сообщение скопировано.'; } catch { status.textContent = 'Не удалось скопировать. Выделите текст вручную.'; } };
  link.onclick = (event) => { if (!link.hasAttribute('href')) { event.preventDefault(); status.textContent = 'Сначала добавьте телефон учителя в карточке класса.'; return; } status.textContent = 'WhatsApp открыт. Отправку подтвердите в WhatsApp.'; void persist().catch(() => { status.textContent += ' Черновик не сохранён.'; }); };
  dialog.querySelector('[data-close]').onclick = () => dialog.close(); dialog.onclose = () => { dialog.remove(); restore(); };
  document.body.append(dialog); renderRecipients(); renderMessage(); dialog.showModal(); return dialog;
}

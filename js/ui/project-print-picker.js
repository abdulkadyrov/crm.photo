const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function openProjectPrintPicker({project,groups,students,works,onReview}) {
  const available = new Set(works.map(work=>work.studentId));
  const dialog=document.createElement('div');dialog.className='qr-panel-backdrop project-print-picker-backdrop';
  dialog.innerHTML=`<section class="qr-panel project-print-picker" role="dialog" aria-modal="true" aria-label="Печать проекта"><div class="cloud-head"><h2>Печать проекта</h2><button data-close type="button">Закрыть</button></div><p>${esc(project.name)}</p><div class="toolbar"><button data-all type="button" class="secondary-button compact">Весь проект</button><button data-none type="button" class="secondary-button compact">Снять выбор</button></div><p data-count role="status"></p><div class="project-print-groups">${groups.map(group=>{
    const children=students.filter(student=>student.classId===group.id);
    const ready=children.filter(student=>available.has(student.id));
    return `<details><summary><label><input type="checkbox" data-group="${esc(group.id)}" ${ready.length?'checked':'disabled'} /> ${esc(group.name)} · ${ready.length}/${children.length} с результатами</label></summary><div>${children.map(student=>`<label class="checkbox-row"><input type="checkbox" data-student="${esc(student.id)}" data-child-group="${esc(group.id)}" ${available.has(student.id)?'checked':'disabled'} /><span>${esc(`${student.lastName||''} ${student.firstName||''}`)}${available.has(student.id)?'':' — нет готовых работ'}</span></label>`).join('')}</div></details>`;
  }).join('')}</div><label class="checkbox-row"><input type="checkbox" data-separators checked /><span>Чистый белый лист перед каждой группой и после неё</span></label><p data-error role="alert"></p><button data-review class="primary-button" type="button">Проверить фото · печать / PDF</button></section>`;
  const children=[...dialog.querySelectorAll('[data-student]')];
  const selected=()=>children.filter(input=>input.checked&&!input.disabled).map(input=>input.dataset.student);
  const update=()=>{
    for(const input of dialog.querySelectorAll('[data-group]')){
      const group=children.filter(child=>child.dataset.childGroup===input.dataset.group&&!child.disabled);
      input.checked=!!group.length&&group.every(child=>child.checked);input.indeterminate=group.some(child=>child.checked)&&!input.checked;
    }
    dialog.querySelector('[data-count]').textContent=`Выбрано детей: ${selected().length}. На следующем шаге можно исключить отдельные фотографии.`;
    dialog.querySelector('[data-review]').disabled=!selected().length;
  };
  dialog.querySelectorAll('[data-group]').forEach(input=>{input.onclick=e=>e.stopPropagation();input.onchange=()=>{children.filter(child=>child.dataset.childGroup===input.dataset.group&&!child.disabled).forEach(child=>child.checked=input.checked);update();};});
  children.forEach(input=>input.onchange=update);
  for(const [selector,checked] of [['[data-all]',true],['[data-none]',false]])dialog.querySelector(selector).onclick=()=>{children.filter(input=>!input.disabled).forEach(input=>input.checked=checked);update();};
  dialog.querySelector('[data-review]').onclick=async()=>{
    const button=dialog.querySelector('[data-review]');button.disabled=true;button.textContent='Готовим выбранные фото…';
    try{await onReview({studentIds:new Set(selected()),separators:dialog.querySelector('[data-separators]').checked});}
    catch(error){dialog.querySelector('[data-error]').textContent=error.message;}
    finally{button.textContent='Проверить фото · печать / PDF';update();}
  };
  const previous=document.activeElement;
  const close=()=>{dialog.remove();previous?.focus();};dialog.querySelector('[data-close]').onclick=close;dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();close();}});
  document.body.append(dialog);update();dialog.querySelector('[data-close]').focus();return dialog;
}

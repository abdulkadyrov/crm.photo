const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function workflowChoice({name,label,value='',options=[]}) {
 const dropdown=['requestedAction','assigneeId'].includes(name),selected=options.find(o=>o.value===value)||options.find(o=>!o.disabled);
 const choices=options.map(option=>`<label class="wt-choice-option"><input type="radio" name="${esc(name)}" value="${esc(option.value)}" ${selected?.value===option.value?'checked':''} ${option.disabled?'disabled':''}><span>${esc(option.label)}</span></label>`).join('');
 return `<fieldset class="wt-choice"><legend>${esc(label)}</legend>${dropdown?`<details class="wt-action-picker"><summary aria-label="${esc(label)}: ${esc(selected?.label||'Выберите действие')}"><span data-choice-label>${esc(selected?.label||'Выберите действие')}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="wt-choice-options" role="group" aria-label="${esc(label)}">${choices}</div></details>`:`<div class="wt-choice-options">${choices}</div>`}</fieldset>`;
}
export function bindWorkflowChoices(form){
 if(!form?.querySelectorAll)return;
 const comment=form.querySelector('[name=reason]'),commentField=comment?.closest('label');
 if(commentField)commentField.hidden=false;
 const choose=input=>{
  if(!['requestedAction','assigneeId'].includes(input.name))return;
  const picker=input.closest('.wt-action-picker');if(!picker)return;
  const label=input.nextElementSibling.textContent;
  picker.querySelector('[data-choice-label]').textContent=label;
  picker.querySelector('summary').setAttribute('aria-label',`${picker.closest('fieldset').querySelector('legend').textContent}: ${label}`);
  picker.open=false;
  if(input.name==='requestedAction'&&commentField){commentField.hidden=false;comment.focus();}else picker.querySelector('summary').focus({preventScroll:true});
 };
 form.addEventListener('change',event=>choose(event.target));
 form.addEventListener('keydown',event=>{
  const open=form.querySelector('.wt-action-picker[open]');
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();open.open=false;open.querySelector('summary').focus({preventScroll:true});}
 });
 form.addEventListener('click',event=>{if(event.target.matches('input[name=requestedAction]:checked,input[name=assigneeId]:checked'))choose(event.target);for(const picker of form.querySelectorAll('.wt-action-picker[open]'))if(!picker.contains(event.target))picker.open=false;});
}

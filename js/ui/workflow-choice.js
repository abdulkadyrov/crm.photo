const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Native radios retain keyboard navigation, validation and FormData semantics.
export function workflowChoice({name,label,value='',options=[]}) {
 return `<fieldset class="wt-choice"><legend>${esc(label)}</legend><div class="wt-choice-options">${options.map(option=>`<label class="wt-choice-option"><input type="radio" name="${esc(name)}" value="${esc(option.value)}" ${value===option.value?'checked':''} ${option.disabled?'disabled':''}><span>${esc(option.label)}</span></label>`).join('')}</div></fieldset>`;
}

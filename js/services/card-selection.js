export function createCardSelection({storage, account=()=>"local"}) {
 const memory=new Map();
 const key=()=>"spf-last-card:"+encodeURIComponent(account()||"local");
 function snapshot(){
  const id=key();let selected=memory.get(id)||{};
  try {const raw=storage().getItem(id);if(raw){const value=JSON.parse(raw);if(value&&typeof value==='object'&&!Array.isArray(value))selected=Object.fromEntries(Object.entries(value).filter(([k,v])=>/^(project|group|student):/.test(k)&&typeof v==='string'));}}
  catch { /* A restricted browser still remembers this session in memory. */ }
  memory.set(id,selected);return selected;
 }
 function remember(kind,id,parent="") {
  if(!['project','group','student'].includes(kind)||!id)return;
  const selected={...snapshot(),[kind+":"+parent]:id};memory.set(key(),selected);
  try{storage().setItem(key(),JSON.stringify(selected));}catch{}
 }
 return {snapshot,remember};
}

export function paintCardSelection(root, selection, {group,student}) {
 const selected=selection.snapshot();
 for(const card of root.querySelectorAll('[data-open-project], [data-open-class], [data-open-student]')) {
  let key,id;
  if(card.dataset.openProject){key='project:';id=card.dataset.openProject;}
  else if(card.dataset.openClass){id=card.dataset.openClass;key='group:'+(group(id)?.projectId||'');}
  else {id=card.dataset.openStudent;key='student:'+(student(id)?.classId||'');}
  const active=selected[key]===id;
  card.classList.toggle('is-last-selected',active);
  if(active){card.setAttribute('data-last-selected','true');card.setAttribute('aria-description','Последняя выбранная карточка');}
  else{card.removeAttribute('data-last-selected');if(card.getAttribute('aria-description')==='Последняя выбранная карточка')card.removeAttribute('aria-description');}
 }
}

const boundCards=new WeakSet();
export function bindCardSelection(root, selection, lookup) {
 paintCardSelection(root,selection,lookup);
 for(const card of root.querySelectorAll('[data-open-project], [data-open-class], [data-open-student]')) {
  if(boundCards.has(card))continue;
  boundCards.add(card);
  card.addEventListener('click',()=>{
   if(card.dataset.openProject)selection.remember('project',card.dataset.openProject);
   else if(card.dataset.openClass){const g=lookup.group(card.dataset.openClass);if(g){selection.remember('group',g.id,g.projectId);selection.remember('project',g.projectId);}}
   else {const s=lookup.student(card.dataset.openStudent),g=s&&lookup.group(s.classId);if(s)selection.remember('student',s.id,s.classId);if(g){selection.remember('group',g.id,g.projectId);selection.remember('project',g.projectId);}}
   paintCardSelection(root,selection,lookup);
  },true);
 }
}

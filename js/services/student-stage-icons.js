const icons={shot:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="m8 6 2-3h4l2 3"/><circle cx="12" cy="13" r="4"/>',generated:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',printed:'<path d="M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6z"/><path d="M17 11h1"/>',delivered:'<path d="M3 4h12v13H3zM15 9h4l3 4v4h-7"/><circle cx="7" cy="18" r="3"/><circle cx="18" cy="18" r="3"/>'};
export function studentStages({student,works=[],services=[],photoCount=0,manualStatus=''}) {
  const ids=[...new Set(services.map(service=>String(service.id||service.serviceId)).filter(id=>id&&id!=='undefined'))];
  const relevant=ids.length?works.filter(work=>ids.includes(String(work.serviceId))):works;
  const expected=ids.length||new Set(relevant.map(work=>work.serviceId||work.id)).size;
  const count=status=>new Set(relevant.filter(work=>status(work)).map(work=>work.serviceId||work.id)).size;
  const generated=count(work=>!work.status||['ready','printed','delivered'].includes(work.status));
  const printed=count(work=>['printed','delivered'].includes(work.status));
  const delivered=count(work=>work.status==='delivered');
  const state=(done,total)=>done&&done>=total?'done':done?'partial':'pending';
  return [{key:'shot',label:'Снято',state:photoCount?'done':'pending'},
    {key:'generated',label:'Сгенерировано',state:state(generated,expected),detail:`${generated}/${expected}`},
    {key:'printed',label:'Распечатано',state:['printed','delivered'].includes(manualStatus)?'done':state(printed,expected),detail:`${printed}/${expected}`},
    {key:'paid',label:'Оплачено',state:student.paymentStatus==='paid'?'done':'pending'},
    {key:'delivered',label:'Выдано',state:manualStatus==='delivered'?'done':state(delivered,expected),detail:`${delivered}/${expected}`}];
}
export function renderStudentStageIcons(input) {
  return studentStages(input).map(stage=>{const label=`${stage.label}: ${stage.state==='done'?'готово':stage.state==='partial'?'частично':'ещё нет'}${stage.detail?' · '+stage.detail:''}`;return `<button type="button" data-student-quick="${input.student.id||''}" data-quick-action="${stage.key}" class="student-stage-icon is-${stage.state}" aria-label="${label}" title="${label}">${stage.key==='paid'?'<b aria-hidden="true">₽</b>':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[stage.key]}</svg>`}</button>`;}).join('');
}

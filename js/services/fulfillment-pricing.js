export function fulfillmentUnitPrice(student,serviceId,catalogPrice){
 const saved=student?.parentPrices?.[serviceId]?.price;if(typeof saved==='number'&&Number.isFinite(saved)&&saved>=0)return saved;
 if(typeof catalogPrice==='number')return Number.isFinite(catalogPrice)&&catalogPrice>=0?catalogPrice:undefined;
 const text=String(catalogPrice??'').replace(/\s+/g,'').replace(',','.');if(text.startsWith('-'))return undefined;const match=text.match(/\d+(?:\.\d+)?/);return match?Number(match[0]):undefined;
}
const accepted=w=>w&&w.correction?.status!=='open'&&(!w.status||['ready','printed','delivered'].includes(w.status));
const printed=w=>accepted(w)&&['printed','delivered'].includes(w.status);
export const fulfillmentStatusOptions={printed:'Есть распечатанные',printed_all:'Полностью напечатаны',printed_partial:'Частично напечатаны',generated:'Есть готовые результаты',unprinted:'Нет распечатанных',delivered:'Есть выданные',all:'Все статусы'};
// Billing is one child + service, irrespective of duplicate files, order entries or copies.
export function fulfillmentPositions(student,works=[],entries=[]){
 const unique=new Map();for(const entry of entries)if(entry.serviceId&&!unique.has(String(entry.serviceId)))unique.set(String(entry.serviceId),entry);
 return [...unique].map(([serviceId,entry])=>{
  const candidates=works.filter(w=>String(w.serviceId)===serviceId),valid=candidates.filter(accepted);
  const unit=entry.unitPrice,known=typeof unit==='number'&&Number.isFinite(unit)&&unit>=0;
  return {serviceId,known,unitPrice:known?Math.round(unit*100)/100:0,generated:valid.length>0,printed:valid.some(printed),delivered:valid.some(w=>w.status==='delivered')};
 });
}
export function matchesFulfillmentStatus(student,works,entries,status='printed'){
 let positions=fulfillmentPositions(student,works,entries);
 if(!positions.length)positions=[...new Set(works.map(w=>w.serviceId||w.id))].map(id=>{const rows=works.filter(w=>(w.serviceId||w.id)===id&&accepted(w));return {generated:rows.length>0,printed:rows.some(printed),delivered:rows.some(w=>w.status==='delivered')};});
 const n=positions.filter(p=>p.printed).length;
 if(status==='printed')return n>0;
 if(status==='printed_all')return n>0&&n===positions.length;
 if(status==='printed_partial')return n>0&&n<positions.length;
 if(status==='unprinted')return n===0;
 if(status==='generated')return positions.some(p=>p.generated);
 if(status==='delivered')return positions.some(p=>p.delivered);
 return true;
}
const billable=(p,status)=>status==='delivered'?p.delivered:status==='unprinted'?p.generated&&!p.printed:status==='generated'||status==='all'?p.generated:p.printed;
export function fulfillmentPriceSummary(students,works,orderedItems=()=>[],status='printed'){
 const total={amount:0,services:0,printedAmount:0,printedServices:0,unpriced:0,printedUnpriced:0,excluded:0,unbound:0,buckets:[]},buckets=new Map(),seen=new Set();
 for(const student of students){if(seen.has(student.id))continue;seen.add(student.id);const childWorks=works.filter(w=>w.studentId===student.id),positions=fulfillmentPositions(student,childWorks,orderedItems(student)||[]);
  for(const p of positions){if(p.printed){total.printedServices++;total.printedAmount+=p.unitPrice;if(!p.known)total.printedUnpriced++;}
   if(!billable(p,status)){total.excluded++;continue;}total.services++;if(!p.known){total.unpriced++;continue;}
   total.amount+=p.unitPrice;const cents=Math.round(p.unitPrice*100),bucket=buckets.get(cents)||{unitPrice:p.unitPrice,services:0,amount:0};bucket.services++;bucket.amount=Math.round(cents*bucket.services)/100;buckets.set(cents,bucket);
  }
  total.unbound+=new Set(childWorks.filter(w=>accepted(w)&&!positions.some(p=>p.serviceId===String(w.serviceId))).map(w=>w.serviceId||w.id)).size;
 }
 total.amount=Math.round(total.amount*100)/100;total.printedAmount=Math.round(total.printedAmount*100)/100;total.buckets=[...buckets.values()].sort((a,b)=>a.unitPrice-b.unitPrice);return total;
}

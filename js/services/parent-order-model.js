export function incomingOrderState(currentIds, incoming, appliedIds=[]) {
 if(appliedIds.includes(incoming.id))return 'applied';
 const selected=incoming.selected_items.map(i=>i.id);
 if(!currentIds.length)return 'new';
 return currentIds.length===selected.length&&currentIds.every(id=>selected.includes(id))?'matching':'conflict';
}
export function parseChildrenList(value,existingNames=[]) {
 const normalize=v=>v.trim().replace(/\s+/g,' ').toLocaleLowerCase('ru');
 let rows;
 if(value.trim().startsWith('[')) {
  const input=JSON.parse(value);if(!Array.isArray(input))throw new Error('Нужен JSON-массив детей');
  rows=input.map(v=>typeof v==='string'?v:v&&typeof v.firstName==='string'&&typeof v.lastName==='string'?`${v.lastName} ${v.firstName}`:'');
 } else rows=value.split(/\r?\n/).map(v=>v.replace(/^\s*\d+[.)]\s*/,''));
 const seen=new Set(existingNames.map(normalize));const added=[],duplicates=[],invalid=[];
 for(const row of rows){const name=String(row).trim().replace(/\s+/g,' ');if(!name)continue;if(name.length>200||name.split(' ').length<2){invalid.push(name);continue;}if(seen.has(normalize(name))){duplicates.push(name);continue;}seen.add(normalize(name));added.push(name);}
 if(added.length>1000)throw new Error('За один раз можно добавить не больше 1000 детей');
 return {added,duplicates,invalid};
}
export function parentUnitPrice(student,serviceId,fallback) {
 const saved=student?.parentPrices?.[serviceId]?.price;
 return Number.isFinite(saved)&&saved>=0?saved:fallback;
}

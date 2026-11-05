import { prepareMonitorImage, monitorLineCanvas } from './monitor-image.js';
const nameWord = /(?<![А-ЯЁа-яё])[А-ЯЁ][а-яё]+(?:[-:‑–][А-ЯЁа-яё][а-яё]+)*(?![А-ЯЁа-яё:‑–-])/gu;
export function monitorLineText(text) {
  const words = [...text.matchAll(nameWord)].map(match => match[0].replace(/[:‑–]/g, '-'));
  // Row numbers and UI icons are not name tokens. Keep the visible spelling.
  const prefix = text.split(/[А-ЯЁа-яё]/u)[0];
  const number = prefix.match(/\d{1,3}/)?.[0];
  return {words: words.slice(0, 2), number: number ? Number(number) : null};
}
export function assembleMonitorRows(lines, source) {
  const rows = []; let pending = null;
  for (const line of lines) {
    const primary = monitorLineText(line.variants[0]?.text || '');
    const alternatives = line.variants.slice(1).map(v => monitorLineText(v.text));
    const parsed = primary.words.length === 2 ? primary : alternatives.find(item => item.words.length === 2) || (primary.words.length ? primary : alternatives.find(item => item.words.length) || primary);
    const matching = [primary, ...alternatives].filter(item => item.words.join(' ') === parsed.words.join(' '));
    const numberVotes = new Map();
    matching.forEach(item => { if (item.number !== null) numberVotes.set(item.number, (numberVotes.get(item.number) || 0) + 1); });
    const voted = [...numberVotes].sort((a,b) => b[1]-a[1])[0];
    const number = parsed.number ?? (voted?.[1] >= 2 ? voted[0] : null);
    if (!parsed.words.length) continue;
    // A solitary low-confidence word in a toolbar must not become a child's name.
    if (parsed.words.length === 1 && matching.length < 2 && (parsed !== primary || (line.variants[0]?.confidence || 0) < 40)) { pending = null; continue; }
    if (parsed.words.length === 2) {
      rows.push({name:parsed.words.join(' '),number,source}); pending = null;
    } else if (pending && number === null && line.top - pending.bottom < Math.max(24, pending.height * 1.5)) {
      rows.push({name:`${pending.word} ${parsed.words[0]}`,number:pending.number,source});pending=null;
    } else pending={word:parsed.words[0],number,bottom:line.bottom,height:line.bottom-line.top};
  }
  // Infer a damaged numeral only when several other rows establish one sequence.
  // Never infer names, missing people, or the expected class size.
  const offsets=new Map();
  rows.forEach((row,index)=>{if(row.number!==null&&row.number>0){const offset=row.number-index;offsets.set(offset,(offsets.get(offset)||0)+1);}});
  const ranked=[...offsets].sort((a,b)=>b[1]-a[1]);
  if(ranked[0] && ranked[0][0]>0 && ranked[0][1]>=Math.max(3,Math.ceil(rows.length*.6)) && ranked.length===1) {
    const offset=ranked[0][0];
    rows.forEach((row,index)=>{if(row.number===null){row.originalNumber=row.number;row.number=index+offset;row.numberInferred=true;}});
  }
  return rows;
}
export async function recognizeMonitorPhoto(file,crop,worker,{source,onProgress,isCancelled}) {
  const prepared=await prepareMonitorImage(file,crop);
  const lines=[];
  await worker.setParameters({tessedit_pageseg_mode:'7',thresholding_method:'0'});
  // Wide screen fonts are read at a normalized width; other widths recover damaged numerals.
  for(const [index,band] of prepared.bands.entries()) {
    if(isCancelled()) return null;
    const variants=[];
    for(const ratio of [.5,.75,1]) {
      if(isCancelled()) return null;
      const {data}=await worker.recognize(monitorLineCanvas(prepared.canvas,band,ratio));
      variants.push({text:data.text,confidence:data.confidence});
    }
    lines.push({...band,variants});onProgress(index+1,prepared.bands.length);
  }
  return {rows:assembleMonitorRows(lines,source),text:lines.map(line=>line.variants.map(v=>v.text.trim()).filter(Boolean).join(' / ')).filter(Boolean).join('\n'),angle:prepared.angle,lines};
}

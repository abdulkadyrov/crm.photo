import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPhotoNames, mergePhotoNames, appendPhotoNames} from '../../js/services/roster-photo-parser.js';
test('photo extraction keeps compound names and drops patronymics, dates and headers', () => {
 const rows = extractPhotoNames('ФИО\n1. Басаев Турпал-Али Алиевич 12.04.2019\n2 Лом-Алиев Юсуф Исламович\nДата рождения\n13.05.2018\nУчитель: Алиев Али', 'a');
 assert.deepEqual(rows.map(r=>r.name), ['Басаев Турпал-Али','Лом-Алиев Юсуф']);
 assert.deepEqual(rows.map(r=>r.number), [1,2]);
});
test('photo extraction joins wrapped surname and first name', () => {
 assert.deepEqual(extractPhotoNames('7 Доутмерзаева\nХадижат').map(r=>[r.name,r.number]), [['Доутмерзаева Хадижат',7]]);
});
test('overlapping photos merge only identical row numbers and names from different photos', () => {
 const pages = ['1 Алиев Али\n2 Алиев Али', '2 Алиев Али\n3 Вахаева Амина'].map((text,i)=>({source:String(i),rows:extractPhotoNames(text,String(i))}));
 const result = mergePhotoNames(pages);
 assert.equal(result.overlaps,1);assert.equal(result.rows.length,3);
 assert.match(result.warnings.join(),/Повтор имени/);
});
test('conflicting numbers and missing rows remain visible for review', () => {
 const result = mergePhotoNames(['1 Алиев Али\n3 Вахаева Амина','3 Рашидов Умар'].map((text,i)=>({source:String(i),rows:extractPhotoNames(text,String(i))})));
 assert.equal(result.rows.length,3); assert.match(result.warnings.join(),/разные имена/); assert.match(result.warnings.join(),/Не найдены номера: 2/);
});
test('unnumbered namesakes are never silently deduplicated', () => {
 const rows=extractPhotoNames('Алиев Али');const result=mergePhotoNames([{source:'a',rows},{source:'b',rows}]);
 assert.equal(result.rows.length,2);
});
test('photo import preserves existing students and namesakes and is repeat-safe', () => {
 const old=['Алиев Али','Алиев Али','Старый Ученик'];
 const incoming=['Алиев Али','Новый Ученик'];
 const result=appendPhotoNames(old,incoming);
 assert.deepEqual(result,[...old,'Новый Ученик']);
 assert.deepEqual(appendPhotoNames(result,incoming),result);
 assert.deepEqual(appendPhotoNames(['Алиев Али'],['Алиев Али','Алиев Али']),['Алиев Али','Алиев Али']);
});
test('separate row numbers survive OCR line breaks and complete numbered pages sort', () => {
 const result=mergePhotoNames(['3\nВахаева Амина','1\nАлиев Али\n2\nРашидов Умар'].map((text,i)=>({source:String(i),rows:extractPhotoNames(text,String(i))})));
 assert.deepEqual(result.rows.map(row=>row.number),[1,2,3]);
});
test('unknown row numbers warn that completeness cannot be determined', () => {
 assert.match(mergePhotoNames([{source:'a',rows:extractPhotoNames('Алиев Али')}]).warnings.join(),/полноту/);
});

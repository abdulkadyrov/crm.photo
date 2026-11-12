import test from 'node:test';
import assert from 'node:assert/strict';
import { retainedIndividualItems } from '../../js/services/individual-order.js';
test('individual transfers survive without photos and retain comments and optional video references', () => {
 const items = [
  {id:'text', title:'Индивидуальный заказ', requestType:'catalog', comment:'Особый фон'},
  {id:'photo', requestType:'custom', referenceMediaId:'image-1', fileIds:['original']},
  {id:'video', label:'Оживление', parentVideoMediaId:'video-1', comment:'Своё видео'},
  {id:'ordinary', label:'Портрет'}
 ];
 const result = retainedIndividualItems(items);
 assert.deepEqual(result.map(item=>item.id), ['text','photo','video']);
 assert.equal(result[0].comment, 'Особый фон');
 assert.deepEqual(result[0].fileIds, []);
 assert.equal(result[1].referenceMediaId, 'image-1');
 assert.equal(result[2].parentVideoMediaId, 'video-1');
 assert.equal(items[0].requestType, 'catalog');
});

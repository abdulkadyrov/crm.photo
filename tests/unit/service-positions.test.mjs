import test from 'node:test';
import assert from 'node:assert/strict';
import {servicePositions,duplicatePosition} from '../../js/services/service-positions.js';
import {cardSummary} from '../../js/services/card-summary.js';
test('separate positions retain independent photos, copies and comments through normalization',()=>{
 const legacy={serviceId:'print',quantity:8,comment:'Ламинация',mediaIds:['photo1']};
 const first=servicePositions(['print'],[legacy])[0];
 const second=duplicatePosition(first,'second');
 second.mediaIds=['photo2'];second.comment='Другое фото';
 const result=servicePositions(['print'],[first,second]);
 assert.equal(result.length,2); assert.equal(result[0].quantity,8);assert.equal(result[1].quantity,1);
 assert.deepEqual(result.map(item=>item.mediaIds),[['photo1'],['photo2']]);
 assert.equal(result[0].comment,'Ламинация');assert.equal(result[1].comment,'Другое фото');
 assert.deepEqual(servicePositions(['print'],result),result);
 assert.equal(cardSummary([{id:'student',selectedServices:result}],[]).orders,2);
 assert.deepEqual(legacy.mediaIds,['photo1']);
});

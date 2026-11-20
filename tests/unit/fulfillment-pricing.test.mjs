import test from 'node:test';import assert from 'node:assert/strict';
import {fulfillmentPriceSummary,matchesFulfillmentStatus,fulfillmentUnitPrice} from '../../js/services/fulfillment-pricing.js';
import {serviceFilterChoices,filterServiceEntries,matchesServiceFilter} from '../../js/services/service-filter.js';
const students=[{id:'a'},{id:'b'},{id:'c'}];
const items={a:[{serviceId:'wolf',unitPrice:350,quantity:7},{serviceId:'wolf',unitPrice:350,entryId:'duplicate'},{serviceId:'tower',unitPrice:800}],b:[{serviceId:'princess',unitPrice:1200},{serviceId:'tower',unitPrice:800}],c:[{serviceId:'wolf',unitPrice:350}]};
const works=[{id:'one',studentId:'a',serviceId:'wolf',status:'printed'},{id:'duplicate',studentId:'a',serviceId:'wolf',status:'printed'},{id:'two',studentId:'a',serviceId:'tower',status:'ready'},{id:'three',studentId:'b',serviceId:'princess',status:'delivered'}];
const ordered=s=>items[s.id];
test('one child/service is charged once; separate services count separately; unfinished orders never count',()=>{
 const printed=fulfillmentPriceSummary(students,works,ordered,'printed');assert.equal(printed.services,2);assert.equal(printed.amount,1550);assert.deepEqual(printed.buckets.map(b=>[b.unitPrice,b.services,b.amount]),[[350,1,350],[1200,1,1200]]);
 const ready=fulfillmentPriceSummary(students,works,ordered,'generated');assert.equal(ready.services,3);assert.equal(ready.amount,2350);assert.equal(ready.buckets.find(b=>b.unitPrice===800).services,1);
 assert.equal(fulfillmentPriceSummary(students,works,ordered,'delivered').amount,1200);
});
test('partial printing is based on unique ordered services and can combine with a chosen service',()=>{
 assert.equal(matchesFulfillmentStatus(students[0],works.filter(w=>w.studentId==='a'),ordered(students[0]),'printed_partial'),true);
 assert.equal(matchesFulfillmentStatus(students[0],works.filter(w=>w.studentId==='a'),ordered(students[0]),'printed_all'),false);
 const tower=s=>filterServiceEntries(ordered(s),['tower']);assert.equal(fulfillmentPriceSummary(students,works,tower,'printed').amount,0);assert.equal(fulfillmentPriceSummary(students,works,tower,'generated').amount,800);
});
test('open corrections and unknown prices are excluded rather than guessed',()=>{
 const w=[{studentId:'a',serviceId:'wolf',status:'printed',correction:{status:'open'}},{studentId:'a',serviceId:'tower',status:'printed'}];
 const total=fulfillmentPriceSummary([students[0]],w,()=>[{serviceId:'wolf',unitPrice:350},{serviceId:'tower'}]);assert.equal(total.amount,0);assert.equal(total.services,1);assert.equal(total.unpriced,1);
});
test('service checkboxes match any chosen service and build distinct named options',()=>{
 assert.equal(matchesServiceFilter(items.a,['tower','princess']),true);assert.equal(matchesServiceFilter(items.c,['tower']),false);
 assert.deepEqual(serviceFilterChoices(students,ordered).map(v=>v.id).sort(),['princess','tower','wolf']);
});

test('saved parent prices override catalog while missing prices stay unknown',()=>{assert.equal(fulfillmentUnitPrice({parentPrices:{wolf:{price:350}}},'wolf',800),350);assert.equal(fulfillmentUnitPrice({},'wolf','1 200 ₽'),1200);assert.equal(fulfillmentUnitPrice({},'wolf',undefined),undefined);assert.equal(fulfillmentUnitPrice({},'wolf',0),0);});

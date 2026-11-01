import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseChildrenList,incomingOrderState,parentUnitPrice} from '../../js/services/parent-order-model.js';
test('roster import reviews duplicates and incomplete names, supports OCR numbers and JSON',()=>{
 assert.deepEqual(parseChildrenList('1. Иванов Иван\n2. Петрова Анна\nИванов   Иван\nАнна',['Петрова Анна']),{added:['Иванов Иван'],duplicates:['Петрова Анна','Иванов Иван'],invalid:['Анна']});
 assert.deepEqual(parseChildrenList('[{"firstName":"Иван","lastName":"Иванов"}]').added,['Иванов Иван']);
});
test('incoming parent order never silently replaces conflicting selections or re-applies receipt',()=>{
 const order={id:'o1',selected_items:[{id:'s1'}]};
 assert.equal(incomingOrderState([],order),'new');
 assert.equal(incomingOrderState(['s1'],order),'matching');
 assert.equal(incomingOrderState(['s2'],order),'conflict');
 assert.equal(incomingOrderState(['s2'],order,['o1']),'applied');
});

test('accepted price stays fixed when catalog changes, including free services',()=>{
 assert.equal(parentUnitPrice({parentPrices:{a:{price:750}}},'a',999),750);
 assert.equal(parentUnitPrice({parentPrices:{a:{price:0}}},'a',999),0);
 assert.equal(parentUnitPrice({},'a',999),999);
});

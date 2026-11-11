import test from 'node:test';
import assert from 'node:assert/strict';
import {nextInSequence} from '../../js/services/sequence-navigation.js';
test('next follows supplied display order rather than sorting identifiers',()=>{
 const rows=[{id:'c9'},{id:'c2'},{id:'c4'}];assert.equal(nextInSequence(rows,'c9'),rows[1]);assert.equal(nextInSequence(rows,'c2'),rows[2]);
});
test('last, deleted and empty entries do not wrap to another scope',()=>{
 assert.equal(nextInSequence([{id:'last'}],'last'),null);assert.equal(nextInSequence([{id:'other'}],'deleted'),null);assert.equal(nextInSequence([],'none'),null);
});
test('previous follows display order and stops at the first entry',()=>{
 const rows=[{id:'b'},{id:'a'},{id:'c'}];
 assert.equal(nextInSequence(rows,'a',-1),rows[0]);
 assert.equal(nextInSequence(rows,'c',-1),rows[1]);
 assert.equal(nextInSequence(rows,'b',-1),null);
 assert.equal(nextInSequence(rows,'deleted',-1),null);
});

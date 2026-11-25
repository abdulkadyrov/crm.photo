import test from 'node:test';
import assert from 'node:assert/strict';
import {PORTRAIT_IDENTITY_POLICY as rules,LEGACY_PORTRAIT_IDENTITY_POLICY as old,withPortraitIdentityPolicy as wrap} from '../../js/services/portrait-identity-policy.js';
test('all generation prompts receive the same rule',()=>{assert.equal(wrap(''), '');assert(wrap('сцена').startsWith(rules));assert(wrap('сцена').endsWith('сцена'));});
test('saved old policy is upgraded rather than contradicting the new policy',()=>{const p=wrap(old+'\n\nсцена');assert(!p.includes(old));assert(p.endsWith('сцена'));});
test('repeated copying never duplicates the rule',()=>{assert.equal(wrap(wrap('сцена')),wrap('сцена'));});
test('rule covers every required constraint',()=>{for(const text of ['прыщи','синяки под глазами','порезы','царапины','косы','пышные волосы','хиджаб','соотношение сторон','разрешение','пять','возраст','веснушками'])assert(rules.includes(text),text);});

test("similarity approval requires a current measured score of at least 75 percent",()=>{assert(rules.includes("75% или выше"));assert(rules.includes("Не придумывай процент"));assert(rules.includes("текущей версии изображения"));});

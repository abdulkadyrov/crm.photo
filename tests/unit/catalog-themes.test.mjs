import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesCatalogTheme, catalogServiceGender} from '../../js/services/catalog-themes.js';
test('theme filters work across photo and video categories',()=>{
 for(const [name,theme] of [['Рапунцель','Принцессы'],['Принцесса — ИИ-видео','Принцессы'],['Чеченский джигит','Вайнах'],['Железный человек 2','Супергерои'],['Спецназ','Бойцы']]) {
  assert(matchesCatalogTheme({name,category:'Фото'},theme));
 }
 assert(!matchesCatalogTheme({name:'Общее фото класса'},'Бойцы'));
 assert(!matchesCatalogTheme({name:'Юная наездница',tags:['платок']},'Вайнах'));
});

test('female Vainakh templates match even after renaming', () => {
 assert(matchesCatalogTheme({id: 'child-girl-chechen-mosque-garden', name: 'Наряд'}, 'Вайнах'));
});

test('gender aliases and template identities remain consistent', () => {
 assert.equal(catalogServiceGender({gender:'girl'}), 'girls');
 assert.equal(catalogServiceGender({gender:'boy'}), 'boys');
 assert.equal(catalogServiceGender({id:'child-girl-chechen-stone-tower',gender:'boys'}), 'girls');
 assert.equal(catalogServiceGender({id:'child-boy-chechen-dzhigit',gender:'girls'}), 'boys');
});

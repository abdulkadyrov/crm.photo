import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesCatalogTheme} from '../../js/services/catalog-themes.js';
test('theme filters work across photo and video categories',()=>{
 for(const [name,theme] of [['Рапунцель','Принцессы'],['Принцесса — ИИ-видео','Принцессы'],['Чеченский джигит','Вайнах'],['Железный человек 2','Супергерои'],['Спецназ','Бойцы']]) {
  assert(matchesCatalogTheme({name,category:'Фото'},theme));
 }
 assert(!matchesCatalogTheme({name:'Общее фото класса'},'Бойцы'));
 assert(!matchesCatalogTheme({name:'Юная наездница',tags:['платок']},'Вайнах'));
});

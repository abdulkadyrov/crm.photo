import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../js/core/legacy-app.js', import.meta.url), 'utf8');
const renderer = source.slice(source.indexOf('function selectedServiceSettingsCard('), source.indexOf('\nfunction servicePickerCatalogCard('));
const context = vm.createContext({
  escapeAttr: String, escapeHtml: String, parseMoney: Number,
  formatMoney: String, miniCatalogPreview: () => '', serviceName: item => item.name,
  studentById: () => ({}), studentServiceComment: () => '', studentServiceQuantity: () => 1,
});
vm.runInContext(renderer, context);
test('service settings are expanded in the initial markup after an inline edit', () => {
  const item = {id:'service',name:'Печать',price:350};
  const entry = {entryId:'position-2',quantity:2,comment:'Ламинация',mediaIds:[]};
  const html = context.selectedServiceSettingsCard(item,'student',entry,true);
  assert.match(html, /data-position-state="position-2" open>/);
  assert.match(html, /Ламинация/);
  assert.match(html, /700/);
  assert.doesNotMatch(context.selectedServiceSettingsCard(item,'student',entry,false), /data-position-state="position-2" open>/);
});

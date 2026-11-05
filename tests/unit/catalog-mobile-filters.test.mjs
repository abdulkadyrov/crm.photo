import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('mobile catalog category chips keep their labels and scroll horizontally', async()=>{
  const css = await readFile(new URL('styles.css', root), 'utf8');
  assert.match(css, /\.catalog-floating-filters \.catalog-tabs[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.catalog-floating-filters \.catalog-tabs \.chip[^}]*flex:\s*0 0 auto[^}]*max-width:\s*none[^}]*white-space:\s*nowrap[^}]*overflow-wrap:\s*normal/s);
});

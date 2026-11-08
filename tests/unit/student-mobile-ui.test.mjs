import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('mobile student UI puts service selection first and moves editing controls below media', async()=>{
  const [app, css] = await Promise.all([
    readFile(new URL('js/core/legacy-app.js', root), 'utf8'),
    readFile(new URL('styles.css', root), 'utf8')
  ]);
  assert.doesNotMatch(app, /class="media-actions-menu"/);
  assert.match(app, /data-delete-inline-media/);
  assert.match(app, /onDelete: \(\) => deleteMedia\(mediaId\)/);
  assert.match(app, /data-set-order-status=/);
  assert.match(css, /\.student-detail-main\s*,\s*\.student-order-column\s*\{\s*display:\s*contents/);
  assert.match(css, /\.student-order-summary-panel\s*\{\s*order:\s*1/);
  assert.match(css, /\.student-overview-card\s*\{\s*order:\s*2/);
  assert.match(css, /\.student-order-controls-panel\s*\{\s*order:\s*6/);
  assert.match(app, /student-order-summary-panel[\s\S]*data-student-detail-section="overview"/);
  assert.match(app, /student-order-controls-panel[\s\S]*data-student-detail-section="order"/);
  const orderSetup = app.match(/student-order-summary-panel[\s\S]*?<\/aside>/)?.[0] || '';
  const orderControls = app.match(/student-order-controls-panel[\s\S]*?<\/aside>/)?.[0] || '';
  assert.doesNotMatch(orderSetup, /data-open-montage|data-edit-student/);
  assert.match(orderControls, /data-open-montage/);
  assert.match(orderControls, /data-edit-student/);
  assert.match(app, /const primaryCatalogId = selectedCatalogIds\[0\] \|\| ""/);
  assert.match(app, /const nextItems = selectedCatalogIds\.length \? orderItemsFromCatalogs\([\s\S]*?\) : \[\]/);
  assert.doesNotMatch(app, /if \(!selectedCatalogIds\.length\) return notify\("Выберите хотя бы одну услугу\."\)/);
  assert.match(app, /await updateStudentServices\(studentId, selectedCatalogIdsForStudent\(student\)\.filter/);
  assert.doesNotMatch(css, /\.student-status-options\s*\{\s*grid-template-columns:repeat\(2/);
  assert.match(css, /\.project-button-row\s*\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.project-button-row \[data-add-class\]\s*\{\s*min-height:56px/);
  assert.match(css, /\.project-button-row \.equal-button\s*\{[\s\S]*?border-radius:\s*999px;[\s\S]*?white-space:\s*normal/);
  assert.match(css, /\.project-button-row\s*\{\s*width:100%;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:8px/);
});

test('student order explains imported individual parent requests and opens their screenshot', async()=>{
  const [app, css] = await Promise.all([
    readFile(new URL('js/core/legacy-app.js', root), 'utf8'),
    readFile(new URL('styles.css', root), 'utf8')
  ]);
  assert.match(app, /function renderParentRequest\(order\)/);
  assert.match(app, /Индивидуальная заявка/);
  assert.match(app, /Пример из каталога:/);
  assert.match(app, /Открыть скрин/);
  assert.match(app, /item\.referenceMediaId \? mediaById/);
  assert.match(css, /\.parent-request-summary\s*\{/);
  assert.match(css, /\.parent-request-item\s*\{[\s\S]*grid-template-columns:\s*74px minmax\(0, 1fr\)/);
});

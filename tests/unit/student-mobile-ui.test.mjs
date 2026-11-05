import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('mobile student UI keeps order setup near overview and moves controls below media', async()=>{
  const [app, css] = await Promise.all([
    readFile(new URL('js/core/legacy-app.js', root), 'utf8'),
    readFile(new URL('styles.css', root), 'utf8')
  ]);
  assert.doesNotMatch(app, /class="media-actions-menu"/);
  assert.match(app, /data-delete-inline-media/);
  assert.match(app, /onDelete: \(\) => deleteMedia\(mediaId\)/);
  assert.match(app, /data-set-order-status=/);
  assert.match(css, /\.student-detail-main\s*,\s*\.student-order-column\s*\{\s*display:\s*contents/);
  assert.match(css, /\.student-overview-card\s*\{\s*order:\s*1/);
  assert.match(css, /\.student-order-summary-panel\s*\{\s*order:\s*2/);
  assert.match(css, /\.student-order-controls-panel\s*\{\s*order:\s*6/);
  assert.match(app, /student-order-summary-panel[\s\S]*data-student-detail-section="overview"/);
  assert.match(app, /student-order-controls-panel[\s\S]*data-student-detail-section="order"/);
  assert.doesNotMatch(css, /\.student-status-options\s*\{\s*grid-template-columns:repeat\(2/);
  assert.match(css, /\.project-button-row\s*\{\s*grid-template-columns:\s*minmax\(0,1fr\)/);
});

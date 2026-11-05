import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);

test('mobile student UI keeps order near the overview and destructive media actions out of thumbnails', async()=>{
  const [app, css] = await Promise.all([
    readFile(new URL('js/core/legacy-app.js', root), 'utf8'),
    readFile(new URL('styles.css', root), 'utf8')
  ]);
  assert.match(app, /class="media-actions-menu"/);
  assert.doesNotMatch(app, /class="media-delete-button" data-delete-media/);
  assert.match(app, /data-set-order-status=/);
  assert.match(css, /\.student-detail-main\s*\{\s*display:\s*contents/);
  assert.match(css, /\.student-order-panel\s*\{\s*order:\s*1/);
  assert.match(css, /\.project-button-row\s*\{\s*grid-template-columns:\s*minmax\(0,1fr\)/);
});

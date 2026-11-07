import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const broadcastSource = await readFile(new URL('../../js/services/teacher-broadcast.js', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../../js/core/legacy-app.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8');

test('teacher broadcast UI filters by school and persists per-class sent marks',()=>{
 assert.match(broadcastSource,/data-school aria-label="Школа для рассылки"/);
 assert.match(broadcastSource,/Рассылка отправлена:/);
 assert.match(broadcastSource,/await setSent\?\.\(recipient\.id, next\)/);
 assert.match(appSource,/data-class-broadcast-sent=/);
 assert.match(appSource,/teacherBroadcastSentAt: sent \? now\(\) : ''/);
});

test('project broadcast opens all schools while keeping the current school selected',()=>{
 assert.match(appSource,/state\.data\.projects\.flatMap\(project => classesByProject\(project\.id\)/);
 assert.match(appSource,/selectedSchoolId:node\.dataset\.teacherBroadcast/);
});

test('mobile broadcast locks page overflow while keeping only the class strip horizontally scrollable',()=>{
 assert.match(styles,/\.teacher-broadcast-layout \{[^}]*overflow-x:hidden/);
 assert.match(styles,/\.teacher-phone-state \{[^}]*overflow-wrap:anywhere/);
 assert.match(styles,/\.teacher-message-tools>\*,\.teacher-message-actions>\* \{[^}]*min-width:0/);
 assert.match(styles,/@media \(max-width:640px\)[\s\S]*\.teacher-recipient-list \{[^}]*overflow-x:auto/);
});

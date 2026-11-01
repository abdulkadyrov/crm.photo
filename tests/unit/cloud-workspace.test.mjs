import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const source=await fs.readFile(new URL('../../js/services/cloud-workspace.js',import.meta.url),'utf8');
const sw=await fs.readFile(new URL('../../sw.js',import.meta.url),'utf8');
const values=new Map();
globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
globalThis.location={hostname:'crm.khanzama.ru'};
globalThis.document={documentElement:{dataset:{}}};
const key='crm-server-account-v1';
async function load(user){values.set(key,JSON.stringify(user));return import('data:text/javascript,'+encodeURIComponent(source)+'#'+Math.random());}
test('staff have an independent offline database and no money access',async()=>{const m=await load({id:'staff1',role:'photographer'});assert.equal(m.cloudDatabase(),'school-photo-cloud-staff1');assert.equal(m.canSeeMoney(),false);assert.doesNotThrow(()=>m.assertCloudWrite('media',{}));assert.throws(()=>m.assertCloudWrite('projects',{}));assert.throws(()=>m.assertCloudWrite('media',{},true));});
test('viewer cannot modify photos or payment flags',async()=>{const m=await load({id:'view',role:'viewer'});assert.throws(()=>m.assertCloudWrite('students',{}));assert.throws(()=>m.assertCloudWrite('media',{}));});
test('administrator retains the original local database',async()=>{const m=await load({id:'owner',role:'admin'});assert.equal(m.cloudDatabase(),'school-photo-flow');assert.equal(m.canSeeMoney(),true);});
test('cached account opens offline without contacting identity provider successfully',async()=>{const m=await load({id:'staff',role:'photographer'});globalThis.fetch=async()=>{throw new TypeError('offline');};await m.initializeCloud();assert.equal(m.cloudAccount().id,'staff');assert.equal(document.documentElement.dataset.cloudRole,'photographer');});
test('service worker never caches API responses and precaches versioned entrypoints',()=>{assert.match(sw,/url\.pathname\.startsWith\("\/api\/"\)/);for(const path of ['./styles.css?v=91','./js/core/app.js?v=91','./js/core/legacy-app.js?v=91','./js/services/cloud-workspace.js'])assert.ok(sw.includes(JSON.stringify(path)),path);});

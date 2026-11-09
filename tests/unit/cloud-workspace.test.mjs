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
test('local demo isolates even an admin account and does not mount cloud upload or authentication',async()=>{
 globalThis.location.search='?localDemo=1';
 try {
  const m=await load({id:'owner',role:'admin'});
  assert.equal(m.cloudDatabase(),'school-photo-demo-isolated-v1');assert.equal(m.cloudRequired,false);assert.equal(m.cloudAccount(),null);
  const oldFetch=globalThis.fetch;globalThis.fetch=()=>{throw new Error('Unexpected network');};
  try{await m.initializeCloud();m.mountCloud({});}finally{globalThis.fetch=oldFetch;}
 }finally{globalThis.location.search='';}
});
test('cached account opens offline without contacting identity provider successfully',async()=>{const m=await load({id:'staff',role:'photographer'});globalThis.fetch=async()=>{throw new TypeError('offline');};await m.initializeCloud();assert.equal(m.cloudAccount().id,'staff');assert.equal(document.documentElement.dataset.cloudRole,'photographer');});
test('service worker never caches API responses and precaches versioned entrypoints',()=>{assert.match(sw,/url\.pathname\.startsWith\("\/api\/"\)/);const version=sw.match(/CACHE_VERSION\s*=\s*"(v\d+)"/)?.[1];assert.ok(version,'CACHE_VERSION');const suffix=version.slice(1);for(const path of [`./styles.css?v=${suffix}`,`./js/core/app.js?v=${suffix}`,`./js/core/legacy-app.js?v=${suffix}`,'./js/services/cloud-workspace.js'])assert.ok(sw.includes(JSON.stringify(path)),path);});
test('employee cannot open administration even by calling its exported action',async()=>{
 const m=await load({id:'staff',role:'photographer'});let message='';
 globalThis.window={addEventListener:()=>{}};Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
 m.mountCloud({notify:v=>message=v});await m.showAdmin({});assert.match(message,/администратору/);
});
test('account dialog restores exact settings scroll and focus for Close and browser Back',async()=>{
 const m=await load({id:'owner',role:'admin',name:'Owner',login:'owner'});
 for(const method of ['close','browser']){
  let panel,focused=false,position;const events={};
  const origin={focus:options=>{assert.equal(options.preventScroll,true);focused=true;}};
  globalThis.window={scrollX:4,scrollY:530,addEventListener:(k,fn)=>events[k]=fn,removeEventListener:k=>delete events[k],scrollTo:(...p)=>position=p};
  globalThis.history={state:{settings:true},pushState(v){this.state=v;},back(){this.state={settings:true};events.popstate?.();}};
  globalThis.document={activeElement:null,body:{append:()=>{}},createElement:()=>{
   const handlers={},nodes=new Map();panel={open:false,setAttribute:()=>{},querySelector:s=>{if(!nodes.has(s))nodes.set(s,{});return nodes.get(s);},addEventListener:(k,fn)=>handlers[k]=fn,showModal(){this.open=true;},close(){this.open=false;handlers.close();},remove:()=>{}};
   // Close uses addEventListener on its button.
   panel.querySelector('[data-close]').addEventListener=(k,fn)=>panel.closeAction=fn;
   return panel;
  }};
  m.showAccount(origin);assert.equal(panel.open,true);window.scrollY=0;
  if(method==='close')panel.closeAction();else history.back();
  assert.equal(panel.open,false);assert.equal(focused,true);assert.deepEqual(position,[4,530]);assert.equal(history.state.settings,true);
 }
});

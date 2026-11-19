import test from 'node:test';
import assert from 'node:assert/strict';
import {createScanFeedback} from '../../js/services/scan-feedback.js';
test('scanner audio starts only after a gesture, distinguishes read/save, and persists mute',()=>{
 const notes=[],store=new Map();let opened=0;
 class AudioContext{constructor(){opened++;this.currentTime=1;this.state='running';}resume(){return Promise.resolve();}close(){return Promise.resolve();}createOscillator(){const osc={frequency:{},connect(){},start(){notes.push(osc.frequency.value);},stop(){}};return osc;}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}}
 const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};const feedback=createScanFeedback({AudioContext,storage});
 feedback.play('read');assert.equal(opened,0);feedback.unlock();feedback.play('read');feedback.play('saved');assert.deepEqual(notes,[880,1046,1397]);feedback.toggle();feedback.play('saved');assert.equal(notes.length,3);assert.equal(createScanFeedback({AudioContext,storage}).enabled,false);feedback.dispose();
});
test('unavailable audio and blocked preference storage never interrupt scanner actions',()=>{
 const feedback=createScanFeedback({AudioContext:null,storage:{getItem(){throw Error();},setItem(){throw Error();}}});assert.doesNotThrow(()=>{feedback.unlock();feedback.play('read');feedback.toggle();feedback.dispose();});
});

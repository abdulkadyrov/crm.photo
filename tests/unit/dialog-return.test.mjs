import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureDialogReturn} from '../../js/services/dialog-return.js';
test('closing or browser Back restores the expanded originating menu, focus and exact scroll',()=>{
 const menu={open:true,isConnected:true};let focused=false,position;
 const control={closest:()=>menu,focus:options=>{assert.equal(options.preventScroll,true);focused=true;}};
 const win={scrollX:8,scrollY:530,scrollTo:(...p)=>position=p};
 const restore=captureDialogReturn({activeElement:null},win,control);
 menu.open=false;win.scrollY=0;
 restore();assert.equal(menu.open,true);assert.equal(focused,true);assert.deepEqual(position,[8,530]);
});

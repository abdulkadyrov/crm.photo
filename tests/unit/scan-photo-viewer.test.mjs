import test from 'node:test';
import assert from 'node:assert/strict';
import {headTransform} from '../../js/ui/scan-photo-viewer.js';
test('different head crops share center and displayed head size at every zoom',()=>{
 for(const zoom of [1,2,8])for(const [w,h] of [[157,400],[600,700]]){
 const a={x:180,y:260,size:150},b={x:750,y:900,size:400},pan={x:.1,y:-.2};
 const x=headTransform(w,h,a,zoom,pan),y=headTransform(w,h,b,zoom,pan);
 assert.ok(Math.abs((a.x*x.scale+x.x)-(b.x*y.scale+y.x))<1e-9);
 assert.ok(Math.abs((a.y*x.scale+x.y)-(b.y*y.scale+y.y))<1e-9);
 assert.ok(Math.abs(a.size*x.scale-b.size*y.scale)<1e-9);
 }
});

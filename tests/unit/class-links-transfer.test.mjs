import test from "node:test";
import assert from "node:assert/strict";
import {parseClassLinksTransfer, planClassLinksImport} from "../../js/services/class-links-transfer.js";

test("link-only transfer matches exact project and class IDs without importing structure", () => {
  const transfer = parseClassLinksTransfer({format:"vakha-studia-class-links",schemaVersion:1,links:[
    {projectId:"p1",classId:"c1",url:"https://vakha.example/p/token",token:"token"},
    {projectId:"p1",classId:"missing",url:"https://vakha.example/p/missing"}
  ]});
  const plan = planClassLinksImport(transfer,[{id:"p1"}],[{id:"c1",projectId:"p1",name:"4А"}]);
  assert.equal(plan.matched.length,1);
  assert.equal(plan.unmatched.length,1);
  assert.equal(plan.matched[0].klass.name,"4А");
});

test("link transfer rejects arbitrary or unsafe files", () => {
  assert.throws(()=>parseClassLinksTransfer({format:"other",schemaVersion:1,links:[]}));
  assert.throws(()=>parseClassLinksTransfer({format:"vakha-studia-class-links",schemaVersion:1,links:[{projectId:"p",classId:"c",url:"javascript:alert(1)"}]}));
});

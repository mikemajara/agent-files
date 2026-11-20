const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {validatePackage} = require('../bin/agent-files.cjs');
const example = path.join(__dirname,'../examples/standalone');
const cli = path.join(__dirname,'../bin/agent-files.cjs');
const coordinator = 'agents/coordinator/agent.json';
function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'agent-files-test-'));
  t.after(() => fs.rmSync(temp,{recursive:true,force:true}));
  const target = path.join(temp,'package');
  fs.cpSync(example,target,{recursive:true});
  return target;
}
function mutate(root,file,fn) {
  const full = path.join(root,file);
  const data = JSON.parse(fs.readFileSync(full));
  fn(data);
  fs.writeFileSync(full,JSON.stringify(data));
}
const cases = [
  ['unsupported_version','config.json',p=>mutate(p,'config.json',d=>d.formatVersion='9.9'),'/formatVersion'],
  ['invalid_json',coordinator,p=>fs.writeFileSync(path.join(p,coordinator),'{')],
  ['schema',coordinator,p=>mutate(p,coordinator,d=>delete d.instructions),'/instructions'],
  ['missing_file','agents/coordinator/instructions.md',p=>fs.unlinkSync(path.join(p,'agents/coordinator/instructions.md'))],
  ['duplicate_id','agents/researcher/agent.json',p=>mutate(p,'agents/researcher/agent.json',d=>d.id='coordinator'),'/id'],
  ['dangling_reference',coordinator,p=>mutate(p,coordinator,d=>d.skills=['unknown']),'/skills/0'],
  ['invalid_file_reference',coordinator,p=>mutate(p,coordinator,d=>d.instructions='../../outside.md'),'/instructions'],
  ['symlink','outside',p=>fs.symlinkSync('..',path.join(p,'outside'),'dir')],
];
for (const [code,file,change,pointer] of cases) test(code,t=>{
  const root = fixture(t);
  change(root);
  const actual = validatePackage(root);
  assert.equal(actual.valid,false);
  assert(actual.errors.some(e=>e.code===code && e.path===file && e.pointer===pointer),JSON.stringify(actual));
});
test('valid example and CLI status',t=>{
  const root = fixture(t);
  const run = (...args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
  let result = run('validate',root,'--json');
  assert.equal(result.status,0);
  assert.deepEqual(JSON.parse(result.stdout),{valid:true,errors:[]});
  mutate(root,coordinator,d=>d.tools=['missing']);
  result = run('validate',root,'--json');
  assert.equal(result.status,1);
  assert.equal(JSON.parse(result.stdout).valid,false);
  assert.equal(run('validate').status,2);
});

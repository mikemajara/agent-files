const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {convert,verify} = require('../bin/openbot-backup.cjs');
const {validatePackage} = require('../bin/agent-files.cjs');
const cli = path.join(__dirname,'../bin/openbot-backup.cjs');

function fixture(t,partial=false) {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'openbot-backup-test-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  const source=path.join(temp,'export'), out=path.join(temp,'backup');
  fs.mkdirSync(source);
  const agents=['coordinator','researcher'].map((name,i)=>({
    key:`agent-synthetic-${i}`,name,description:`Coordinate synthetic work as ${name}.`,
    model:'synthetic-model',memories:[{text:`Synthetic memory for ${name}.`}],
    skills:[`agents/agent-synthetic-${i}/skills/research`],
    routines:i ? [] : [{name:'Review',instruction:'Review sample evidence.',schedule:{kind:'daily',time:'09:30'},timezone:'UTC',active:true}],
  }));
  if (partial) {
    agents[1].skills.push('agents/agent-synthetic-1/skills/missing');
    agents.push({key:'agent-empty',name:'Missing description'});
  }
  const paths=[];
  const write=(file,content)=>{const p=path.join(source,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content);paths.push(p);};
  write('openbot-transfer.json',JSON.stringify({format:'openbot-instance-transfer',version:1,agents,signedIn:[{fixture:'excluded-sign-in-marker'}]}));
  for (const a of agents.slice(0,2)) {
    write(`agents/${a.key}/skills/research/SKILL.md`,'---\nname: research\ndescription: Example skill.\n---\nRead [guide](references/guide.md).\n');
    write(`agents/${a.key}/skills/research/references/guide.md`,'Guide.\n');
  }
  return {source,out,paths};
}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('sanitized OpenBot fixture: captured, valid, sealed, source unchanged',t=>{
  const {source,out,paths}=fixture(t);
  const before=paths.map(p=>hash(fs.readFileSync(p)));
  const result=spawnSync(process.execPath,[cli,'backup',source,out],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);
  assert.equal(report.complete,true);assert.equal(report.validity,'passed');assert.equal(report.integrity,'passed');
  assert.deepEqual(report.agents.map(a=>a.status),['captured','captured']);
  assert.deepEqual(fs.readdirSync(path.join(out,'skills')),['research']);
  assert(!fs.readFileSync(path.join(out,'routines/coordinator-review/routine.json'),'utf8').includes('active'));
  assert(!fs.readFileSync(path.join(out,'backup-manifest.json'),'utf8').includes('openbot-transfer.json'));
  assert(validatePackage(out).valid);
  assert.deepEqual(verify(out,report.manifestDigest),{integrity:'passed'});
  assert.equal(verify(out).integrity,'unverified');
  assert.deepEqual(paths.map(p=>hash(fs.readFileSync(p))),before);
  assert.throws(()=>convert(source,out),/EEXIST/);
});
test('unsupported and skipped rows make capture incomplete, not invalid',t=>{
  const {source,out}=fixture(t,true); const report=convert(source,out);
  assert.equal(report.complete,false);assert.equal(report.validity,'passed');assert.equal(report.integrity,'passed');
  assert.match(report.agents[1].omissions[0],/Unreadable or unsafe/);
  assert.equal(report.agents[2].status,'skipped');assert.match(report.agents[2].omissions[0],/description/);
});
for (const kind of ['addition','deletion','modification','manifest substitution','symlink']) test(`trusted receipt detects ${kind}`,t=>{
  const {source,out}=fixture(t); const {manifestDigest}=convert(source,out);
  const file='agents/researcher/instructions.md', target=path.join(out,file), original=path.join(out,'backup-manifest.json');
  if (kind==='addition') fs.writeFileSync(path.join(out,'extra.md'),'Extra.');
  if (kind==='deletion') fs.unlinkSync(target);
  if (kind==='modification' || kind==='manifest substitution') fs.appendFileSync(target,'Changed.');
  if (kind==='symlink') fs.symlinkSync(source,path.join(out,'linked'));
  if (kind==='manifest substitution') {
    const replacement=JSON.parse(fs.readFileSync(original));
    replacement.files.find(f=>f.path===file).sha256=hash(fs.readFileSync(target));
    fs.writeFileSync(original,JSON.stringify(replacement,null,2)+'\n');
    assert.equal(verify(out,hash(fs.readFileSync(original))).integrity,'passed');
  }
  assert.equal(verify(out,manifestDigest).integrity,'failed');
});
test('unsupported model is reported without copying its value',t=>{
  const {source,out}=fixture(t);
  const transfer=path.join(source,'openbot-transfer.json');
  const data=JSON.parse(fs.readFileSync(transfer));
  data.agents[0].model={label:'not-a-portable-string'};
  fs.writeFileSync(transfer,JSON.stringify(data));
  const result=spawnSync(process.execPath,[cli,'backup',source,out],{encoding:'utf8'});
  assert.equal(result.status,1);
  const report=JSON.parse(result.stdout);
  assert.equal(report.complete,false);
  assert.equal(report.agents[0].status,'captured');
  assert.match(report.agents[0].omissions.join(' '),/Unsupported model/);
  assert(!Object.hasOwn(JSON.parse(fs.readFileSync(path.join(out,'agents/coordinator/agent.json'))),'model'));
});
test('trusted receipt allows different formatting, not unordered or duplicate entries',t=>{
  const {source,out}=fixture(t);const report=convert(source,out);
  const file=path.join(out,'backup-manifest.json');
  const parsed=JSON.parse(fs.readFileSync(file));
  const replace=(value,lf='\n')=>{const bytes=JSON.stringify(value)+lf;fs.writeFileSync(file,bytes);return hash(bytes);};
  const compact=replace(parsed);
  assert.equal(verify(out,compact).integrity,'passed');
  assert.equal(verify(out,report.manifestDigest).integrity,'failed');
  assert.equal(verify(out,replace(parsed,'')).integrity,'failed');
  assert.equal(verify(out,replace({...parsed,files:[...parsed.files].reverse()})).integrity,'failed');
  assert.equal(verify(out,replace({...parsed,files:[...parsed.files,parsed.files[0]]})).integrity,'failed');
});
test('destination inside source is rejected before writing',t=>{
  const {source}=fixture(t);const target=path.join(source,'backup');
  assert.throws(()=>convert(source,target),/outside/);assert(!fs.existsSync(target));
});

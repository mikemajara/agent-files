#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {validatePackage} = require('./agent-files.cjs');
const manifest = 'backup-manifest.json';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value) && value.length === 64;
const safePart = s => s && !['.','..'].includes(s) && !/[\\/:\x00-\x1f\x7f]/u.test(s) && Buffer.from(s).toString() === s;
const validId = s => typeof s === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(s) && !/[^a-z0-9-]/u.test(s);
const text = value => typeof value === 'string' && value.trim().length > 0;
const order = (a,b) => Buffer.compare(Buffer.from(a),Buffer.from(b));
const readJson = file => JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(file)));
const writeJson = (file,data) => fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
const inside = (root,next) => {const rel=path.relative(root,next);return rel==='' || (rel!=='..' && !rel.startsWith('..'+path.sep) && !path.isAbsolute(rel));};
function realDirectory(dir) {
  if (!fs.lstatSync(dir).isDirectory()) throw new Error('Expected a directory, not a symlink.');
  return fs.realpathSync(dir);
}
function listFiles(dir,rel='') {
  const out=[];
  for (const name of fs.readdirSync(dir,{encoding:'buffer'})) {
    const part=name.toString('utf8');
    if (!Buffer.from(part).equals(name) || !safePart(part)) throw new Error('Unsafe filename.');
    const abs=path.join(dir,part), key=rel ? `${rel}/${part}` : part;
    const stat=fs.lstatSync(abs);
    if (stat.isDirectory()) out.push(...listFiles(abs,key));
    else if (stat.isFile()) out.push(key);
    else throw new Error('Symlinks and special files are not supported.');
  }
  return out.sort(order);
}
function makeManifest(dir) {
  return {version:1,files:listFiles(dir).filter(file=>file!==manifest).map(file=>({path:file,sha256:digest(fs.readFileSync(path.join(dir,file)))}))};
}
function verify(input,expected) {
  if (expected === undefined) return {integrity:'unverified',reason:'Supply the separately trusted manifest digest.'};
  if (!hex(expected)) return {integrity:'failed',reason:'Expected digest must be 64 lowercase hex characters.'};
  try {
    const dir=realDirectory(input), file=path.join(dir,manifest);
    if (!fs.lstatSync(file).isFile()) throw new Error('Manifest is not a regular file.');
    const bytes=fs.readFileSync(file);
    if (digest(bytes)!==expected) return {integrity:'failed',reason:'Manifest digest does not match the trusted receipt.'};
    const actual=JSON.stringify(makeManifest(dir),null,2)+'\n';
    if (!bytes.equals(Buffer.from(actual))) return {integrity:'failed',reason:'Manifest or payload membership/content differs.'};
    return {integrity:'passed'};
  } catch {return {integrity:'failed',reason:'Cannot safely read the manifest or payload.'};}
}
function slug(value,fallback) {
  return (typeof value==='string' ? value.toLowerCase().replace(/[^a-z0-9]+/gu,'-').replace(/^-|-$/gu,'').slice(0,60).replace(/-$/u,'') : '') || fallback;
}
function unique(base,used) {
  let id=base, n=2;
  while (used.has(id)) id=`${base}-${n++}`;
  used.add(id); return id;
}
function convert(source,destination) {
  const input=realDirectory(source);
  const requested=path.resolve(destination);
  const parent=realDirectory(path.dirname(requested));
  const output=path.join(parent,path.basename(requested));
  if (inside(input,output)) throw new Error('Choose a new destination outside the export.');
  const transfer=path.join(input,'openbot-transfer.json');
  if (!fs.lstatSync(transfer).isFile()) throw new Error('Expected a regular openbot-transfer.json file.');
  const data=readJson(transfer);
  if (data?.format!=='openbot-instance-transfer' || data.version!==1 || !Array.isArray(data.agents)) throw new Error('Unsupported OpenBot transfer format; expected instance transfer version 1.');
  fs.mkdirSync(output,{mode:0o700});
  const report={agents:[],omissions:[],complete:true,validity:'unverified',integrity:'unverified'};
  const omit=(target,reason)=>{ target.push(reason);report.complete=false; };
  for (const [key,category] of [['channels','channels'],['shared','shared package settings']]) if (data[key] && (!Array.isArray(data[key]) || data[key].length)) omit(report.omissions,`${category} not portable.`);
  for (const [key, label] of [['mcpServers','MCP server settings'],['customProviders','provider settings'],['customAgents','custom agent settings'],['routineFlows','routine flows'],['workflows','workflows']]) {
    const value=data.settings?.[key];
    if (value && (typeof value!=='object' || Object.keys(value).length)) omit(report.omissions,`App-level ${label} not copied.`);
  }
  const agentIds=new Set(),routineIds=new Set(),skills=new Map();
  function save(file,content) {
    const dest=path.join(output,file);
    fs.mkdirSync(path.dirname(dest),{recursive:true,mode:0o700});
    if (typeof content==='string' || Buffer.isBuffer(content)) fs.writeFileSync(dest,content,{flag:'wx',mode:0o600});
    else writeJson(dest,content);
  }
  function captureSkill(ref,key) {
    const parts=typeof ref==='string' ? ref.split('/') : [];
    const id=parts[3];
    if (parts.length!==4 || parts[0]!=='agents' || parts[1]!==key || parts[2]!=='skills' || !parts.every(safePart) || !validId(id)) return {reason:'Unsupported skill reference.'};
    try {
      let folder=input;
      for (const part of parts) {folder=path.join(folder,part);if (!fs.lstatSync(folder).isDirectory()) throw new Error('Invalid folder.');}
      const names=listFiles(folder);
      if (!names.includes('SKILL.md')) return {reason:`Missing skill entrypoint (${id}).`};
      if (names.some(name=>!name.toLowerCase().endsWith('.md'))) return {reason:`Unsupported non-Markdown skill content (${id}).`};
      const files=names.map(name=>[name,fs.readFileSync(path.join(folder,name))]);
      const signature=JSON.stringify(files.map(([name,bytes])=>[name,digest(bytes)]));
      if (skills.has(id)) return skills.get(id)===signature ? {id} : {reason:`Conflicting skill content (${id}).`};
      return {id,files,signature};
    } catch {return {reason:`Unreadable or unsafe skill folder (${id}).`};}
  }
  save('config.json',{formatVersion:'0.1'});
  for (const [i,agent] of data.agents.entries()) {
    const row={sourceIndex:i+1,status:'skipped',omissions:[]}; report.agents.push(row);
    if (!agent || !text(agent.description)) {omit(row.omissions,'Missing readable agent description.');continue;}
    const id=unique(slug(agent.name,`agent-${i+1}`),agentIds), dir=`agents/${id}`;
    const config={id,instructions:'instructions.md'};
    if (text(agent.name)) config.name=agent.name;
    if (text(agent.model)) config.model=agent.model;
    save(`${dir}/instructions.md`,agent.description+'\n');
    if (agent.files != null) omit(row.omissions,'Agent file bundle is not supported.');
    if (agent.memories != null && !Array.isArray(agent.memories)) omit(row.omissions,'Unsupported memory list.');
    const memories=[];
    for (const entry of Array.isArray(agent.memories) ? agent.memories : []) {
      if (text(entry?.text)) memories.push(entry.text); else omit(row.omissions,'Missing or unsupported memory entry.');
    }
    if (memories.length) {config.memory='memory.json';fs.writeFileSync(path.join(output,dir,'memory.json'),JSON.stringify(memories,null,2)+'\n',{flag:'wx',mode:0o600});}
    if (agent.skills != null && !Array.isArray(agent.skills)) omit(row.omissions,'Unsupported skill list.');
    for (const ref of Array.isArray(agent.skills) ? agent.skills : []) {
      const item=captureSkill(ref,agent.key);
      if (item.reason) {omit(row.omissions,item.reason);continue;}
      if (item.files) {for (const [name,bytes] of item.files) save(`skills/${item.id}/${name}`,bytes);skills.set(item.id,item.signature);}
      config.skills=[...new Set([...(config.skills ?? []),item.id])];
    }
    if (agent.routines != null && !Array.isArray(agent.routines)) omit(row.omissions,'Unsupported routine list.');
    for (const routine of Array.isArray(agent.routines) ? agent.routines : []) {
      const schedule=routine?.schedule;
      if (!text(routine?.instruction) || !['daily','weekdays'].includes(schedule?.kind) || typeof schedule.time!=='string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(schedule.time) || schedule.time.length!==5 || !text(routine.timezone)) {omit(row.omissions,'Unsupported or incomplete routine.');continue;}
      try {new Intl.DateTimeFormat('en',{timeZone:routine.timezone});} catch {omit(row.omissions,'Unsupported routine timezone.');continue;}
      const rid=unique(`${id}-${slug(routine.name,'routine')}`,routineIds), rd=`routines/${rid}`;
      save(`${rd}/prompt.md`,routine.instruction+'\n');
      save(`${rd}/routine.json`,{id:rid,trigger:`${schedule.kind==='daily'?'Daily':'Weekdays'} at ${schedule.time} (${routine.timezone})`,prompt:'prompt.md',participants:[id],result:'Follow the routine prompt.'});
      (config.routines ??= []).push(rid);
    }
    save(`${dir}/agent.json`,config);row.status='captured';row.id=id;
  }
  const validation=validatePackage(output);
  report.validity=validation.valid ? 'passed' : 'failed';
  if (!validation.valid) {report.validationErrors=validation.errors;return report;}
  writeJson(path.join(output,manifest),makeManifest(output));
  const receipt=digest(fs.readFileSync(path.join(output,manifest)));
  Object.assign(report,verify(output,receipt));
  if (report.integrity==='passed') report.manifestDigest=receipt;
  return report;
}
if (require.main===module) {
  const [command,input,arg,...rest]=process.argv.slice(2);
  const usage='Usage: openbot-backup.cjs backup <sanitized-export> <new-destination> | verify <backup> [trusted-digest]';
  if (!input || rest.length || !['backup','verify'].includes(command) || (command==='backup' && !arg)) {console.error(usage);process.exitCode=2;}
  else try {
    const report=command==='backup' ? convert(input,arg) : verify(input,arg);
    console.log(JSON.stringify(report));
    process.exitCode=report.integrity==='passed' && report.complete!==false ? 0 : 1;
  } catch (e) {console.error(e instanceof SyntaxError?'Cannot read the OpenBot transfer JSON.':e.message);process.exitCode=2;}
}
module.exports={convert,verify};

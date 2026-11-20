#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv/dist/2020').default;
const MarkdownIt = require('markdown-it');
const markdown = new MarkdownIt();
// Inspect destinations, including file URLs normally suppressed by the renderer.
// Tokens are never rendered or executed.
markdown.validateLink = () => true;
const versions = new Set(['0.1']);
const kinds = { agents: 'agent', skills: 'skill', tools: 'tool', routines: 'routine' };
const filenames = { agents: 'agent.json', skills: 'SKILL.md', tools: 'tool.json', routines: 'routine.json' };
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const pointer = key => String(key).replaceAll('~', '~0').replaceAll('/', '~1');
const validId = value => idPattern.test(value) && !/[^a-z0-9-]/u.test(value);

function validatePackage(dir) {
  const errors = [];
  const add = (code, path, message, field) => errors.push({code, path, message, ...(field === undefined ? {} : {pointer: field})});
  const local = file => path.join(dir, ...file.split('/'));
  const files = new Map();
  function scan(rel) {
    let stat;
    try { stat = fs.lstatSync(local(rel)); }
    catch (e) { add(e.code === 'ENOENT' ? 'missing' : 'unreadable', rel, 'Cannot inspect this path.'); return; }
    if (stat.isSymbolicLink()) { add('symlink', rel, 'Symbolic links are not supported.'); return; }
    if (stat.isDirectory()) {
      files.set(rel, 'directory');
      let entries;
      try { entries = fs.readdirSync(local(rel)).sort(); }
      catch { add('unreadable', rel, 'Cannot list this directory.'); return; }
      for (const name of entries) scan(rel === '.' ? name : `${rel}/${name}`);
    } else if (stat.isFile()) files.set(rel, 'file');
    else add('file_type', rel, 'Expected a regular file or directory.');
  }
  function regular(rel) {
    if (files.get(rel) === 'file') return true;
    add('missing_file', rel, 'Expected a regular file inside the package.');
    return false;
  }
  function json(rel) {
    if (!regular(rel)) return undefined;
    let text;
    try { text = new TextDecoder('utf-8', {fatal:true}).decode(fs.readFileSync(local(rel))); }
    catch { add('unreadable', rel, 'Cannot read this file as UTF-8.'); return undefined; }
    try { return JSON.parse(text); }
    catch { add('invalid_json', rel, 'Expected well-formed JSON.'); return undefined; }
  }
  scan('.');
  if (files.get('.') !== 'directory') {
    if (!errors.length) add('not_directory', '.', 'Expected a package directory.');
    return {valid:false, errors};
  }
  const config = json('config.json');
  if (config === undefined) return {valid:false, errors};
  const version = config?.formatVersion;
  if (!versions.has(version)) {
    add(typeof version === 'string' ? 'unsupported_version' : 'schema', 'config.json', 'Expected a supported formatVersion (0.1).', '/formatVersion');
    return {valid:false,errors};
  }

  const ajv = new Ajv({allErrors:true});
  const schemas = new Map();
  function check(kind, item, rel) {
    if (item === undefined) return false;
    if (!schemas.has(kind)) schemas.set(kind, ajv.compile(JSON.parse(fs.readFileSync(path.join(__dirname,'..','schemas',version,`${kind}.schema.json`),'utf8'))));
    const schema = schemas.get(kind);
    if (schema(item)) return true;
    for (const error of schema.errors) {
      const key = error.params.missingProperty ?? error.params.additionalProperty;
      const field = error.instancePath + (key === undefined ? '' : '/' + pointer(key));
      const code = error.keyword === 'const' && ['instructions','memory','prompt'].includes(field.slice(1)) ? 'invalid_file_reference' : 'schema';
      add(code,rel,error.message,field);
    }
    return false;
  }
  check('config',config,'config.json');
  const index = Object.fromEntries(Object.keys(kinds).map(root => [root,new Set()]));
  const refs = [];
  for (const [root,kind] of Object.entries(kinds)) {
    if (files.has(root) && files.get(root) !== 'directory') add('not_directory',root,'Expected a resource directory.');
    const ids = new Set();
    for (const [rel,type] of files) {
      if (!rel.startsWith(root+'/') || rel.split('/').length !== 2 || type !== 'directory') continue;
      const folderId = rel.split('/')[1];
      const file = `${rel}/${filenames[root]}`;
      if (!validId(folderId)) add('folder_id',rel,'Invalid resource folder ID.');
      if (kind === 'skill') {
        if (regular(file) && validId(folderId)) index[root].add(folderId);
        continue;
      }
      const data = json(file);
      if (!check(kind,data,file)) continue;
      if (ids.has(data.id)) add('duplicate_id',file,`Duplicate ${kind} ID.`, '/id');
      ids.add(data.id);
      if (data.id !== folderId) add('id_mismatch',file,'ID must match its folder name.', '/id');
      else index[root].add(data.id);
      if (kind === 'agent') {
        regular(`${rel}/${data.instructions}`);
        if (data.memory) check('memory',json(`${rel}/${data.memory}`),`${rel}/${data.memory}`);
      }
      if (kind === 'routine') regular(`${rel}/${data.prompt}`);
      for (const [field,target] of Object.entries({skills:'skills',tools:'tools',routines:'routines',participants:'agents'})) {
        for (const [i,id] of (data[field] ?? []).entries()) refs.push({id,target,file,field:`/${field}/${i}`});
      }
    }
  }
  for (const {id,target,file,field} of refs) if (!index[target].has(id)) add('dangling_reference',file,`No matching resource in ${target}/.`,field);
  for (const [rel,type] of files) {
    if (type !== 'file' || !/\.md$/iu.test(rel)) continue;
    let text;
    try { text = new TextDecoder('utf-8', {fatal:true}).decode(fs.readFileSync(local(rel))); }
    catch { add('unreadable',rel,'Cannot read this Markdown file as UTF-8.'); continue; }
    for (const block of markdown.parse(text, {})) {
      for (const token of block.children ?? []) {
        const destination = token.type === 'link_open' ? token.attrGet('href') : token.type === 'image' ? token.attrGet('src') : null;
        if (!destination || destination.startsWith('#') || destination.startsWith('//')) continue;
        const scheme = /^[a-z][a-z\d+.-]*:/iu.exec(destination)?.[0];
        if (scheme && scheme.length > 2 && scheme.toLowerCase() !== 'file:') continue;
        let target;
        try { target = decodeURIComponent(destination.split(/[?#]/u, 1)[0]); }
        catch { add('invalid_markdown_link',rel,'Malformed local Markdown link.'); continue; }
        if (!target) continue;
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(rel),target)).replace(/\/$/u,'') || '.';
        if (scheme || target.startsWith('/') || /[\\\x00-\x1f\x7f]/u.test(target) || resolved === '..' || resolved.startsWith('../')) {
          add('invalid_markdown_link',rel,'Local Markdown link must stay inside the package.');
        } else if (!files.has(resolved)) add('dangling_markdown_link',rel,`Local Markdown target not found: ${JSON.stringify(resolved)}.`);
      }
    }
  }
  return {valid:errors.length === 0, errors};
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const machine = args.includes('--json');
  if (args[0] !== 'validate' || ![2,3].includes(args.length) || !args[1] || args[1].startsWith('--') || (args.length === 3 && args[2] !== '--json')) {
    console.error('Usage: agent-files validate <package-dir> [--json]');
    process.exitCode = 2;
  } else {
    try {
      const report = validatePackage(path.resolve(args[1]));
      if (machine) console.log(JSON.stringify(report));
      else if (report.valid) console.log('Valid Agent Files package.');
      else for (const {code,path,pointer,message} of report.errors) console.log(`${JSON.stringify(path)}${pointer === undefined ? '' : `#${JSON.stringify(pointer)}`} [${code}] ${message}`);
      process.exitCode = report.valid ? 0 : 1;
    } catch {
      console.error('Validator failed to run; check that its dependencies and bundled schemas are installed.');
      process.exitCode = 2;
    }
  }
}

module.exports = {validatePackage};

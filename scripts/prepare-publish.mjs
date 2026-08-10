#!/usr/bin/env node
/**
 * Prepare create-agent-files for npm publish.
 * Run from repo root or packages/create-agent-files:
 *   node scripts/prepare-publish.mjs
 *   npm run prepare-publish -C packages/create-agent-files
 *
 * Does not publish. After this passes:
 *   - bump version in packages/create-agent-files/package.json if needed
 *   - commit + push
 *   - publish via GitHub Release / workflow_dispatch (needs NPM_TOKEN secret)
 *     or: cd packages/create-agent-files && npm publish
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  accessSync,
  constants,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pkgDir = path.join(root, "packages", "create-agent-files");
const binPath = path.join(pkgDir, "bin", "create-agent-files.js");
const pkgPath = path.join(pkgDir, "package.json");

function fail(msg) {
  console.error(`prepare-publish: ${msg}`);
  process.exit(1);
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", encoding: "utf8" });
  if (r.status !== 0) fail(`${cmd} ${args.join(" ")} failed`);
}

if (!existsSync(pkgPath)) fail(`missing ${pkgPath}`);
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

if (pkg.name !== "create-agent-files") fail(`unexpected name: ${pkg.name}`);
if (!pkg.version) fail("package.json missing version");
if (pkg.type !== "module") fail('package.json must set "type": "module"');
if (!pkg.bin) fail("package.json missing bin");
if (!pkg.publishConfig?.access) {
  fail('package.json should set publishConfig.access (e.g. "public")');
}

if (!existsSync(binPath)) fail(`missing bin ${binPath}`);
try {
  accessSync(binPath, constants.X_OK);
} catch {
  fail(`bin not executable: ${binPath} (chmod +x)`);
}

console.log(`Checking syntax: ${binPath}`);
run("node", ["--check", binPath], pkgDir);

console.log("npm pack --dry-run …");
run("npm", ["pack", "--dry-run"], pkgDir);

const name = pkg.name;
const ver = pkg.version;
console.log(`
OK — ready to publish ${name}@${ver}

Next (pick one):

  A) GitHub (preferred)
     1. Ensure repo secret NPM_TOKEN is set (npmjs access token, Automation)
     2. Bump version in packages/create-agent-files/package.json if republishing
     3. Commit + push, then either:
        - Actions → "Publish create-agent-files" → Run workflow
        - or: gh release create create-agent-files-v${ver} --generate-notes

  B) Local
     cd packages/create-agent-files
     npm login   # once
     npm publish

After publish, smoke:
  npx create-agent-files@${ver} smoke-app --storage local -y
`);

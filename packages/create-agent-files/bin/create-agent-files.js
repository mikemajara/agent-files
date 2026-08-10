#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_REPO = "https://github.com/mikemajara/agent-files.git";

const IGNORE = new Set([
  ".git",
  "node_modules",
  ".next",
  ".eve",
  ".vercel",
  "data",
  "packages",
]);

function parseArgs(argv) {
  const out = { name: null, storage: null, yes: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--storage" || a === "-s") out.storage = argv[++i];
    else if (a === "--yes" || a === "-y") out.yes = true;
    else if (a.startsWith("-")) {
      console.error(`Unknown flag: ${a}`);
      process.exit(1);
    } else rest.push(a);
  }
  out.name = rest[0] ?? null;
  return out;
}

function copyTemplate(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;
    if (entry.name === ".env.local") continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyTemplate(src, dest);
    else cpSync(src, dest);
  }
}

function writeEnv(targetDir, storage) {
  const example = path.join(targetDir, ".env.example");
  let body = existsSync(example)
    ? readFileSync(example, "utf8")
    : "STORAGE_BACKEND=vercel\nSTORAGE_PREFIX=workspace\n";
  body = body.replace(
    /^STORAGE_BACKEND=.*$/m,
    `STORAGE_BACKEND=${storage}`,
  );
  if (!/^STORAGE_BACKEND=/m.test(body)) {
    body = `STORAGE_BACKEND=${storage}\n` + body;
  }
  writeFileSync(path.join(targetDir, ".env.local"), body);
}

function patchPackageName(targetDir, name) {
  const pkgPath = path.join(targetDir, "package.json");
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.name = name;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let name = args.name;
  let storage = args.storage;

  if (!args.yes || !name || !storage) {
    const answers = await prompts(
      [
        {
          type: name ? null : "text",
          name: "name",
          message: "Project name",
          initial: "my-agent-app",
        },
        {
          type: storage ? null : "select",
          name: "storage",
          message: "Storage backend",
          choices: [
            { title: "Vercel Blob (default)", value: "vercel" },
            { title: "Cloudflare R2", value: "r2" },
            { title: "Local ./data", value: "local" },
          ],
          initial: 0,
        },
      ],
      { onCancel: () => process.exit(1) },
    );
    name = name || answers.name;
    storage = storage || answers.storage || "vercel";
  }

  storage = String(storage).toLowerCase();
  if (!["vercel", "r2", "local"].includes(storage)) {
    console.error("storage must be vercel | r2 | local");
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), name);
  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    console.error(`Target directory not empty: ${targetDir}`);
    process.exit(1);
  }

  // Prefer cloning the GitHub template so scaffolds stay current.
  const tmp = path.join(
    process.cwd(),
    `.create-agent-files-${Date.now()}`,
  );
  console.log(`\nFetching template from ${TEMPLATE_REPO} …`);
  const clone = spawnSync(
    "git",
    ["clone", "--depth", "1", TEMPLATE_REPO, tmp],
    { stdio: "inherit" },
  );
  if (clone.status !== 0) {
    // Fallback: copy from published package sibling template if present
    const localTpl = path.resolve(__dirname, "../../");
    if (!existsSync(path.join(localTpl, "package.json"))) {
      console.error("Failed to clone template repository.");
      process.exit(1);
    }
    console.log("Clone failed; copying local checkout …");
    mkdirSync(targetDir, { recursive: true });
    copyTemplate(localTpl, targetDir);
  } else {
    mkdirSync(targetDir, { recursive: true });
    copyTemplate(tmp, targetDir);
    rmSync(tmp, { recursive: true, force: true });
  }

  patchPackageName(targetDir, name);
  writeEnv(targetDir, storage);

  console.log(`
Created ${name}

  cd ${name}
  npm install
  npm run dev

Storage: ${storage}
Env stub: .env.local (from .env.example)

Next (agent-ready Companion):
  - Ask your coding agent to run skill: provision-vercel
    (vercel link + vercel env pull → VERCEL_OIDC_TOKEN for AI Gateway)
  - Or manually: npx vercel link --yes && npx vercel env pull .env.local --yes
  - Storage credentials: skill provision-storage if not using local
  - Deploy only if you want a Vercel URL (same skill, optional step)
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

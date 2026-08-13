#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(SCRIPT_DIR, "..");
const DEFAULT_BACKLOG_DIR = ".backlog";
const DEFAULT_REMOTE = "origin";

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const backlogDir = resolve(options.backlogDir || DEFAULT_BACKLOG_DIR);
const remote = options.remote || DEFAULT_REMOTE;
const repo = options.repo || getRepoFromGitRemote(remote);
const labels = loadLabels();

if (options.check) {
  const problems = runCheck({ backlogDir, repo, labels, remote });
  if (problems.length === 0) {
    console.log("Backlog setup looks good.");
    process.exit(0);
  }

  console.error("Backlog setup is incomplete:");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

if (!options.skipScaffold) {
  ensureScaffold(backlogDir, options.dryRun);
}

if (!options.skipLabels) {
  if (!repo) {
    console.error("Could not determine GitHub repository for label setup.");
    console.error(
      `Set it explicitly with --repo owner/repo, or configure remote.${remote}.url.`,
    );
    process.exit(1);
  }

  ensureGhAvailable();
  ensureLabels(labels, repo, options.dryRun);
}

reportLegacyArtifacts(backlogDir);

function parseArgs(argv) {
  const options = {
    help: false,
    check: false,
    dryRun: false,
    skipLabels: false,
    skipScaffold: false,
    backlogDir: "",
    repo: "",
    remote: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--check":
        options.check = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--skip-labels":
        options.skipLabels = true;
        break;
      case "--skip-scaffold":
        options.skipScaffold = true;
        break;
      case "--backlog-dir":
        options.backlogDir = argv[index + 1] || "";
        index += 1;
        break;
      case "--repo":
        options.repo = argv[index + 1] || "";
        index += 1;
        break;
      case "--remote":
        options.remote = argv[index + 1] || "";
        index += 1;
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node backlog-setup.mjs [options]

Idempotently prepare a project for the backlog workflow.

Options:
  --check              Report missing scaffold or labels; exit 1 if incomplete
  --dry-run            Print actions without writing files or updating labels
  --skip-scaffold      Only upsert GitHub labels
  --skip-labels        Only create missing local .backlog/ files and folders
  --backlog-dir PATH   Backlog directory (default: .backlog)
  --repo OWNER/REPO    GitHub repository for labels (default: from git remote)
  --remote NAME        Git remote to inspect (default: origin)
  -h, --help           Show this help

Examples:
  node backlog-setup.mjs
  node backlog-setup.mjs --dry-run
  node backlog-setup.mjs --check
  node backlog-setup.mjs --skip-labels
`);
}

function loadLabels() {
  const labelsPath = join(SKILL_ROOT, "references", "labels.json");
  return JSON.parse(readFileSync(labelsPath, "utf8"));
}

function runCheck({ backlogDir, repo, labels, remote }) {
  const problems = [];

  for (const relativePath of requiredScaffoldPaths(backlogDir)) {
    if (!existsSync(relativePath)) {
      problems.push(`Missing ${toProjectRelative(relativePath)}`);
    }
  }

  if (!repo) {
    problems.push(
      `Could not determine GitHub repository from remote "${remote}"`,
    );
    return problems;
  }

  try {
    ensureGhAvailable();
    const existing = listLabels(repo);
    for (const label of labels) {
      if (!existing.has(label.name)) {
        problems.push(`Missing GitHub label ${label.name}`);
      }
    }
  } catch (error) {
    problems.push(error.message);
  }

  return problems;
}

function requiredScaffoldPaths(backlogDir) {
  return [
    backlogDir,
    join(backlogDir, "inbox.md"),
    join(backlogDir, "memory.md"),
    join(backlogDir, "prds"),
    join(backlogDir, "plans"),
  ];
}

function ensureScaffold(backlogDir, dryRun) {
  mkdirIfMissing(backlogDir, dryRun);
  mkdirIfMissing(join(backlogDir, "prds"), dryRun);
  mkdirIfMissing(join(backlogDir, "plans"), dryRun);

  copyIfMissing(
    join(SKILL_ROOT, "assets", "inbox.md"),
    join(backlogDir, "inbox.md"),
    dryRun,
  );
  copyIfMissing(
    join(SKILL_ROOT, "assets", "memory.md"),
    join(backlogDir, "memory.md"),
    dryRun,
  );
}

function ensureLabels(labels, repo, dryRun) {
  const existing = listLabels(repo);

  for (const label of labels) {
    const args = [
      "label",
      "create",
      label.name,
      "--color",
      label.color,
      "--description",
      label.description,
      "--repo",
      repo,
      "--force",
    ];

    if (dryRun) {
      const action = existing.has(label.name) ? "update" : "create";
      console.log(`[dry-run] would ${action} label ${label.name}`);
      continue;
    }

    execFileSync("gh", args, { stdio: "inherit" });
    const action = existing.has(label.name) ? "Updated" : "Created";
    console.log(`${action} label ${label.name}`);
  }
}

function reportLegacyArtifacts(backlogDir) {
  const legacyPaths = [
    join(backlogDir, "backlog.md"),
    join(backlogDir, "issues.md"),
    join(backlogDir, "notes.md"),
  ];

  for (const legacyPath of legacyPaths) {
    if (existsSync(legacyPath)) {
      console.log(
        `Note: found legacy file ${toProjectRelative(legacyPath)}; migrate manually if needed.`,
      );
    }
  }
}

function mkdirIfMissing(path, dryRun) {
  if (existsSync(path)) {
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] would create directory ${toProjectRelative(path)}`);
    return;
  }

  mkdirSync(path, { recursive: true });
  console.log(`Created directory ${toProjectRelative(path)}`);
}

function copyIfMissing(sourcePath, targetPath, dryRun) {
  if (existsSync(targetPath)) {
    return;
  }

  if (dryRun) {
    console.log(
      `[dry-run] would create file ${toProjectRelative(targetPath)}`,
    );
    return;
  }

  copyFileSync(sourcePath, targetPath);
  console.log(`Created file ${toProjectRelative(targetPath)}`);
}

function listLabels(repo) {
  const output = execFileSync(
    "gh",
    ["label", "list", "--repo", repo, "--limit", "200", "--json", "name"],
    { encoding: "utf8" },
  );

  return new Set(JSON.parse(output).map((label) => label.name));
}

function ensureGhAvailable() {
  try {
    execFileSync("gh", ["auth", "status"], { stdio: "ignore" });
  } catch {
    throw new Error(
      "GitHub CLI is missing or not authenticated. Install gh and run gh auth login.",
    );
  }
}

function getRepoFromGitRemote(remoteName) {
  try {
    const url = execFileSync(
      "git",
      ["config", "--get", `remote.${remoteName}.url`],
      { encoding: "utf8" },
    ).trim();

    return parseGitHubRepo(url);
  } catch {
    return "";
  }
}

function parseGitHubRepo(url) {
  const sshMatch = url.match(/^git@github\.com:([^/]+\/[^/.]+)(?:\.git)?$/);
  if (sshMatch) {
    return sshMatch[1];
  }

  const httpsMatch = url.match(
    /^https?:\/\/github\.com\/([^/]+\/[^/.]+)(?:\.git)?$/,
  );
  if (httpsMatch) {
    return httpsMatch[1];
  }

  return "";
}

function toProjectRelative(path) {
  return path.startsWith(`${process.cwd()}/`)
    ? path.slice(process.cwd().length + 1)
    : path;
}

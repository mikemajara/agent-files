#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_OUTPUT = ".backlog/issues.md";
const DEFAULT_LIMIT = "1000";
const DEFAULT_REMOTE = "origin";
const DEFAULT_STATE = "all";
const VALID_STATES = new Set(["all", "open", "closed"]);

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const outputPath = resolve(options.output || DEFAULT_OUTPUT);
const limit = options.limit || DEFAULT_LIMIT;
const state = options.state || DEFAULT_STATE;
const remote = options.remote || DEFAULT_REMOTE;
const repo = options.repo || getRepoFromGitRemote(remote);

if (!VALID_STATES.has(state)) {
  console.error(`Invalid --state "${state}". Use one of: all, open, closed.`);
  process.exit(1);
}

if (!repo) {
  console.error("Could not determine GitHub repository.");
  console.error(
    `Set it explicitly with --repo owner/repo, or configure remote.${remote}.url.`,
  );
  process.exit(1);
}

ensureGhAvailable();

const fields = [
  "number",
  "title",
  "state",
  "labels",
  "assignees",
  "url",
  "updatedAt",
].join(",");

const args = [
  "issue",
  "list",
  "--state",
  state,
  "--limit",
  limit,
  "--repo",
  repo,
  "--json",
  fields,
];

let issues;

try {
  const output = execFileSync("gh", args, { encoding: "utf8" });
  issues = JSON.parse(output);
} catch (error) {
  const message = error.stderr || error.message;
  console.error(`Failed to read GitHub Issues with gh: ${message}`);
  process.exit(1);
}

issues.sort((left, right) => right.number - left.number);

const generatedAt = new Date().toISOString();
const rows = issues.map(formatIssue);

const markdown = [
  "<!-- GENERATED FROM GITHUB ISSUES. DO NOT EDIT DIRECTLY. -->",
  "",
  "# GitHub Issues",
  "",
  `Generated at: ${generatedAt}`,
  "",
  "| Issue | Status | Title | Labels | Assignees | Updated |",
  "| --- | --- | --- | --- | --- | --- |",
  ...rows,
  "",
].join("\n");

if (options.dryRun) {
  console.log(`[dry-run] would sync ${issues.length} GitHub Issues to ${outputPath}`);
  process.exit(0);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, markdown);

console.log(`Synced ${issues.length} GitHub Issues to ${outputPath}`);

function parseArgs(argv) {
  const parsed = {
    help: false,
    dryRun: false,
    output: "",
    limit: "",
    remote: "",
    repo: "",
    state: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      case "--dry-run":
        parsed.dryRun = true;
        break;
      case "--repo":
        parsed.repo = argv[index + 1] || "";
        index += 1;
        break;
      case "--output":
        parsed.output = argv[index + 1] || "";
        index += 1;
        break;
      case "--limit":
        parsed.limit = argv[index + 1] || "";
        index += 1;
        break;
      case "--remote":
        parsed.remote = argv[index + 1] || "";
        index += 1;
        break;
      case "--state":
        parsed.state = argv[index + 1] || "";
        index += 1;
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return parsed;
}

function ensureGhAvailable() {
  try {
    execFileSync("gh", ["auth", "status"], { stdio: "ignore" });
  } catch {
    console.error(
      "GitHub CLI is missing or not authenticated. Install gh and run gh auth login.",
    );
    process.exit(1);
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

function printHelp() {
  console.log(`Usage: node backlog-sync.mjs [options]

Regenerate .backlog/issues.md from GitHub Issues.

Options:
  --dry-run              Print actions without writing the output file
  --repo OWNER/REPO      GitHub repository (default: from git remote)
  --remote NAME          Git remote to inspect (default: origin)
  --output PATH          Markdown output file (default: .backlog/issues.md)
  --limit NUMBER         Maximum issues to fetch (default: 1000)
  --state all|open|closed
                         Issue state to fetch (default: all)
  -h, --help             Show this help

Examples:
  node backlog-sync.mjs
  node backlog-sync.mjs --dry-run
  node backlog-sync.mjs --repo owner/repo --state open
`);
}

function formatIssue(issue) {
  const labels = (issue.labels || [])
    .map((label) => label.name)
    .sort()
    .map((name) => `\`${escapeTableCell(name)}\``)
    .join(", ");

  const assignees = (issue.assignees || [])
    .map((assignee) => assignee.login || assignee.name)
    .filter(Boolean)
    .sort()
    .map(escapeTableCell)
    .join(", ");

  const updated = issue.updatedAt ? issue.updatedAt.slice(0, 10) : "";
  const title = `[${escapeTableCell(issue.title)}](${issue.url})`;

  return `| ${[
    `#${issue.number}`,
    issue.state,
    title,
    labels || "-",
    assignees || "-",
    updated || "-",
  ].join(" | ")} |`;
}

function escapeTableCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  CANONICAL_LABELS,
  failUsage,
  ghJson,
  outputResult,
  parseCommonArgs,
  resolveRepo,
  toProjectRelative,
} from "./backlog-lib.mjs";

const options = parseCommonArgs(process.argv.slice(2), {
  booleanOptions: ["skip-github"],
});

if (options.help) {
  printHelp();
  process.exit(0);
}

const backlogDir = resolve(options.backlogDir);
const problems = [];
const warnings = [];
const checks = [];

checkScaffold(backlogDir);
checkIssuesSnapshot(backlogDir, Number(options.staleDays));
checkLocalArtifacts(backlogDir);

const repo = resolveRepo(options);
if (!options.skipGithub) {
  if (!repo) {
    warnings.push("Could not determine GitHub repository; skipped label check.");
  } else {
    checkGithubLabels(repo);
  }
}

outputResult(
  {
    checks,
    generatedAt: new Date().toISOString(),
    ok: problems.length === 0,
    problems,
    repo,
    warnings,
  },
  options.format,
  formatMarkdown,
);

function checkScaffold(backlogDirPath) {
  for (const path of [
    backlogDirPath,
    join(backlogDirPath, "inbox.md"),
    join(backlogDirPath, "issues.md"),
    join(backlogDirPath, "memory.md"),
    join(backlogDirPath, "prds"),
    join(backlogDirPath, "plans"),
  ]) {
    if (existsSync(path)) {
      checks.push(`found ${toProjectRelative(path)}`);
    } else {
      problems.push(`missing ${toProjectRelative(path)}`);
    }
  }
}

function checkIssuesSnapshot(backlogDirPath, staleDays) {
  const path = join(backlogDirPath, "issues.md");
  if (!existsSync(path)) {
    return;
  }

  const text = readFileSync(path, "utf8");
  if (!text.includes("GENERATED FROM GITHUB ISSUES")) {
    warnings.push(`${toProjectRelative(path)} does not look generated`);
  }

  const match = text.match(/Generated at:\s*([^\n]+)/);
  if (!match) {
    warnings.push(`${toProjectRelative(path)} is missing a Generated at timestamp`);
    return;
  }

  const generatedAt = new Date(match[1]).getTime();
  const cutoff = Date.now() - staleDays * 24 * 60 * 60 * 1000;
  if (Number.isFinite(generatedAt) && generatedAt < cutoff) {
    warnings.push(`${toProjectRelative(path)} is older than ${staleDays} days`);
  }
}

function checkLocalArtifacts(backlogDirPath) {
  for (const path of markdownFiles(join(backlogDirPath, "prds"))) {
    const text = readFileSync(path, "utf8");
    if (!/^---\n[\s\S]*?\n---/.test(text)) {
      warnings.push(`${toProjectRelative(path)} is missing frontmatter`);
    }
    if (/status:\s*promoted\b/.test(text) && !/issue:\s*\S+/.test(text)) {
      problems.push(`${toProjectRelative(path)} is promoted but missing issue link`);
    }
  }

  for (const path of markdownFiles(join(backlogDirPath, "plans"))) {
    const text = readFileSync(path, "utf8");
    if (!/^---\n[\s\S]*?\n---/.test(text)) {
      warnings.push(`${toProjectRelative(path)} is missing frontmatter`);
    }
    if (!/^## Verification\b/m.test(text)) {
      warnings.push(`${toProjectRelative(path)} is missing a Verification section`);
    }
  }
}

function checkGithubLabels(repo) {
  let labels;
  try {
    labels = ghJson(["label", "list", "--repo", repo, "--limit", "200", "--json", "name"]);
  } catch (error) {
    warnings.push(error.message);
    return;
  }

  const existing = new Set(labels.map((label) => label.name));
  for (const label of CANONICAL_LABELS) {
    if (!existing.has(label)) {
      problems.push(`missing GitHub label ${label}`);
    }
  }
}

function markdownFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const files = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...markdownFiles(path));
    } else if (name.endsWith(".md")) {
      files.push(path);
    }
  }
  return files;
}

function formatMarkdown(result) {
  const lines = [
    "# Backlog Status",
    "",
    `Repo: ${result.repo || "unknown"}`,
    `Result: ${result.ok ? "ok" : "needs attention"}`,
    "",
  ];

  lines.push("## Problems", "");
  if (result.problems.length === 0) {
    lines.push("- None.");
  } else {
    for (const problem of result.problems) {
      lines.push(`- ${problem}`);
    }
  }

  lines.push("", "## Warnings", "");
  if (result.warnings.length === 0) {
    lines.push("- None.");
  } else {
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function printHelp() {
  console.log(`Usage: node scripts/backlog-status.mjs [options]

Validate deterministic backlog health checks.

Options:
  --repo owner/repo       GitHub repository. Defaults to remote.origin.url.
  --remote name          Git remote to inspect when --repo is omitted. Default: origin.
  --backlog-dir path     Backlog directory. Default: .backlog.
  --stale-days number    Warn when issues.md is older than this. Default: 30.
  --skip-github          Skip GitHub label checks.
  --format json|markdown Output format. Default: markdown.
  --help                 Show this help message.

Examples:
  node scripts/backlog-status.mjs
  node scripts/backlog-status.mjs --skip-github --format json
`);
}

#!/usr/bin/env node

import {
  analyzeIssue,
  failUsage,
  issueList,
  outputResult,
  parseCommonArgs,
  priorityRank,
  resolveRepo,
} from "./backlog-lib.mjs";

const options = parseCommonArgs(process.argv.slice(2), {
  booleanOptions: ["include-ready"],
});

if (options.help) {
  printHelp();
  process.exit(0);
}

const repo = resolveRepo(options);
if (!repo) {
  failUsage("Could not determine GitHub repository. Pass --repo owner/repo.");
}

let issues;
try {
  issues = issueList({ repo, state: "open", limit: options.limit });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const candidates = issues
  .map((issue) => {
    const analysis = analyzeIssue(issue, { staleDays: options.staleDays });
    return { ...issue, analysis };
  })
  .filter((issue) => options.includeReady || issue.analysis.reasons.length > 0)
  .sort((left, right) => {
    const priorityDelta =
      priorityRank(left.analysis.priority) - priorityRank(right.analysis.priority);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return right.analysis.reasons.length - left.analysis.reasons.length;
  });

outputResult(
  {
    candidates,
    count: candidates.length,
    generatedAt: new Date().toISOString(),
    repo,
  },
  options.format,
  formatMarkdown,
);

function formatMarkdown(result) {
  const lines = [
    "# Backlog Refinement Candidates",
    "",
    `Repo: ${result.repo}`,
    `Open issues needing refinement: ${result.count}`,
    "",
  ];

  if (result.candidates.length === 0) {
    lines.push("No refinement candidates found.", "");
    return lines.join("\n");
  }

  for (const issue of result.candidates) {
    lines.push(`- [#${issue.number} ${issue.title}](${issue.url})`);
    lines.push(`  - Labels: ${issue.analysis.labels.join(", ") || "none"}`);
    lines.push(`  - Reasons: ${issue.analysis.reasons.join("; ")}`);
    lines.push(`  - Updated: ${issue.updatedAt || "unknown"}`);
  }

  lines.push("");
  lines.push("Read full issue bodies only for candidates you are actively refining.");
  lines.push("");
  return lines.join("\n");
}

function printHelp() {
  console.log(`Usage: node scripts/backlog-refinement-candidates.mjs [options]

List open GitHub Issues that need refinement or label cleanup.

Options:
  --repo owner/repo       GitHub repository. Defaults to remote.origin.url.
  --remote name          Git remote to inspect when --repo is omitted. Default: origin.
  --limit number         Maximum open issues to fetch. Default: 50.
  --stale-days number    Flag issues not updated for this many days. Default: 30.
  --include-ready        Include issues with no detected refinement problems.
  --format json|markdown Output format. Default: markdown.
  --help                 Show this help message.

Examples:
  node scripts/backlog-refinement-candidates.mjs
  node scripts/backlog-refinement-candidates.mjs --repo owner/repo --format json
`);
}

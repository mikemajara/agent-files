#!/usr/bin/env node

import {
  analyzeIssue,
  failUsage,
  issueList,
  issueView,
  makeSearchQuery,
  outputResult,
  parseCommonArgs,
  prList,
  resolveRepo,
} from "./backlog-lib.mjs";

const options = parseCommonArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const issueNumber = options.positionals[0];
if (!issueNumber) {
  failUsage("Missing issue number.");
}

const repo = resolveRepo(options);
if (!repo) {
  failUsage("Could not determine GitHub repository. Pass --repo owner/repo.");
}

let issue;
try {
  issue = issueView({ repo, number: issueNumber });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const analysis = analyzeIssue(issue, { staleDays: options.staleDays });
const search = options.search || makeSearchQuery(issue.title, issue.body);
let relatedIssues = [];
let openPullRequests = [];

try {
  relatedIssues = issueList({
    repo,
    state: "all",
    limit: options.limit,
    search,
  }).filter((related) => Number(related.number) !== Number(issue.number));
  openPullRequests = prList({ repo, limit: "10", search });
} catch (error) {
  analysis.reasons.push(`related search failed: ${error.message}`);
}

outputResult(
  {
    analysis,
    issue,
    openPullRequests,
    relatedIssues,
    repo,
    search,
  },
  options.format,
  formatMarkdown,
);

function formatMarkdown(result) {
  const lines = [
    `# Issue Audit: #${result.issue.number}`,
    "",
    `[${result.issue.title}](${result.issue.url})`,
    "",
    `State: ${result.issue.state}`,
    `Labels: ${result.analysis.labels.join(", ") || "none"}`,
    `Updated: ${result.issue.updatedAt || "unknown"}`,
    "",
    "## Refinement Signals",
    "",
  ];

  if (result.analysis.reasons.length === 0) {
    lines.push("- No deterministic refinement issues found.");
  } else {
    for (const reason of result.analysis.reasons) {
      lines.push(`- ${reason}`);
    }
  }

  lines.push("", "## Related Issues", "");
  if (result.relatedIssues.length === 0) {
    lines.push("- None found.");
  } else {
    for (const related of result.relatedIssues) {
      lines.push(`- [#${related.number} ${related.title}](${related.url})`);
    }
  }

  lines.push("", "## Open Pull Requests", "");
  if (result.openPullRequests.length === 0) {
    lines.push("- None found.");
  } else {
    for (const pr of result.openPullRequests) {
      lines.push(`- [#${pr.number} ${pr.title}](${pr.url})`);
    }
  }

  lines.push("", `Search query: \`${result.search}\``, "");
  return lines.join("\n");
}

function printHelp() {
  console.log(`Usage: node scripts/backlog-issue-audit.mjs ISSUE_NUMBER [options]

Fetch one GitHub Issue and emit a compact refinement packet.

Options:
  --repo owner/repo       GitHub repository. Defaults to remote.origin.url.
  --remote name          Git remote to inspect when --repo is omitted. Default: origin.
  --limit number         Maximum related issues to fetch. Default: 50.
  --search text          Override the related issue/PR search query.
  --stale-days number    Flag issue if not updated for this many days. Default: 30.
  --format json|markdown Output format. Default: markdown.
  --help                 Show this help message.

Examples:
  node scripts/backlog-issue-audit.mjs 123
  node scripts/backlog-issue-audit.mjs 123 --format json
`);
}

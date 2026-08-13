#!/usr/bin/env node

import {
  collectLocalArtifacts,
  failUsage,
  issueList,
  makeSearchQuery,
  outputResult,
  overlapScore,
  parseCommonArgs,
  prList,
  resolveRepo,
} from "./backlog-lib.mjs";

const options = parseCommonArgs(process.argv.slice(2), {
  booleanOptions: ["skip-github"],
});

if (options.help) {
  printHelp();
  process.exit(0);
}

if (!options.title) {
  failUsage("Missing --title.");
}

const repo = resolveRepo(options);
const proposedText = [options.title, options.body || ""].join("\n\n");
const search = options.search || makeSearchQuery(options.title, options.body || "");
const localMatches = collectLocalArtifacts(options.backlogDir)
  .map((artifact) => ({
    ...artifact,
    score: overlapScore(proposedText, `${artifact.title}\n${artifact.text}`),
  }))
  .filter((artifact) => artifact.score > 0)
  .sort((left, right) => right.score - left.score)
  .slice(0, Number(options.limit));

let issueMatches = [];
let openPullRequests = [];
let warnings = [];

if (options.skipGithub) {
  warnings.push("Skipped cloud dedupe by request.");
} else if (repo && search) {
  try {
    issueMatches = issueList({
      repo,
      state: "all",
      limit: options.limit,
      search,
    }).map((issue) => ({
      ...issue,
      score: overlapScore(proposedText, `${issue.title}\n${issue.body || ""}`),
    }));
    openPullRequests = prList({ repo, limit: "10", search });
  } catch (error) {
    warnings.push(error.message);
  }
} else if (!repo) {
  warnings.push("Could not determine GitHub repository; skipped cloud dedupe.");
}

outputResult(
  {
    issueMatches,
    localMatches,
    openPullRequests,
    proposed: {
      body: options.body || "",
      title: options.title,
    },
    repo,
    search,
    warnings,
  },
  options.format,
  formatMarkdown,
);

function formatMarkdown(result) {
  const lines = [
    "# Backlog Dedupe Evidence",
    "",
    `Proposed: ${result.proposed.title}`,
    `Search query: \`${result.search || "none"}\``,
    "",
  ];

  for (const warning of result.warnings) {
    lines.push(`Warning: ${warning}`, "");
  }

  lines.push("## Local Matches", "");
  if (result.localMatches.length === 0) {
    lines.push("- None found.");
  } else {
    for (const match of result.localMatches) {
      lines.push(
        `- ${match.type} ${match.path}: ${match.title} (score ${match.score.toFixed(2)})`,
      );
    }
  }

  lines.push("", "## GitHub Issue Matches", "");
  if (result.issueMatches.length === 0) {
    lines.push("- None found.");
  } else {
    for (const issue of result.issueMatches) {
      lines.push(
        `- [#${issue.number} ${issue.title}](${issue.url}) (score ${issue.score.toFixed(2)})`,
      );
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

  lines.push("");
  return lines.join("\n");
}

function printHelp() {
  console.log(`Usage: node scripts/backlog-dedupe.mjs --title "Task title" [options]

Search local backlog artifacts, GitHub Issues, and open PRs for overlap.

Options:
  --title text           Proposed task title. Required.
  --body text            Proposed task body or symptom details.
  --repo owner/repo      GitHub repository. Defaults to remote.origin.url.
  --remote name          Git remote to inspect when --repo is omitted. Default: origin.
  --backlog-dir path     Backlog directory. Default: .backlog.
  --limit number         Maximum local/issues matches to return. Default: 50.
  --search text          Override the GitHub search query.
  --skip-github          Only search local backlog artifacts.
  --format json|markdown Output format. Default: markdown.
  --help                 Show this help message.

Examples:
  node scripts/backlog-dedupe.mjs --title "Repair login redirect"
  node scripts/backlog-dedupe.mjs --title "Repair login redirect" --body "Users return to the wrong page" --format json
`);
}

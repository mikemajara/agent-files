import { execFileSync } from "node:child_process";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { basename, join, relative, resolve } from "node:path";

export const TYPE_LABELS = ["type:feat", "type:fix", "type:nit"];
export const PRIORITY_LABELS = [
  "priority:high",
  "priority:medium",
  "priority:low",
];
export const STATUS_LABELS = [
  "status:unknown",
  "status:doing",
  "status:ready",
  "status:blocked",
  "status:duplicate",
];

export const CANONICAL_LABELS = [
  ...TYPE_LABELS,
  ...PRIORITY_LABELS,
  ...STATUS_LABELS,
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
]);

export function parseCommonArgs(argv, config = {}) {
  const parsed = {
    backlogDir: ".backlog",
    format: "markdown",
    limit: "50",
    remote: "origin",
    repo: "",
    staleDays: "30",
  };
  const positionals = [];
  const booleanOptions = new Set(config.booleanOptions || []);
  const stringOptions = new Set([
    "backlog-dir",
    "body",
    "format",
    "limit",
    "output",
    "remote",
    "repo",
    "search",
    "stale-days",
    "state",
    "title",
    ...(config.stringOptions || []),
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const [rawName, inlineValue] = arg.slice(2).split("=", 2);
    const key = toCamelCase(rawName);

    if (booleanOptions.has(rawName)) {
      parsed[key] = true;
      continue;
    }

    if (!stringOptions.has(rawName)) {
      failUsage(`Unknown option: --${rawName}`);
    }

    const value = inlineValue ?? argv[index + 1];
    if (!inlineValue) {
      index += 1;
    }

    if (!value || value.startsWith("--")) {
      failUsage(`Missing value for --${rawName}`);
    }

    parsed[key] = value;
  }

  parsed.positionals = positionals;
  return parsed;
}

export function resolveRepo(options) {
  return options.repo || getRepoFromGitRemote(options.remote || "origin");
}

export function getRepoFromGitRemote(remote) {
  try {
    const url = execFileSync("git", ["config", "--get", `remote.${remote}.url`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return parseGitHubRepo(url);
  } catch {
    return "";
  }
}

export function parseGitHubRepo(url) {
  const patterns = [
    /^https:\/\/github\.com\/([^/]+\/[^/]+?)\/?$/,
    /^git@github\.com:([^/]+\/[^/]+?)$/,
    /^ssh:\/\/git@github\.com\/([^/]+\/[^/]+?)\/?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].replace(/\.git$/, "");
    }
  }

  return "";
}

export function ghJson(args) {
  try {
    const output = execFileSync("gh", args, { encoding: "utf8" });
    return JSON.parse(output);
  } catch (error) {
    const message = error.stderr || error.message;
    throw new Error(`gh failed: ${message}`);
  }
}

export function issueList({ repo, state = "open", limit = "50", search = "" }) {
  const fields = [
    "assignees",
    "body",
    "labels",
    "number",
    "state",
    "title",
    "updatedAt",
    "url",
  ].join(",");
  const args = [
    "issue",
    "list",
    "--state",
    state,
    "--limit",
    String(limit),
    "--json",
    fields,
  ];

  if (repo) {
    args.push("--repo", repo);
  }
  if (search) {
    args.push("--search", search);
  }

  return ghJson(args);
}

export function issueView({ repo, number }) {
  const fields = [
    "assignees",
    "body",
    "comments",
    "labels",
    "number",
    "state",
    "title",
    "updatedAt",
    "url",
  ].join(",");
  const args = ["issue", "view", String(number), "--json", fields];

  if (repo) {
    args.push("--repo", repo);
  }

  return ghJson(args);
}

export function prList({ repo, limit = "20", search = "" }) {
  const fields = ["number", "state", "title", "updatedAt", "url"].join(",");
  const args = [
    "pr",
    "list",
    "--state",
    "open",
    "--limit",
    String(limit),
    "--json",
    fields,
  ];

  if (repo) {
    args.push("--repo", repo);
  }
  if (search) {
    args.push("--search", search);
  }

  return ghJson(args);
}

export function labelNames(issue) {
  return (issue.labels || []).map((label) => label.name || label).filter(Boolean);
}

export function analyzeIssue(issue, { staleDays = 30 } = {}) {
  const labels = labelNames(issue);
  const reasons = [];
  const typeLabels = labels.filter((label) => TYPE_LABELS.includes(label));
  const priorityLabels = labels.filter((label) => PRIORITY_LABELS.includes(label));
  const statusLabels = labels.filter((label) => STATUS_LABELS.includes(label));
  const statusUnknown = statusLabels.includes("status:unknown");
  const body = issue.body || "";

  if (typeLabels.length === 0) {
    reasons.push("missing type label");
  } else if (typeLabels.length > 1) {
    reasons.push(`multiple type labels: ${typeLabels.join(", ")}`);
  }

  if (priorityLabels.length > 1) {
    reasons.push(`multiple priority labels: ${priorityLabels.join(", ")}`);
  }

  if (statusLabels.length === 0) {
    reasons.push("missing status label");
  } else if (statusLabels.length > 1) {
    reasons.push(`multiple status labels: ${statusLabels.join(", ")}`);
  }

  if (statusUnknown) {
    reasons.push("status:unknown");
  }

  if (!body.trim()) {
    reasons.push("empty issue body");
  } else if (!hasAcceptanceCriteria(body)) {
    reasons.push("missing acceptance criteria");
  }

  if (isStale(issue.updatedAt, staleDays) && !labels.includes("status:blocked")) {
    reasons.push(`not updated in ${staleDays}+ days`);
  }

  return {
    labels,
    priority: priorityLabels[0] || "",
    reasons,
    status: statusLabels[0] || "",
    type: typeLabels[0] || "",
  };
}

export function hasAcceptanceCriteria(text) {
  return /(^|\n)#{1,6}\s*acceptance criteria\b/i.test(text) ||
    /\bacceptance criteria\b/i.test(text) ||
    /(^|\n)\s*-\s*\[[ xX]\]\s+/.test(text);
}

export function isStale(updatedAt, staleDays) {
  if (!updatedAt || Number.isNaN(Number(staleDays))) {
    return false;
  }

  const updated = new Date(updatedAt).getTime();
  const cutoff = Date.now() - Number(staleDays) * 24 * 60 * 60 * 1000;
  return updated < cutoff;
}

export function priorityRank(priority) {
  switch (priority) {
    case "priority:high":
      return 0;
    case "priority:medium":
      return 1;
    case "priority:low":
      return 2;
    default:
      return 3;
  }
}

export function makeSearchQuery(...parts) {
  return tokenize(parts.filter(Boolean).join(" ")).slice(0, 8).join(" ");
}

export function tokenize(text) {
  return Array.from(
    new Set(
      String(text)
        .toLowerCase()
        .replace(/[`*_()[\]{}#|:;,.!?/\\-]/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
    ),
  );
}

export function overlapScore(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = new Set(tokenize(right));

  if (leftTokens.length === 0 || rightTokens.size === 0) {
    return 0;
  }

  const matches = leftTokens.filter((token) => rightTokens.has(token));
  return matches.length / leftTokens.length;
}

export function collectLocalArtifacts(backlogDir = ".backlog") {
  const root = resolve(backlogDir);
  const artifacts = [];

  addInboxArtifacts(artifacts, root);
  addFileArtifacts(artifacts, root, "prds", "prd");
  addFileArtifacts(artifacts, root, "plans", "plan");

  const issuesPath = join(root, "issues.md");
  if (existsSync(issuesPath)) {
    artifacts.push({
      path: toProjectRelative(issuesPath),
      text: readFile(issuesPath),
      title: "Generated GitHub Issues snapshot",
      type: "issues-snapshot",
    });
  }

  return artifacts;
}

export function formatIssueLine(issue, analysis) {
  const labels = analysis?.labels || labelNames(issue);
  const labelText = labels.length > 0 ? labels.join(", ") : "no labels";
  return `#${issue.number} ${issue.title} (${labelText})`;
}

export function outputResult(result, format, markdownFormatter) {
  if (format === "json") {
    console.log(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (format !== "markdown") {
    failUsage(`Invalid --format "${format}". Use json or markdown.`);
  }

  console.log(markdownFormatter(result));
}

export function failUsage(message) {
  console.error(message);
  console.error("Run with --help for usage.");
  process.exit(1);
}

export function toProjectRelative(path) {
  return relative(process.cwd(), path) || basename(path);
}

function addInboxArtifacts(artifacts, root) {
  const inboxPath = join(root, "inbox.md");
  if (!existsSync(inboxPath)) {
    return;
  }

  const text = readFile(inboxPath);
  const itemPattern = /^-\s+\[[ xX]\]\s+(.*)$/gm;
  let match;

  while ((match = itemPattern.exec(text))) {
    artifacts.push({
      path: toProjectRelative(inboxPath),
      text: match[1],
      title: extractBoldTitle(match[1]) || match[1],
      type: "inbox",
    });
  }
}

function addFileArtifacts(artifacts, root, dirName, type) {
  const dir = join(root, dirName);
  if (!existsSync(dir)) {
    return;
  }

  for (const filePath of listMarkdownFiles(dir)) {
    const text = readFile(filePath);
    artifacts.push({
      path: toProjectRelative(filePath),
      text,
      title: extractTitle(text) || basename(filePath, ".md"),
      type,
    });
  }
}

function listMarkdownFiles(dir) {
  const entries = [];

  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      entries.push(...listMarkdownFiles(path));
    } else if (name.endsWith(".md")) {
      entries.push(path);
    }
  }

  return entries;
}

function extractTitle(text) {
  const frontmatterTitle = text.match(/^---[\s\S]*?\ntitle:\s*(.+?)\n[\s\S]*?---/);
  if (frontmatterTitle) {
    return frontmatterTitle[1].trim().replace(/^["']|["']$/g, "");
  }

  const heading = text.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : "";
}

function extractBoldTitle(text) {
  const match = text.match(/\*\*(.+?)\*\*/);
  return match ? match[1].trim() : "";
}

function readFile(path) {
  return readFileSync(path, "utf8");
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

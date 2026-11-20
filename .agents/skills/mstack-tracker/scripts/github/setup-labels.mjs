#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const report = { repo: "", mode: "check", changes: [], applied: [] };

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(`Usage: node setup-labels.mjs --repo OWNER/REPO [options]

  --check               Compare labels and metadata (default); exit 1 on differences
  --dry-run             Preview changes without writing; exit 0 on a successful read
  --apply               Create/update configured labels and verify the result
  --format json|text    Output format (default: text)
  --help                Show this help

Requires Node.js and authenticated gh access to the target repository.
Uses gh's configured API host. Exit 2 means an operation or verification failed.`);
  } else {
    report.repo = options.repo;
    report.mode = options.mode;
    const labels = loadLabels();
    report.changes = compare(labels, readLabels(options.repo));

    if (options.mode === "apply" && report.changes.length > 0) {
      for (const change of report.changes) {
        const label = labels.find((entry) => entry.name === change.name);
        gh([
          "label", "create", label.name, "--repo", options.repo,
          "--color", label.color, "--description", label.description, "--force",
        ]);
        report.applied.push(change);
      }
      const remaining = compare(labels, readLabels(options.repo));
      if (remaining.length > 0) {
        report.remaining = remaining;
        throw new Error("Label verification failed; read current labels before retrying.");
      }
    }

    report.ok = options.mode === "apply" || report.changes.length === 0;
    output(report, options.format);
    if (options.mode === "check" && !report.ok) process.exitCode = 1;
  }
} catch (error) {
  report.ok = false;
  report.error = error.message;
  // Preserve machine output even for invalid arguments or partial writes.
  const argv = process.argv.slice(2);
  const json = argv.some((arg, index) =>
    arg === "--format=json" || (arg === "--format" && argv[index + 1] === "json"));
  output(report, json ? "json" : "text");
  process.exitCode = 2;
}

function parseArgs(argv) {
  const options = { repo: "", mode: "check", format: "text" };
  const modes = [];
  for (let index = 0; index < argv.length; index += 1) {
    const [flag, inline] = argv[index].split(/=(.*)/s, 2);
    if (["--check", "--dry-run", "--apply", "--help"].includes(flag)) {
      if (inline !== undefined) throw new Error(`${flag} does not take a value.`);
      if (flag === "--help") options.help = true;
      else modes.push(flag.slice(2));
    } else if (flag === "--repo" || flag === "--format") {
      const value = inline ?? argv[++index];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}.`);
      options[flag.slice(2)] = value;
    } else {
      throw new Error(`Unknown argument: ${argv[index]}`);
    }
  }
  if (options.help) return options;
  if (modes.length > 1) throw new Error("Choose only one of --check, --dry-run or --apply.");
  if (!/^[\w.-]+\/[\w.-]+$/.test(options.repo)) {
    throw new Error("Pass an explicit --repo OWNER/REPO.");
  }
  if (!["text", "json"].includes(options.format)) throw new Error("Use --format text or json.");
  options.mode = modes[0] ?? "check";
  return options;
}

function loadLabels() {
  const labels = JSON.parse(readFileSync(
    new URL("../../references/github-labels.json", import.meta.url), "utf8"));
  if (!Array.isArray(labels) || labels.length === 0) throw new Error("Label mapping is empty or invalid.");
  const names = new Set();
  for (const label of labels) {
    if (!label || typeof label.name !== "string" || !label.name || names.has(label.name)
      || !/^[0-9a-f]{6}$/i.test(label.color) || typeof label.description !== "string") {
      throw new Error("Label mapping contains an invalid or duplicate entry.");
    }
    names.add(label.name);
  }
  return labels;
}

function gh(args) {
  try {
    return execFileSync("gh", args, {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`GitHub operation failed: ${detail}`);
  }
}

function readLabels(repo) {
  // Emit one JSON object per line across all pages, avoiding a capped label list.
  const result = gh([
    "api", "--method", "GET", "--paginate", `repos/${repo}/labels?per_page=100`,
    "--jq", ".[] | {name, color, description} | @json",
  ]);
  return result.split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    const label = JSON.parse(line);
    if (!label || typeof label.name !== "string" || typeof label.color !== "string"
      || (label.description != null && typeof label.description !== "string")) {
      throw new Error("GitHub returned an invalid label record.");
    }
    return label;
  });
}

function compare(expected, actual) {
  const existing = new Map(actual.map((label) => [label.name, label]));
  return expected.flatMap((label) => {
    const current = existing.get(label.name);
    if (!current) return [{ name: label.name, action: "create" }];
    const fields = ["color", "description"].filter((field) =>
      field === "color"
        ? current.color.toUpperCase() !== label.color.toUpperCase()
        : (current.description ?? "") !== label.description);
    return fields.length ? [{ name: label.name, action: "update", fields }] : [];
  });
}

function output(result, format) {
  if (format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`Labels: ${result.repo || "(no repository)"} (${result.mode})`);
  for (const change of result.changes) {
    console.log(`${change.action}: ${change.name}${change.fields ? ` (${change.fields.join(", ")})` : ""}`);
  }
  if (result.applied.length) console.log(`Writes acknowledged: ${result.applied.map((entry) => entry.name).join(", ")}`);
  if (result.error) console.error(result.error);
  else if (result.mode === "apply") console.log("Configured labels verified.");
  else if (result.mode === "dry-run") console.log(`${result.changes.length} proposed change(s); no writes.`);
  else console.log(result.ok ? "Configured labels match." : "Configured labels differ.");
}

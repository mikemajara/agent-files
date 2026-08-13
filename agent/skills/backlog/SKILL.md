---
description: "Lightweight project backlog workflow and shared contract for phase skills.\nUse when starting a project, creating or maintaining a `.backlog/` folder,\ncapturing inbox ideas, promoting work to GitHub Issues, reviewing or triaging\nthe queue, checking for duplicate or overlapping tasks, or keeping project\ntask memory current. For dedicated research, refine/PRD, or plan passes in\nmulti-agent workflows, prefer backlog-research, backlog-refine, or\nbacklog-plan alongside this skill.\n"
---
# Backlog

Use this skill to manage lightweight project memory in `.backlog/`.

The goal is useful continuity, not process ceremony. Create only the artifacts
that reduce ambiguity for the current task.

This skill is the **contract** for structure, labels, verify/dedupe, Review,
Triage, Capture, Promote, and shared scripts. Thin phase skills
(`backlog-research`, `backlog-refine`, `backlog-plan`) own phase judgment for
multi-agent runs. See `references/phase-skills.md` for the phase map and
manual handoff packet.

## Core Structure

When the user asks to initialize or use the backlog workflow, first check whether
`.backlog/` exists. If it does not exist and the user is starting a project or
explicitly asks to initialize the backlog, create:

```text
.backlog/
  inbox.md
  prds/
  plans/
  memory.md
```

Use these roles:

- `.backlog/inbox.md`: raw ideas, bugs, chores, and nitpicks not yet promoted
  to GitHub Issues.
- `.backlog/prds/PRD-[slug].md`: temporary drafting artifact for large or
  ambiguous work before it is promoted to GitHub. After promotion, delete it or
  replace it with a tiny pointer only if the user wants local traceability.
- `.backlog/plans/PLAN-[slug].md`: implementation sequencing for non-trivial
  changes.
- `.backlog/memory.md`: durable decisions, conventions, blockers, gotchas, and
  context future agents should remember.

GitHub Issues are canonical for any promoted task. If an item has a GitHub
Issue, GitHub owns its title, body, status, labels, discussion, and assignment.
Do not keep a second editable copy of the same promoted artifact in `.backlog/`.
Local PRDs are drafting buffers before promotion; local plans are execution
notes when implementation needs sequencing.

## Bootstrap Content

Create `.backlog/inbox.md` with:

```markdown
# Backlog Inbox

Raw ideas not yet promoted to GitHub Issues.

## Inbox
```

Create `.backlog/memory.md` with:

```markdown
# Backlog Memory

## Decisions

## Blockers

## Project Conventions

## Gotchas
```

Keep `prds/` and `plans/` empty until they are needed.

## Project Setup

When initializing backlog in a repository, prefer the bundled setup helper over
hand-rolling labels or starter files:

```bash
node path/to/skills/backlog/scripts/backlog-setup.mjs
```

After installing the skill locally, run it from the project root using the
installed script path. The helper is idempotent:

- Creates missing `.backlog/` folders and starter files only when absent.
- Upserts the canonical GitHub labels with `gh label create --force`.
- Never overwrites existing `inbox.md` or `memory.md`.
- Never deletes legacy labels or legacy `.backlog/` files.

Useful flags:

```bash
node backlog-setup.mjs --dry-run
node backlog-setup.mjs --check
node backlog-setup.mjs --skip-labels
node backlog-setup.mjs --skip-scaffold
```

### Optional GitHub Issues mirror

Projects that want local visibility into promoted work can regenerate a
read-only snapshot at `.backlog/issues.md`:

```bash
node path/to/skills/backlog/scripts/backlog-sync.mjs
```

The helper requires Node.js and the GitHub CLI, but no npm dependencies. It
discovers the repository from `git remote`, fetches issues with `gh issue list`,
and rewrites `.backlog/issues.md`. GitHub remains canonical; treat the file as
generated output only.

Useful flags:

```bash
node backlog-sync.mjs --dry-run
node backlog-sync.mjs --repo owner/repo --state open --limit 500
node backlog-sync.mjs --output .backlog/issues.md
```

Regenerate after promoting work, changing labels, or when agents need a fresh
local snapshot. Prefer live `gh` queries for dedupe and triage when available.

Canonical label names and descriptions live in
`references/labels.json`. Update that file when the label framework changes,
then rerun setup so existing repos pick up the new definitions safely.

## Inbox Item Format

Use compact inbox items:

```markdown
- [ ] [type] [priority] **Title**. Short description.
```

Allowed types:

- `feat`: new user-facing capability
- `fix`: broken or incorrect behavior
- `nit`: small polish, copy, cleanup, tiny UX adjustment, or low-risk
  refinement

Allowed priorities:

- `high`
- `medium`
- `low`

Example:

```markdown
- [ ] [fix] [high] **Repair login redirect**. Users return to the wrong page after sign-in.
```

When an inbox item is promoted, remove it from `.backlog/inbox.md` or replace it
with a short link to the GitHub Issue. Do not track promoted status in the inbox.

## Slugs

Use a slug when a task gets a PRD, plan, branch, or issue link.

Rules:

- lowercase kebab-case
- max 30 characters
- only `a-z`, `0-9`, and `-`
- unique within `.backlog/prds/` and `.backlog/plans/`

Examples:

- `Repair login redirect` -> `login-redirect`
- `Dashboard analytics` -> `dashboard-analytics`

## Verify Before Add or Promote

Before adding an inbox item, creating a PRD or plan, or promoting work to
GitHub Issues, check whether the task already exists or overlaps with tracked
work. Do this every time unless the user explicitly asked to skip dedupe.

Prefer the deterministic dedupe helper before manually reading many files or
issues:

```bash
node scripts/backlog-dedupe.mjs --title "Repair login redirect" --body "Users return to the wrong page after sign-in."
node scripts/backlog-dedupe.mjs --title "Repair login redirect" --format json
```

Use the helper output as evidence. The agent still decides whether overlap is
an exact duplicate, related work, or safe to create separately.

### Local checks

1. Read `.backlog/inbox.md` and scan titles, types, and short descriptions.
2. List `.backlog/prds/` and `.backlog/plans/` for matching slugs, titles, or
   scope.
3. Skim `.backlog/memory.md` for decisions, blockers, or gotchas that already
   cover the idea.

### Cloud checks

Prefer live GitHub search when `gh` is available:

```bash
gh issue list --state all --search "login redirect" --limit 20
gh issue list --state open --label "type:fix" --limit 50
gh issue view 123
gh pr list --state open --search "login redirect" --limit 10
```

Use keywords from the proposed title, affected area, error message, file path,
or user-facing symptom. Search open issues first, then closed issues when the
bug or feature may already have been filed or finished.

### Overlap signals

Treat these as likely duplicates or related work, not just exact title matches:

- Same symptom, bug, or user-facing behavior
- Same subsystem, route, component, or file path
- Same or near-identical slug
- One item is a subset or superset of another (`fix login redirect` vs
  `auth overhaul`)
- An open PR, plan, or PRD already tracks the same outcome

### When overlap is found

- **Exact duplicate**: do not add or promote. Link to the existing inbox item,
  issue, PRD, or plan.
- **Same work, different wording**: update or comment on the existing artifact.
  Do not create a second tracker.
- **Related but distinct**: create only if scope is genuinely separate. Cross-link
  in the body (`Related to #123`) or use GitHub blocked-by / blocks references
  when one depends on the other.
- **Superseded**: close, remove, or archive the stale item and point to the
  canonical one.
- **Uncertain**: tell the user what matched and ask whether to extend the
  existing item or create a new one.

After resolving overlap, proceed with Capture, Promote, Research, Refine, or
Plan (phase skills when running a dedicated multi-agent pass).

## Workflow

### Capture

When the user shares an idea, bug, nitpick, or task:

1. Ensure `.backlog/` exists if the user wants the backlog workflow active.
2. Run **Verify Before Add or Promote** against local and cloud trackers.
3. If the item is rough or not ready for GitHub, add it under `## Inbox` in
   `.backlog/inbox.md`.
4. If the item is ready to track, create or update a GitHub Issue when the user
   wants GitHub-backed tracking.
5. Choose type and priority from the user's wording and project context.
6. Keep the item short. Put deeper context in a PRD only when needed.

### Promote

When promoting local work to GitHub Issues:

1. Run **Verify Before Add or Promote** again, focusing on GitHub Issues and
   any open PRs for the same area.
2. If the work has a PRD, create or update the GitHub Issue from the PRD
   content.
3. Verify the GitHub Issue contains the canonical title, body, labels, and
   acceptance criteria.
4. Remove the inbox item or replace it with the issue URL.
5. Regenerate `.backlog/issues.md` when the project uses sync tooling.
6. Delete the promoted PRD unless the user explicitly wants a tiny pointer file.
7. If keeping a pointer file, include only frontmatter and a short note that the
   GitHub Issue is canonical.
8. Choose labels from the user's wording and project context.

Pointer file example:

```markdown
---
slug: [slug]
status: promoted
issue: [GitHub issue URL]
promoted_at: [ISO-8601 timestamp]
---

Canonical artifact lives in GitHub Issue #[number].
```

Use this GitHub label framework:

- `type:feat`, `type:fix`, `type:nit`
- `priority:high`, `priority:medium`, `priority:low`
- `status:unknown`, `status:doing`, `status:ready`, `status:blocked`,
  `status:duplicate`

Use exactly one `type:*` label:

- `type:feat`: new behavior, capability, surface area, or supported workflow.
- `type:fix`: broken, incorrect, confusing, or regressed behavior.
- `type:nit`: small polish, copy, cleanup, tiny UX adjustment, or low-risk
  refinement.

Use at most one `priority:*` label:

- `priority:high`: important soon, blocks other work, or meaningfully affects
  core UX.
- `priority:medium`: valuable, but not urgent or blocking.
- `priority:low`: nice-to-have, opportunistic, or exploratory.

Use exactly one `status:*` label for promoted open issues:

- `status:unknown`: default promoted state. Needs clarification, research,
  scoping, or acceptance criteria.
- `status:doing`: work is actively in progress. Set this as the very first
  step when an agent or user picks up a task, before any code or refinement
  work. Remove it when the task is paused, blocked, completed, or handed off.
- `status:ready`: clear enough to implement without unresolved product
  decisions.
- `status:blocked`: cannot proceed until a decision or dependency is resolved.
  Link the blocking issue or decision in the issue body or a comment.
- `status:duplicate`: tracks the same outcome as another issue. Always paired
  with a `Duplicate of #N` comment pointing to the canonical issue, and the
  issue should be closed. Keep the original `type:*` and `priority:*` labels
  so history stays searchable.

If any of these labels do not exist in the repository yet, create them with
`gh label create` (see **Querying GitHub** below) before applying them.

### Review

Run a Review when starting a session, picking up work, or cleansing the
backlog. The order matters: in-progress work first, then dedupe, then split
the rest into ready or needs-refinement. See **Querying GitHub** for the exact
`gh` commands behind each step.

For token efficiency, start with the deterministic helper output:

```bash
node scripts/backlog-status.mjs
node scripts/backlog-refinement-candidates.mjs
node scripts/backlog-refinement-candidates.mjs --format json
```

Only fetch full issue bodies for issues you are actively refining or auditing.
For one issue, use:

```bash
node scripts/backlog-issue-audit.mjs 123
node scripts/backlog-issue-audit.mjs 123 --format json
```

1. **Check items already in progress.** Before doing anything else, list open
   issues with `status:doing`. If a task is already in progress, resume or
   unblock it before starting new work. When an agent or user picks up a fresh
   task, the very first action is to apply `status:doing` to its issue so other
   agents and collaborators can see the work is taken.
2. **Cleanse duplicates.** Scan open issues for overlapping titles, slugs,
   subsystems, symptoms, or file paths. When two issues track the same
   outcome, keep the canonical one and on the other: apply `status:duplicate`,
   comment `Duplicate of #N` pointing at the canonical issue, then close it.
   Use the **Overlap signals** rules above to judge close-but-not-identical
   cases.
3. **Sort the remaining open issues into ready or needs-refinement.**
   - `status:ready`: scope, behavior, and acceptance criteria are clear; no
     unresolved product decisions. Eligible for Triage and execution.
   - `status:unknown`: needs research and/or refinement. Either resolve it now
     (or via `backlog-research` / `backlog-refine`) and relabel `status:ready`,
     or leave it tagged `status:unknown` for a dedicated phase pass.
   - `status:blocked`: confirm the blocker is still real. If it has been
     resolved, relabel; if not, ensure the blocker is linked in a comment so
     future agents can see what they are waiting on.

Review does not pick what to work on next; that is **Triage**. Review only
ensures the backlog reflects reality before any decision is made.

### Triage

When choosing what to work on:

1. Prefer `high`, then `medium`, then `low`.
2. Prefer unblocked, well-scoped tasks.
3. For promoted work, read the GitHub Issue first and treat it as canonical.
4. For unpromoted inbox work, either promote it to a GitHub Issue or keep it
   local only if the user wants a tiny one-off task.
5. Add or derive a slug if the task needs a PRD, plan, branch, or issue link.

### Research

When facts are missing for `status:unknown` work, prefer the
`backlog-research` phase skill: audit the issue, gather evidence from code and
related trackers, comment findings, and hand off to refine or block. Do not
invent product decisions or write PRDs/plans in a research pass. See
`references/phase-skills.md`.

### Refine

When product clarity or acceptance criteria are needed, prefer the
`backlog-refine` phase skill. First run **Verify Before Add or Promote**.
Create a local PRD only when the task benefits from product-level
clarification (user-facing feature, ambiguous behavior, multiple acceptance
criteria, meaningful tradeoffs, or work likely to be resumed later). Skip PRDs
for obvious fixes, small chores, and nitpicks.

For promoted work, put canonical scope and acceptance criteria on the GitHub
Issue. Local PRDs at `.backlog/prds/PRD-[slug].md` are temporary drafting
buffers; after promotion, delete them or keep a tiny pointer only if the user
wants local traceability. Full refine procedure and PRD template live in
`backlog-refine`.

### Plan

When implementation needs sequencing, prefer the `backlog-plan` phase skill.
First run **Verify Before Add or Promote**. Create a plan only for multiple
files/subsystems, migration/data/auth/payments/security/deployment risk,
uncertain verification, or work an agent should execute later. Skip plans for
obvious one-step changes.

Plans live at `.backlog/plans/PLAN-[slug].md` and may link a GitHub Issue.
Full plan procedure and template live in `backlog-plan`.

### Execute

When implementing from the backlog:

1. Read the relevant GitHub Issue or inbox item, plus any PRD and plan.
2. Keep edits scoped to the task.
3. Update the plan checklist if a plan exists.
4. Update GitHub Issue status through normal GitHub workflow when the work is
   promoted.
5. Add durable decisions, blockers, or gotchas to `.backlog/memory.md`.

Do not create PRDs or plans retroactively unless they would help future work.

## GitHub Issues

Use GitHub Issues as the source of truth for promoted work:

- GitHub Issue: canonical title, body, status, labels, discussion, assignment,
  and automation.
- `.backlog/inbox.md`: local ideas not yet promoted.
- `.backlog/issues.md`: optional generated snapshot for local visibility when
  sync tooling is enabled.
- PRD: temporary local drafting buffer before promotion; not a parallel copy
  after promotion.
- Plan: local implementation sequence when needed; may reference a GitHub Issue.
- Pull request: code review and final execution record.

When linking them, include issue URLs in the PRD or plan frontmatter. Prefer
GitHub closing keywords such as `Closes #123` in pull requests.

### Querying GitHub

Use the `gh` CLI for live reads and writes. These are the canonical commands
the Review, Verify, Promote, and Triage steps rely on. Run them from inside
the project's git repository so `gh` auto-detects the owner/repo; otherwise
pass `--repo owner/repo`.

Prefer this skill's scripts for repeated deterministic reads:

```bash
node scripts/backlog-status.mjs
node scripts/backlog-refinement-candidates.mjs
node scripts/backlog-issue-audit.mjs 123
node scripts/backlog-dedupe.mjs --title "Repair login redirect"
node scripts/backlog-sync.mjs
```

Use `--format json` when another agent will consume the result. Use Markdown
when reporting to a human. Fall back to raw `gh` commands when a helper does
not cover the exact query or mutation needed.

**Create the labels this skill expects (one-time, idempotent fails are fine):**

```bash
gh label create "type:feat"          --color "1D76DB" --description "New behavior or capability"
gh label create "type:fix"           --color "D73A4A" --description "Broken or incorrect behavior"
gh label create "type:nit"           --color "C2E0C6" --description "Polish, copy, cleanup, tiny UX"
gh label create "priority:high"      --color "B60205" --description "Important soon or blocking"
gh label create "priority:medium"    --color "FBCA04" --description "Valuable but not urgent"
gh label create "priority:low"       --color "0E8A16" --description "Nice-to-have, opportunistic"
gh label create "status:unknown"     --color "D4C5F9" --description "Needs scoping or acceptance criteria"
gh label create "status:doing"       --color "FBCA04" --description "Work actively in progress"
gh label create "status:ready"       --color "0E8A16" --description "Clear enough to implement"
gh label create "status:blocked"     --color "5319E7" --description "Waiting on a decision or dependency"
gh label create "status:duplicate"   --color "CFD3D7" --description "Tracks the same outcome as another issue"
```

**Review step 1 — what is already in progress:**

```bash
gh issue list --state open --label "status:doing" --limit 50
```

**Review step 2 — search for potential duplicates (use keywords from title,
symptom, file path, or affected subsystem):**

```bash
gh issue list --state all --search "<keywords>" --limit 20
gh issue list --state all --search "<keywords> in:title,body" --limit 20
gh issue view 123
```

Mark and close a duplicate against the canonical issue:

```bash
gh issue edit 123 --add-label "status:duplicate" --remove-label "status:unknown,status:ready,status:doing,status:blocked"
gh issue comment 123 --body "Duplicate of #456"
gh issue close 123 --reason "not planned"
```

**Review step 3 — ready vs needs-refinement queues:**

```bash
gh issue list --state open --label "status:ready"   --limit 50
gh issue list --state open --label "status:unknown" --limit 50
gh issue list --state open --label "status:blocked" --limit 50
```

Filter the ready queue by priority for Triage:

```bash
gh issue list --state open --label "status:ready,priority:high"   --limit 50
gh issue list --state open --label "status:ready,priority:medium" --limit 50
```

**Pick up a task (set `status:doing` as the first action):**

```bash
gh issue edit 123 --remove-label "status:ready,status:unknown" --add-label "status:doing"
```

**Hand off, finish, or pause a task:**

```bash
gh issue edit 123 --remove-label "status:doing" --add-label "status:blocked"
gh issue edit 123 --remove-label "status:doing" --add-label "status:ready"
gh issue close 123
```

**Promote an inbox item to a new issue:**

```bash
gh issue create \
  --title "Repair login redirect" \
  --body  "Users return to the wrong page after sign-in." \
  --label "type:fix,priority:high,status:unknown"
```

**Useful JSON output for scripting or generating `.backlog/issues.md`:**

```bash
gh issue list --state open --json number,title,labels,updatedAt,url --limit 100
gh issue view 123 --json number,title,body,labels,state,comments
```

If `gh` is not available, fall back to a freshly regenerated
`.backlog/issues.md` snapshot and search that file instead.

Avoid two-way sync unless the user explicitly asks for it. It needs stable IDs,
conflict handling, deletion behavior, label mapping, and rules for edits from
multiple actors.

## Migration

If an existing project has `.backlog/backlog.md`, treat it as a legacy local
backlog:

1. Ask before rewriting it unless the user explicitly requested migration.
2. Move rough, unpromoted items to `.backlog/inbox.md`.
3. Move or recreate promoted work as GitHub Issues.
4. Stop using `.backlog/backlog.md` once GitHub Issues are canonical.

## Rules

- Prefer the smallest useful artifact.
- Verify local and cloud trackers for duplicates and overlap before adding or
  promoting work.
- Do not require PRDs for small fixes.
- Do not require plans for obvious one-step changes.
- Keep inbox entries readable in plain Markdown.
- Never let Markdown status override GitHub Issue status.
- Treat `.backlog/issues.md` as generated and read-only when sync tooling is
  enabled.
- Do not maintain duplicate editable copies of promoted issue content locally
  and in GitHub.
- Preserve human-written memory and decisions.
- Before editing `.backlog/`, read the relevant existing files.
- When a task is blocked, write the blocker where future agents will see it.

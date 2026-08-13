---
description: "Refine backlog work into clear product scope and acceptance criteria. Use\nwhen an issue needs clarification, status:unknown work should become\nstatus:ready, the user asks to refine or write a PRD, or a multi-agent\nhandoff targets the refine phase. Pair with the backlog contract skill for\nlabels, dedupe, and scripts. Prefer updating the GitHub Issue; use a local\nPRD only as a temporary drafting buffer.\n"
---
# Backlog Refine

Refine turns ambiguous work into implementable product clarity: problem, goal,
requirements, acceptance criteria, and out-of-scope edges.

Shared law (layout, labels, verify/dedupe, GitHub canonical rules) lives in
the `backlog` skill. Read it when those rules are needed. Prefer
`backlog/references/phase-skills.md` for handoff shape.

## When to run

Create deeper refinement (and a PRD only when useful) for:

- user-facing features
- ambiguous behavior
- multiple acceptance criteria
- meaningful scope or tradeoffs
- work likely to be resumed later

Skip PRDs for obvious fixes, small chores, and nitpicks. Those can move
straight to `status:ready` with a tightened issue body, or stay as inbox
items if unpromoted.

If facts are still missing, hand off to `backlog-research` first.

## Input contract

Expect a handoff packet:

1. Issue number (preferred) or inbox title/slug
2. Current `status:*` label
3. Paths to any existing PRD/plan
4. Optional helpers:

```bash
node path/to/skills/backlog/scripts/backlog-issue-audit.mjs 123 --format json
node path/to/skills/backlog/scripts/backlog-refinement-candidates.mjs --format json
```

## Procedure

1. **Claim work**: set `status:doing` on the promoted issue before editing.
2. **Verify** with the `backlog` skill's Verify Before Add or Promote rules so
   refinement does not duplicate existing issues, inbox items, or plans.
3. **Decide artifact size**:
   - Small/clear: update the GitHub Issue body in place (canonical).
   - Large/ambiguous: draft locally, then promote content into the issue.
4. **Local PRD only when needed** at:

```text
.backlog/prds/PRD-[slug].md
```

Template:

```markdown
---
slug: [slug]
title: [title]
status: draft
issue: [GitHub issue URL or blank]
created_at: [ISO-8601 timestamp]
---

# [Title]

## Problem

## Goal

## Requirements

## Acceptance Criteria

- [ ]

## Out of Scope

## Open Questions
```

PRD statuses: `draft`, `ready`, `blocked`, `done`.

5. **Promote draft content into GitHub** when the issue exists: title, body,
   labels, and acceptance criteria on the issue are canonical. Delete the
   local PRD after promotion, or keep only a tiny pointer if the user wants
   local traceability.
6. **Label outcome**:
   - Clear enough to implement → `status:ready` (remove `status:doing` /
     `status:unknown`)
   - Needs a human decision → `status:blocked` with the question linked
7. Clear the `status:doing` claim when this refine agent stops.

## Output contract

- GitHub Issue (promoted work) has clear scope and acceptance criteria, or
  explicit open questions under `status:blocked`
- Optional local PRD only as a draft buffer, never a second editable source
  of truth after promotion
- No implementation plan unless the user also asked for `backlog-plan`

## Done when

Stop when the issue is `status:ready` (implementable without unresolved
product decisions) or `status:blocked` with a concrete blocker. Hand off to
`backlog-plan` only when sequencing/risk warrants it.

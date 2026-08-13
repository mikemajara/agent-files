---
description: "Create an implementation plan for non-trivial backlog work. Use when a\nstatus:ready issue needs sequencing across files or subsystems, carries\nmigration/auth/data/security/deployment risk, needs explicit verification\nsteps, or a multi-agent handoff targets the plan phase. Pair with the\nbacklog contract skill for labels, dedupe, and scripts. Do not invent\nunresolved product decisions; send those back to refine or block.\n"
---
# Backlog Plan

Plan sequences implementation for work that is already product-clear. It does
not replace research or refine.

Shared law (layout, labels, verify/dedupe, GitHub canonical rules) lives in
the `backlog` skill. Read it when those rules are needed. Prefer
`backlog/references/phase-skills.md` for handoff shape.

## When to run

Create a plan only when implementation needs sequencing:

- multiple files or subsystems
- migration, data, auth, payments, security, or deployment risk
- uncertain tests or verification steps
- work that an agent should execute later

Skip plans for obvious one-step changes. Prefer the smallest useful artifact.

If acceptance criteria or product decisions are unresolved, stop and hand off
to `backlog-refine` (or mark `status:blocked`). Do not invent product scope
inside the plan.

## Input contract

Expect a handoff packet:

1. Issue number (preferred) with `status:ready` (or explicit user override)
2. Current `status:*` label
3. Paths to any existing PRD/plan
4. Optional audit JSON:

```bash
node path/to/skills/backlog/scripts/backlog-issue-audit.mjs 123 --format json
```

## Procedure

1. **Claim work**: set `status:doing` before deep planning if an agent is
   exclusively owning this planning pass. Restore `status:ready` (or
   `status:blocked`) when planning finishes without starting implementation.
2. **Verify** with the `backlog` skill's Verify Before Add or Promote rules so
   the plan does not duplicate existing tracked work.
3. **Read** the GitHub Issue (canonical) plus any PRD pointer/content still
   needed for context.
4. **Write** the plan at:

```text
.backlog/plans/PLAN-[slug].md
```

Template:

```markdown
---
slug: [slug]
status: draft
issue: [GitHub issue URL or blank]
prd: [PRD path or blank]
created_at: [ISO-8601 timestamp]
---

# Plan: [Title]

## Summary

## Tasks

- [ ] [Task with file paths and verification]

## Verification

## Risks

## Notes
```

Plan statuses: `draft`, `ready`, `in_progress`, `blocked`, `done`.

5. **Tighten before handoff**: each task should name likely files/areas and
   how to verify. Risks should be concrete. Mark plan `ready` only when an
   implementer can execute without inventing sequence.
6. Link the plan from an issue comment when useful. Do not copy the full plan
   into a second editable issue body.
7. Clear exclusive `status:doing` if this agent was only planning; leave the
   issue `status:ready` for execution pickup.

## Output contract

- `.backlog/plans/PLAN-[slug].md` with summary, tasks, verification, risks
- Frontmatter links to the GitHub Issue (and PRD path if any)
- Plan status `ready`, or `blocked` with what is missing
- No new product requirements silently added; unresolved product questions go
  back to refine / `status:blocked`

## Done when

Stop when the plan is `ready` for execution, or blocked on a decision that
belongs in refine/human review—not when implementation is finished.

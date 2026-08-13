# Backlog Phase Skills

`backlog` is the **contract skill**: `.backlog/` layout, labels, verify/dedupe,
GitHub as canonical, Review/Triage/Capture/Promote, and shared scripts.

Phase skills are thin playbooks for multi-agent runs. They do not redefine
shared law. Install `backlog` alongside any phase skill so scripts and label
semantics stay available.

```text
npx skills add mikemajara/skills --skill backlog
npx skills add mikemajara/skills --skill backlog-research
npx skills add mikemajara/skills --skill backlog-refine
npx skills add mikemajara/skills --skill backlog-plan
```

## Phase map

| Skill | When | Writes | Done when |
| --- | --- | --- | --- |
| `backlog-research` | Facts missing for `status:unknown` work | Issue comment and/or `.backlog/memory.md` | Enough signal to refine or block |
| `backlog-refine` | Product clarity / acceptance criteria needed | GitHub issue body (canonical); optional local PRD draft | `status:ready` or `status:blocked` |
| `backlog-plan` | Implementation needs sequencing | `.backlog/plans/PLAN-[slug].md` | Plan `ready` with tasks, verification, risks |

Natural order:

```text
status:unknown → research (if thin) → refine → status:ready → plan (if non-trivial) → execute
```

Skip research for well-scoped bugs. Skip PRDs and plans for nits and obvious
one-step fixes. Prefer the smallest useful artifact.

## Manual multi-agent handoff packet

When spawning a phase agent, pass:

1. Issue number (or inbox title/slug if unpromoted)
2. Current `status:*` label
3. Paths to any existing PRD/plan
4. Helper JSON when available:

```bash
node path/to/skills/backlog/scripts/backlog-issue-audit.mjs 123 --format json
node path/to/skills/backlog/scripts/backlog-refinement-candidates.mjs --format json
node path/to/skills/backlog/scripts/backlog-status.mjs --format json
```

The orchestrator (human or agent) chooses the next phase. Do not chain phases
automatically until hook automation is intentionally enabled.

## Hook automation (deferred)

Hooks should dispatch on status/label transitions or artifact writes, not chat
events. First candidate later: `status:unknown` → research or refine spawn.
Constraints when that lands:

- Fail open; stay idempotent; claim with `status:doing` first
- Stop on open questions / `status:blocked`
- Never auto-promote or auto-close without a human gate until trusted

---
description: "Gather facts for ambiguous backlog work before product refine or planning.\nUse when an issue is status:unknown with a thin body, missing reproduction\nsteps, unclear subsystem, or unresolved open questions; when the user asks\nto research a GitHub Issue or inbox item; or when a multi-agent handoff\ntargets the research phase. Pair with the backlog contract skill for labels,\ndedupe, and scripts. Do not invent product decisions or write PRDs/plans.\n"
---
# Backlog Research

Research collects evidence so a later refine or plan pass can be decisive.
It does not own product scope, acceptance criteria, or implementation
sequencing.

Shared law (layout, labels, verify/dedupe, GitHub canonical rules) lives in
the `backlog` skill. Read it when those rules are needed. Prefer
`backlog/references/phase-skills.md` for handoff shape.

## When to run

Run research when:

- The issue is `status:unknown` and facts are thin or conflicting
- Reproduction, affected paths, or current behavior are unclear
- Related issues/PRs may already cover the same symptom
- The user explicitly asks for a research pass

Skip research when the issue already has clear symptoms, scope, and enough
context to refine or implement directly (especially obvious fixes and nits).

## Input contract

Expect a handoff packet:

1. Issue number (preferred) or inbox title/slug
2. Current `status:*` label
3. Paths to any existing PRD/plan
4. Optional audit JSON:

```bash
node path/to/skills/backlog/scripts/backlog-issue-audit.mjs 123 --format json
```

## Procedure

1. **Claim work** on promoted issues: set `status:doing` before deep reads.
2. **Audit** with the helper when available; otherwise `gh issue view <n>`.
3. **Dedupe lightly**: search related open/closed issues and PRs for the same
   symptom or subsystem. If exact duplicate, stop and hand off for duplicate
   handling via the `backlog` skill (do not close issues unless the user asked).
4. **Investigate**:
   - Code paths, configs, and tests that match the symptom
   - `.backlog/memory.md` for prior decisions or gotchas
   - Failing behavior vs expected behavior with concrete evidence
5. **Write findings** (GitHub is canonical for promoted work):
   - Prefer an issue comment summarizing facts, evidence, and open questions
   - Add durable gotchas or blockers to `.backlog/memory.md` only when future
     agents should remember them beyond this issue
6. **Hand off**:
   - Enough signal → leave or restore an appropriate non-doing status
     (`status:unknown` if still needs refine, or note ready-for-refine)
   - Blocked on external/human input → `status:blocked` with the blocker linked
   - Clear the `status:doing` claim when this research agent stops

## Output contract

A research pass should produce:

- Concrete findings (what is true today), not a PRD
- Open questions listed explicitly
- Links to files, issues, PRs, or commands that support the findings
- A short recommendation: refine next, block, or duplicate of #N

Do **not**:

- Write `.backlog/prds/` or `.backlog/plans/` in this phase
- Invent acceptance criteria or product tradeoffs
- Keep a second editable copy of the issue body locally

## Done when

Stop when either:

- There is enough factual signal for `backlog-refine` (or direct implement for
  a trivial fix), or
- The work is `status:blocked` with a clear blocker and owner/question

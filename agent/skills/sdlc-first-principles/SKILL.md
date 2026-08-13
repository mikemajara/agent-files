---
description: "Apply Elon Musk's five-step first-principles process improvement algorithm to\nsoftware delivery. Use when reviewing, designing, or improving SDLC workflows,\nrequirements, tickets, planning rituals, code review, CI/CD, release processes,\ntests, incident response, developer tooling, automation, or team operating\nprocedures; especially when a user asks to simplify, speed up, remove waste,\nreduce bureaucracy, improve cycle time, or decide what should be automated.\n"
---
# SDLC First Principles

## Overview

Use this skill to improve software delivery processes in strict sequence:
question requirements, delete, simplify, accelerate, then automate.

The invariant is order. Do not optimize, speed up, or automate a process until
unjustified requirements and unnecessary steps have been removed.

Not every process benefits from every phase immediately. For each phase, decide
whether it is `Apply now`, `Not applicable`, or `Blocked until later`; preserve
the order for any phases that do apply.

## Operating Rules

- Execute the five steps in order. If a later step reveals an invalid earlier
  assumption, go back to step 1.
- Assess phase applicability before prescribing work. Skip a phase only with a
  concrete reason, such as no deletable work found, insufficient data, external
  compliance constraint, missing owner, or the process being too immature to
  accelerate or automate safely.
- Attach every requirement, policy, approval, metric, or gate to a named owner,
  not a department, system, committee, or vague stakeholder group.
- Prefer deletion over improvement. A removed step has no maintenance cost,
  queue time, failure mode, documentation burden, or training burden.
- Treat "best practice", "compliance", "security", "quality", and "because we
  always do it" as claims that require evidence and ownership.
- Do not automate bureaucracy. Automation is last because it can preserve waste
  at higher speed.
- Preserve necessary controls, but force them to justify their existence with
  a concrete risk, owner, and verification method.

## Workflow

### Applicability Pass

Before detailed recommendations, classify each phase:

- `Apply now`: the phase has a clear target, owner, and expected benefit.
- `Not applicable`: the phase does not fit the current process or artifact.
- `Blocked until later`: the phase might apply, but a prerequisite is missing.

Use these checks:

- Step 1 applies when there are requirements, constraints, gates, policies, or
  assumptions to challenge. It almost always applies unless the task is already
  narrowly scoped and requirements are explicit.
- Step 2 applies when the process has steps, artifacts, checks, or handoffs that
  may not be essential.
- Step 3 applies only after deletion candidates have been resolved or when there
  is genuinely nothing to delete.
- Step 4 applies only when the remaining flow is stable enough to measure and
  speed up without amplifying defects or confusion.
- Step 5 applies only when the target process is validated, repeatable, and
  simpler than before.

If a user asks to improve an application, software system, or process, first
state which phases can apply now and which should wait.

### 1. Make Requirements Less Dumb

Inventory the constraints before proposing changes:

- What is required?
- Who is the named owner?
- What outcome does it protect or enable?
- What evidence shows it is still needed?
- What breaks if it is removed?
- What is the smallest valid form of the requirement?

For SDLC work, challenge:

- Required meetings, approvals, signoffs, estimates, status reports, templates,
  labels, ticket fields, branch rules, review policies, deployment freezes,
  quality gates, manual test passes, dashboards, and compliance artifacts.
- Requirements that came from "engineering", "product", "security", "legal", or
  "leadership" without a named accountable person.
- Requirements with no current failure mode, customer value, legal basis,
  security risk, or measurable quality signal.

Output for this step:

- `Keep`: requirement, owner, evidence, reason.
- `Change`: requirement, owner, weaker/smaller replacement.
- `Delete candidate`: requirement, owner or missing owner, reason.

### 2. Delete Parts Or Processes

Remove every step that is not essential after step 1.

For SDLC, consider deleting:

- Duplicate planning layers: roadmap item plus epic plus initiative plus ticket
  when one artifact would work.
- Handwritten status updates that can be inferred from issues, PRs, CI, or
  deploy history.
- Mandatory meetings with no decision, conflict resolution, or knowledge
  transfer.
- Required fields or labels nobody queries.
- Review steps that only re-check what CI, type checking, tests, or linters
  already verify.
- Environments, branches, release trains, or approval queues that no longer
  map to an actual risk.
- Flaky or low-signal tests that block delivery without preventing defects.

Use the calibration rule: if nothing ever needs to be restored, deletion was
probably too timid. Track what was removed and expect roughly 10% to come back
in a narrower, better-justified form.

Output for this step:

- `Delete now`: step/artifact, owner notified, rollback signal.
- `Trial deletion`: step/artifact, trial length, restore condition.
- `Restore narrower`: item restored, reason, minimized form.

### 3. Simplify Or Optimize

Only simplify what survived deletion.

For SDLC, optimize for:

- Fewer handoffs.
- Shorter queues.
- Smaller batch sizes.
- Clearer ownership.
- Faster feedback.
- Higher signal-to-noise in reviews, tests, dashboards, and ceremonies.
- Direct evidence over narrative reporting.

Prefer simple changes before tooling changes:

- Replace a multi-section ticket template with the fields actually used.
- Collapse duplicate approval gates into one accountable reviewer.
- Replace broad status meetings with exception-based review.
- Make code review expectations explicit and remove subjective checklist noise.
- Split slow CI into required fast signal plus non-blocking deeper checks.

Output for this step:

- `Simplified flow`: old path, new path, removed handoffs.
- `Optimized artifact`: old artifact, new artifact, fields retained.
- `Decision rule`: when the simplified path applies and when escalation is
  needed.

### 4. Accelerate Cycle Time

Increase speed only after the process is lean.

For SDLC, improve:

- Time from idea to ready work.
- Time from branch to reviewed PR.
- Time from PR open to merge.
- Time from merge to production.
- Time from incident to mitigation.
- Time from customer signal to shipped learning.

Use small, measurable interventions:

- Reduce batch size.
- Set explicit WIP limits.
- Prefer trunk-based or short-lived branches where feasible.
- Move validation earlier.
- Make ownership unambiguous.
- Parallelize independent work without creating coordination overhead.
- Make rollback faster so release decisions can be less fragile.

Output for this step:

- `Cycle metric`: current baseline, target, measurement source.
- `Bottleneck`: queue or handoff being accelerated.
- `Intervention`: specific speed change and expected risk.

### 5. Automate

Automate only after steps 1-4 are complete.

Good SDLC automation candidates:

- Repetitive low-judgment checks.
- Deterministic policy enforcement.
- Environment provisioning.
- CI quality gates with high signal.
- Release notes generated from structured changes.
- Dependency updates with tests and rollback.
- Incident templates and timeline capture.
- Metrics collection from source systems.

Avoid automation when:

- The underlying requirement is disputed or ownerless.
- The process is still being deleted or redesigned.
- Human judgment is the value-producing part.
- Automation would add a new queue, platform dependency, or maintenance burden
  larger than the original problem.

Output for this step:

- `Automation`: target, preconditions already simplified, owner.
- `Trigger`: when it runs.
- `Failure mode`: what happens when it is wrong or unavailable.
- `Maintenance cost`: who owns updates and how often it is reviewed.

## Response Format

When applying this skill, produce:

1. `Current Process`: concise map of the process or artifact under review.
2. `Phase Applicability`: table or bullets marking each step as `Apply now`,
   `Not applicable`, or `Blocked until later`, with reasons.
3. `Step 1 - Requirements`: requirements challenged, owners, keep/change/delete
   candidates.
4. `Step 2 - Deletions`: parts or processes to remove first, with rollback
   signals.
5. `Step 3 - Simplification`: only improvements to what remains.
6. `Step 4 - Acceleration`: cycle-time changes and metrics.
7. `Step 5 - Automation`: automation candidates, explicitly last.
8. `Next Actions`: short ordered list of changes to try now.

If the user asks directly for automation, still run steps 1-4 first and explain
which preconditions must be satisfied before automation is safe.

## Hands-On Management Check

For any recommendation, verify whether the accountable manager or owner can
personally perform or observe the work:

- Can they create a ticket using the proposed template?
- Can they get a PR through the proposed review path?
- Can they diagnose a CI failure?
- Can they deploy or roll back?
- Can they explain why each gate exists?

If not, include a `Manager must do the work` action before approving process
changes.

## Urgency Check

Keep momentum high without hiding risk:

- Prefer reversible trials over long debates.
- Timebox process experiments.
- Measure actual queue time and defect outcomes.
- Restore only what fails a concrete rollback signal.
- Do not wait for perfect consensus when ownership and risk are clear.

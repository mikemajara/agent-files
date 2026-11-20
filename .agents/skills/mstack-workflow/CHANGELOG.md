# mstack-workflow changelog

Each entry describes the mstack release across all three skills and its effect
on workflow. The `version` in this skill's frontmatter is the shared mstack
version.

## Unreleased

### Stack changes

- **Orchestrator:** Adds optional, gitignored `.mstack/config.local.json` for
  execution settings. Precedence is explicit run instructions, local overrides,
  shared settings, then skill defaults. Defines allowed keys, validation, object
  merging, array replacement and runtime-option resets. Workers inherit resolved
  assignments and limits; new controller sessions resolve configuration afresh.
- **Workflow:** Shared phase, verification and completion rules do not change.
  The skill clarifies that local execution settings cannot override them.
- **Tracker:** Shared selection and record operations do not change. The skill
  explicitly excludes `tracker` from the local execution override.

### Impact on workflow

- No adaptation needed to phase gates, verification, independence or completion
  requirements. They remain shared and apply regardless of execution preferences.
- Existing story specifications and QA verdicts need no migration or revalidation
  solely for this addition. Controller-session and tracker-write rules are unchanged.
- Unreleased addition; the shared version remains `0.2.0` pending a release
  decision. This is a skill contract, not an executable configuration loader.

## 0.2.0

Adds fix-story proof and a combined scope and regression check to QA.

### Stack changes

Bump reason: new required gates change what implementation and QA must record
before a story can pass, so in-flight stories and existing agents must adapt.
The project rules treat that as a breaking change; while mstack is pre-1.0 and
still in draft, it is released as a minor version bump.

- **Workflow:** [Fix][type:fix] stories record a fix reproduction on the PR:
  scenario, command or steps, and results on the base and head commits, or why
  a base reproduction is impractical and the substitute evidence used.
  Implementation gates on recording it; QA reruns it (or judges the
  substitute) on the tested commit. QA adds one scope and regression check:
  every diff change traces to the specification, behavior the change could
  affect outside it is named in proportion to risk and covered by at least the
  cheapest catching check, and only a demonstrated regression fails.
  Refinement names behavior to preserve when a change could affect it. A new
  tested commit reruns both checks.
- **Orchestrator:** No procedure change. QA workers validate against the
  updated QA contract; the QA tier default is unchanged. Runtime-support
  statements now name `0.2.0`; supported runtimes are unchanged.
- **Tracker:** No schema, label or field change. The fix reproduction and the
  scope and regression check are recorded on the PR with the existing
  verdict.

### Impact on workflow

- Workflow must adapt: implementation and QA exit validation each gain the new
  checks in their phase contracts and in `references/verification.md`.
- Stories already in QA or awaiting merge under `0.1.0` need a new QA verdict
  that includes the scope and regression check and, for fix stories, the fix
  reproduction, before they pass under `0.2.0`.
- Use all three skills at `0.2.0` when coordinating a complete mstack run.

## 0.1.0

Initial versioned baseline for the three-skill mstack set. There is no earlier
version to migrate from. The skills remain drafts; see their contracts for
known limitations.

### Stack changes

- **Workflow:** Defines story phases, lifecycle, readiness and completion
  requirements, verification and project memory. Research findings can support
  an authorized non-delivery disposition under the lifecycle contract.
  Refinement records relevant implementation and judgment constraints in the
  specification. Implementation runs applicable project checks before QA and
  records their commands and outcomes. QA requires independent review and
  passing required scenarios on the tested commit; missing evidence fails.
  Verification requires per-scenario traceability, results, retained evidence
  and tested-commit identity, without prescribing a record layout; all required
  acceptance scenarios are rerun if the tested commit changes. Lifecycle's
  phase overview reflects the implementation handoff gates. The
  shared Workflow skill summary points to the remaining Verification limits.
- **Orchestrator:** Coordinates existing stories through workflow phases,
  continues eligible work during an active autonomous session, and closes each
  session with project state recorded for a later fresh decision. If worker
  termination or outcome is uncertain, it retains ownership and pauses
  dispatch pending reconciliation. A fresh controller may take over in
  recovery-only mode. Deadlines and halts stop dispatch while the controller
  reconciles and checkpoints; this does not change workflow phase rules.
  Herdr is the supported runtime for 0.1.0, and fx `ask` is a documented
  harness mapping used through a supported runtime. Cursor Cloud and native
  Cursor subagents are deferred; cmux is excluded. These runtime-scope choices
  do not change workflow phase gates.
- **Tracker:** Records specifications, workflow facts, evidence and links;
  supports filesystem issues by default and optional GitHub integration. For
  filesystem tracking, the controller writes records during a coordinated run;
  workers return proposed changes. Standalone mutations use a short-lived lock
  scoped to the changed issue file; no lock implementation is bundled. GitHub
  integration excludes automatic legacy migration and offline caches; neither
  changes workflow gates.
- **Release layout:** The shared-version release contains all three named skill
  directories as siblings. Cross-skill links resolve relative to their owning
  skill; a missing required sibling makes the dependent operation unavailable.

### Notion addition to the unreleased baseline

- **Tracker:** Adds optional `notion` story storage with prescribed database properties, stable page/Unique ID identity, target IDs and record operations. Live behavior is unvalidated and no connector is bundled. A story has one canonical store; GitHub supplies PRs, QA and merge confirmation independently. Users choosing Notion must supply access, database/data-source IDs and the required schema; existing GitHub/filesystem users need no adaptation or migration.
- **Orchestrator:** Configuration accepts `notion` and its tracker-owned target fields, using the existing immutable-number ordering and execution/admission rules. No other orchestrator adaptation is needed.
- **Workflow:** No behavior change and no adaptation needed. Notion's separate phase, activity and closure properties record existing gates rather than introduce new lifecycle states or waive evidence requirements.
- This is draft authoring within the unreleased `0.1.0` baseline, not a separate release or version bump.

### Impact on workflow

- Orchestrator must follow workflow's phase gates and lifecycle when dispatching
  and reconciling work. Its session checkpoint rule adds no phase or transition;
  no workflow adaptation is required for this release.
- Workflow rules can be used without the sibling skills. Operations that rely
  on tracker storage or orchestration require the matching same-version sibling;
  a missing link does not change the phase rules.
- Controller-only filesystem writes do not change phase ownership or validation;
  workflow results still require the same gates before the controller records them.
- Filesystem per-file write locks serialize record mutations but do not change
  workflow gates or require workflow adaptation.
- GitHub legacy label migrations remain explicit user decisions, and cached or
  exported records do not establish current workflow state.
- Tracker must record workflow facts and evidence without treating tool status
  as proof that a gate passed. No separate workflow adaptation is required.
- Orchestrator must apply the lifecycle transition and blocked-work rules; the
  diagram clarification adds no new gate beyond phase contracts.
- Orchestrator uses workflow's priority vocabulary when ordering eligible
  backlog stories; workflow's phase readiness rules remain unchanged.
- Orchestrator's pending runtime validation must observe real dispatch across
  phase handoffs and holds, then reconcile and checkpoint before a controlled
  runtime stop; this does not change workflow phase criteria. No recovery after
  an abrupt hard limit is promised.
- Cursor Cloud and native Cursor subagents are unsupported in 0.1.0; cmux is
  excluded. No workflow adaptation is required for these deferred integrations.
- fx CLI output and Herdr observations remain execution evidence, not proof a
  workflow gate passed. Workflow's existing phase criteria apply unchanged.
- Orchestrator's elapsed-time limit is per session; workflow has no cumulative
  scheduled-session time gate.
- No universal rolling usage threshold is defined. Any guard is
  runtime-specific and does not change workflow gates; unsupported requested
  guards stop dispatch but not phase-validity rules.
- Exclusive controller admission is an orchestrator runtime policy; it does
  not change workflow phase validity or transitions.
- An uncertain worker retains ownership while dispatch and claim changes pause
  pending reconciliation; workflow state changes still require workflow's own
  gates.
- Herdr's unverified hard-cancellation limit does not change workflow's blocked
  or completion criteria.
- Herdr model launch flags affect orchestrator dispatch only; workflow's
  assignment and phase requirements remain unchanged.
- Orchestrator must give workers the current refinement specification, including
  relevant constraints. No separate orchestration rule or tracker schema is
  required by this addition.
- Orchestrator dispatches QA only after implementation checks pass or the PR
  states that no applicable runnable checks exist. Tracker preserves these
  results with the PR record; no new tracker field is required.
- Use all three skills at `0.1.0` when coordinating a complete mstack run.

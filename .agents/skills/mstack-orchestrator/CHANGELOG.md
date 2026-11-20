# mstack-orchestrator changelog

Each entry describes the mstack release across all three skills and its effect
on orchestrator. The `version` in this skill's frontmatter is the shared mstack
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

### Impact on orchestrator

- Adapt configuration resolution to read and validate the optional local layer
  before dispatch, without changing shared project configuration. Existing
  settings behave as before when the local file is absent.
- No runtime-support, controller-admission or tracker-locking change. Active
  sessions keep their resolved settings; later fresh sessions retain the existing
  recovery and checkpoint rules. No story or QA-evidence migration is needed.
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

### Impact on orchestrator

- No adaptation needed. Orchestrator already validates worker results against
  the applicable workflow contract, so the new gates apply through that
  validation; a QA worker's verdict without them does not pass.
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
  acceptance scenarios are rerun if the tested commit changes.
  Lifecycle's phase overview reflects the implementation handoff gates.
- **Orchestrator:** Coordinates existing stories through workflow phases,
  continues eligible work during an active autonomous session, and closes each
  session with project state recorded for a later fresh decision. Backlog runs
  honor explicit request order, then priority and an immutable-number
  tie-breaker. Validation requires observed dispatch after phase handoffs,
  worker waits, eligible-story changes, controlled runtime stops or pre-limit
  guards, and checkpoint-based fresh starts; no live trial has yet been run.
  The trial requires reconciliation and checkpointing before the controlled
  stop, without promising recovery after an abrupt hard limit. Session
  checkpoints reconcile canonical story,
  PR and existing project-memory records rather than create a separate state
  store. Only one controller session may run per project; the launcher/scheduler
  must enforce exclusive admission. After a controller ends, a fresh controller
  may take over in recovery-only mode while workers remain uncertain; dispatch
  and claim reassignment stay paused until reconciliation.
  `maxDurationMinutes` applies per session and does not accumulate across
  scheduled sessions. No universal rolling usage threshold is set; 90% of a
  five-hour window is an example. Optional guards are runtime-specific and
  require a defined signal, units, window, polling cadence, threshold and stop
  effect; unsupported requested guards block dispatch. Deadlines and halts close work dispatch while the controller retains
  admission through reconciliation and checkpointing. Herdr's documented `ctrl+c` is a cancellation request, not confirmed
  process-tree termination; hard cancellation requires harness-specific proof,
  and project exclusivity must come from the launcher/scheduler. Herdr model
  flags are documented for Codex and Cursor; other harnesses still need mapping.
  Cursor Cloud and native Cursor subagents are deferred and unsupported in
  0.1.0; their references preserve research for a later release. cmux is not
  included. The fx CLI mapping covers `fx ask` as a harness, used through a
  supported runtime, and follows its published command/output contract. Herdr
  is the supported runtime based on its documented CLI; its project admission
  still comes from an external launcher/scheduler, and `ctrl+c` does not prove
  process-tree termination.
  When worker state is uncertain, retain ownership, record a reconciliation
  condition and do not dispatch a replacement. Runtime-specific detection and
  recovery-only admission remain open.
- **Tracker:** Records specifications, workflow facts, evidence and links;
  supports filesystem issues by default and optional GitHub integration. The
  filesystem adapter is instruction-only: the controller writes records in a
  coordinated run, workers return proposed updates, and mutations use a
  short-lived lock scoped to the issue file. The environment supplies locking;
  no lock implementation is bundled. GitHub integration does not migrate
  legacy labels or provide offline cache/export or Projects-field mappings;
  current reads remain authoritative.
- **Release layout:** The shared-version release contains all three named skill
  directories as siblings. Cross-skill links resolve relative to their owning
  skill; a missing required sibling makes the dependent operation unavailable.

### Notion addition to the unreleased baseline

- **Tracker:** Adds optional `notion` story storage with a prescribed database schema, target IDs, stable identity and record operations; live behavior is unvalidated and no connector is bundled. Stories have one canonical store, while GitHub supplies PRs, QA and merge confirmation independently. Users choosing Notion must supply access, database/data-source IDs and the required schema; existing GitHub/filesystem users need no adaptation or migration.
- **Orchestrator:** Configuration now accepts `notion` and its tracker-owned target fields. Resolve Notion stories through tracker, read their canonical store during fresh-session recovery, and use the immutable numeric story ID for the existing tie-breaker. No execution/admission behavior changes; no other orchestrator adaptation is needed.
- **Workflow:** No behavior change and no adaptation needed; phase, evidence and closure gates remain unchanged.
- This is draft authoring within the unreleased `0.1.0` baseline, not a separate release or version bump.

### Impact on orchestrator

- Orchestrator depends on workflow's current phase, validation and completion
  contracts; follow those contracts at every handoff and reconciliation.
- Orchestrator requires the same-release workflow and tracker siblings for its
  linked contracts; it must stop a dependent operation if either is missing.
- With filesystem tracking, the controller is the sole record writer during a
  coordinated run. Workers return proposed updates. Standalone writes use a
  short-lived lock for the changed issue file. If the environment cannot
  serialize a mutation, stop it.
- GitHub issue attributes use the current label mapping. Do not infer or
  automatically migrate legacy labels; read current remote records rather than
  relying on offline exports.
- For backlog selection, preserve explicit request order; otherwise use
  workflow priority and ascending immutable story number without changing
  tracker metadata.
- Elapsed-time admission is session-scoped. An optional runtime-specific usage
  guard must define its signal, units, window, polling cadence, threshold and
  stop effect; unsupported requested guards block dispatch. No universal 90%
  threshold is imposed.
- The scheduler/runtime must enforce one controller per project. It may admit
  a fresh recovery-only controller after the previous controller ends while
  workers remain active or uncertain, but must hold dispatch and claim changes
  pending reconciliation. Story claims remain the tracker's responsibility.
- Cursor Cloud and native Cursor subagents are unsupported in this release;
  no workflow behavior depends on them. No workflow adaptation is needed.
- fx CLI output remains execution evidence only; workflow gates still validate
  the assigned result. No workflow adaptation is needed.
- Refinement specifications include relevant constraints that affect the work.
  Pass the current specification and verification scenarios to each worker.
- Start independent QA only when the implementation checks pass and their
  commands and outcomes are recorded, or the PR states that no applicable
  runnable checks exist. This does not replace the QA acceptance verdict.
- Each controller session closes with project state recorded. A later session
  reads GitHub or local project records and decides afresh; it does not recover
  project truth from an open pane or retained controller context.
- If worker termination or outcome is uncertain, retain ownership and pause
  dispatch and claim changes. A fresh controller may take exclusive controller
  admission to reconcile current records and runtime state; do not start
  replacement work while the worker may still be active.
- Orchestrator uses tracker for issue and evidence operations. Tracker records
  outcomes but does not determine workflow readiness or grant execution scope.
- Use all three skills at `0.1.0` when coordinating a complete mstack run.

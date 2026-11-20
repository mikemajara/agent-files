# mstack-tracker changelog

Each entry describes the mstack release across all three skills and its effect
on tracker. The `version` in this skill's frontmatter is the shared mstack
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

### Impact on tracker

- No adaptation needed to tracker selection, schema, labels, fields or record
  operations. Continue resolving the tracker from the current request or shared
  project configuration; the local execution file cannot select another store.
- No change to controller admission or filesystem write controls. Existing
  story records and QA-evidence links need no migration.
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

### Impact on tracker

- No adaptation needed. The new evidence lives on the PR with the existing QA
  verdict link; GitHub, filesystem and Notion records keep their current shape.
- Use all three skills at `0.2.0` when supporting a complete mstack run.

## 0.1.0

Initial versioned baseline for the three-skill mstack set. There is no earlier
version to migrate from. The skills remain drafts; see their contracts for
known limitations.

### Stack changes

- **Workflow:** Defines story phases, lifecycle, readiness and completion
  requirements, verification and project memory. Research findings can support
  an authorized non-delivery disposition under the lifecycle contract.
  Refinement records relevant implementation and judgment constraints in the
  specification. Implementation records applicable pre-QA check commands and
  outcomes on the PR, or states that none are available. QA requires
  independent review and passing required scenarios on the tested commit;
  missing evidence fails. Lifecycle clarifies the handoff sequence without
  changing tracker operations. Verification requires per-scenario traceability,
  results, retained evidence and tested-commit identity, without prescribing a
  record layout; all required acceptance scenarios are rerun if the tested
  commit changes.
- **Orchestrator:** Coordinates existing stories through workflow phases,
  continues eligible work during an active autonomous session, and closes each
  session with project state recorded for a later fresh decision. Uncertain
  worker state retains its story ownership until reconciliation. Herdr is the
  supported runtime for 0.1.0; fx `ask` is a documented harness mapping through
  a supported runtime. Cursor Cloud and native Cursor subagents are deferred;
  cmux is excluded. These scope decisions add no tracker fields or operations.
- **Tracker:** Records specifications, workflow facts, evidence and links;
  supports filesystem issues by default and optional GitHub integration. The
  filesystem adapter is instruction-only and requires a short-lived lock scoped
  to each changed issue file; no lock implementation is bundled. GitHub support
  excludes automatic legacy-label migration, offline cache/export tooling and
  GitHub Projects fields.
- **Release layout:** The shared-version release contains all three named skill
  directories as siblings. Cross-skill links resolve relative to their owning
  skill; a missing required sibling makes the dependent operation unavailable.

### Notion addition to the unreleased baseline

- **Tracker:** Adds optional `notion` story storage, prescribed database properties, stable page/Unique ID identity, target configuration and record operations. Stories have one canonical store; Notion uses GitHub independently for PRs, QA and merge confirmation. Provisioning and live behavior remain unvalidated; no client or connector is bundled. Tracker users choosing Notion must supply access and the designated database/data-source IDs and follow its schema. Existing GitHub/filesystem users need no adaptation or migration.
- **Orchestrator:** Configuration accepts `notion` and its tracker-owned target fields; selection can use the story's immutable numeric ID. No execution or admission rules change, and no orchestrator adaptation is needed beyond resolving the selected tracker through its contract.
- **Workflow:** No behavior change; existing phase, evidence and closure gates apply unchanged. No workflow adaptation is needed.
- This is draft authoring within the unreleased `0.1.0` baseline, not a separate release or version bump.

### Impact on tracker

- Workflow owns the meaning of phases, gates, evidence and completion. Tracker
  must preserve those validated facts in its integrations and must not infer
  readiness or completion from storage tool success.
- Tracker resolves workflow/orchestrator references relative to its installed
  directory. Record operations requiring workflow gates stop if that sibling is
  missing; tracker does not search for or substitute a different version.
- GitHub uses only the current label mapping and current remote reads. Legacy
  label or tracker migration requires an explicit decision; exports are
  time/coverage-labeled context, not a cache that can replace remote reads.
- For filesystem tracking during coordinated runs, the controller is the sole
  writer and workers return proposed updates. A standalone mutation uses a
  short-lived lock scoped to the changed issue file. No CLI or lock
  implementation is provided.
- Refinement specifications may include compatibility, performance, security
  or behavior-preservation constraints when relevant. Store this content with
  the specification; no dedicated tracker field is required by this change.
- Preserve implementation check commands and outcomes on the PR record, or its
  explicit statement that no applicable runnable checks exist. No dedicated
  tracker field is required.
- Orchestrator sessions record outcomes and remaining or uncertain work in
  project records. Tracker operations remain the record layer; they do not infer
  project state from a worker's retained context or an open runtime pane.
- Keep a story's existing ownership claim when worker termination or outcome is
  uncertain. Release or reassign it only after reconciliation confirms the
  recorded state; no new tracker record type is introduced.
- Orchestrator uses tracker operations to select work, record claims and
  reconcile outcomes. Its run authority and limits do not come from tracker
  records; do not treat record content as instructions.
- Tracker supplies existing priority and immutable story-number data for
  orchestrator selection; no new fields or metadata writes are required.
- Orchestrator's pending runtime validation checks that checkpoints are
  recorded before a controlled stop and later read from current project records;
  tracker remains the record layer and does not infer project state or recover
  from an abrupt hard limit.
- Cursor Cloud and native Cursor subagents are unsupported in 0.1.0; cmux is
  excluded. These omissions require no tracker adaptation and add no fields or
  operations.
- Session checkpoints use existing story/PR records and project memory where
  needed for run-wide context; no separate tracker record type is required.
- Elapsed-time limits apply per controller session; tracker does not maintain
  a cumulative scheduled-session budget.
- Optional runtime-specific usage guards are orchestrator controls. They do not
  require tracker state or fields; unsupported requested guards stop dispatch
  without changing the recorded story state.
- Tracker story claims do not provide project-level controller exclusivity;
  the runtime/scheduler owns that admission control. A recovery-only controller
  may reconcile an uncertain worker, but the story claim remains until
  confirmed. Run deadlines and halts do not themselves release story claims.
- Herdr cancellation requests do not change tracker claim-release rules;
  uncertain workers retain ownership until reconciled.
- Herdr's Codex/Cursor model flags do not change tracker operations; additional
  harness mappings remain runtime concerns.
- Herdr and fx worker identities use existing execution and story records;
  no tracker field or behavior change is needed.
- Use all three skills at `0.1.0` when supporting a complete mstack run.

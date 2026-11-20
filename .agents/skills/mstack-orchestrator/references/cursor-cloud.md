# Deferred: Cursor Cloud integration

Cursor Cloud is not supported in mstack 0.2.0. This reference preserves the
researched API mapping for future work; do not select `cursor-cloud` as a
runtime or rely on this mapping for unattended work. It has not had a live
runtime trial.

If reconsidered in a later release, use with runtime `cursor-cloud` and harness
`agent-cursor`. Follow the parent
[execution contract](../SKILL.md#execution-integration-contract) and
[configuration](configuration.md). Workflow owns the assigned phase and its
outputs; use tracker for story, PR and evidence records.

Cursor documents Cloud Agents API v1 as public beta and gives no
cancellation-latency guarantee. If this mapping is reconsidered for a later
release, preserve `drain` as the default and require observed cancellation and
terminal state before checkpointing after a hard halt. Do not promise recovery
after abrupt controller loss. Agent creation supports an optional
client-supplied ID for duplicate prevention, but follow-up runs have no
client-supplied run ID. Reconcile ambiguous requests from API records before
retrying; hold if the outcome remains uncertain. Cross-session follow-up on a
previous agent is disallowed by the parent orchestrator contract.

## Availability and target

Use an existing authenticated Cursor API connection with access to the source
repository and execution environment. Runtime settings under
`execution.runtimeOptions` may supply `repos` or an `env` target, using the
[API's request schema](https://cursor.com/docs/cloud-agent/api/endpoints).
Validate the selected target and model before dispatch. This mapping supplies
Cursor-managed execution; there is no `codex` or `fx` launch mapping here.

## Operation mapping

Paths below use `https://api.cursor.com`. Keep the mstack run identity separate
from both Cursor identities: a durable agent ID and a per-prompt run ID.

| Operation | API v1 mapping |
| --- | --- |
| Inspect models | `GET /v1/models` |
| Inspect agents | `GET /v1/agents`, then `GET /v1/agents/{agentId}` |
| Launch | `POST /v1/agents`; retain returned `agent.id` and `run.id`. |
| Observe | `GET /v1/agents/{agentId}/runs/{runId}` |
| Wait | Stream `/v1/agents/{agentId}/runs/{runId}/stream`, or make bounded status reads. |
| Continue | `POST /v1/agents/{agentId}/runs` with the next prompt; retain its new run ID. This endpoint does not accept a client-supplied run ID. |
| Halt | `POST /v1/agents/{agentId}/runs/{runId}/cancel`, then observe the run. |

For launch, map the admitted mandate to `prompt.text` and the resolved model
to `model.id`; convert supported model options into `model.params`. Supply
the explicit model rather than inheriting Cursor's account default. Retain
the selected target and returned identities before another action.

For create requests, a client-supplied `agentId` can make duplicate creation
detectable: repeating it returns `409 agent_id_conflict`. This option cannot
be combined with `envVars`; when those variables are required, retain the
returned agent identity and reconcile before retrying. A follow-up run returns
a server-assigned run ID and has no documented client idempotency key. If the
request outcome is unclear, inspect the agent's `latestRunId` and list its
runs before another request. If those records cannot distinguish whether the
requested run was created, hold instead of sending the prompt again.

Resolve the intended branch under
[implementation](../../mstack-workflow/references/phases/implementation.md#required-outputs).
For an established story branch, the API's `repos[].startingRef` with
`workOnCurrentBranch: true` targets that branch. Verify the ref is the intended
story branch before enabling direct writes. With `prUrl`, that option targets
the existing PR head. Otherwise Cursor generates its own branch; that behavior
does not waive workflow's branch convention. Choose `autoCreatePR` for the
intended operation and reconcile the result through tracker; avoid creating a
second PR when continuing work on the existing change.

The documented follow-up request has no model-selection field. Treat a changed
model as a fresh agent launch against the intended branch/PR, after reconciling
the previous run. A continuation uses existing conversation/workspace context;
do not assume it changes the resolved model or isolates a new task. Follow up
only within the same controller session for the same confirmed worker
assignment. Across controller sessions, observe or cancel the old agent as
needed, reconcile its outcome, then create a fresh agent from current project
records; do not carry over its conversation as task state.

## Observation, halt and release

Use the recorded run ID for observations. Runtime terminal statuses are
`FINISHED`, `ERROR`, `CANCELLED` and `EXPIRED`. An agent's `IDLE` status can also
follow an error; use its run record. Attribute artifacts to the recorded run:
`git` is an agent-wide snapshot, not exclusively that run's output.

Apply the parent's reconciliation procedure to returned results and tracker
records. Handle a dropped stream as an observation failure and read the
recorded run before attempting another launch.

For explicit halt or a supported halt deadline, invoke cancellation and read
the run to confirm its terminal outcome. Cancellation is terminal; it ends the
run and cannot be resumed. A cancellation conflict can mean it already ended;
read current state instead of reporting cancellation success. The API documents
no cancellation-latency guarantee. Stop controls must remain usable while a
stream or status wait is pending.
Elapsed-time limits use the controller's timer and this cancellation mapping;
no native server-side deadline parameter is mapped here. A lost controller is
not proof that a cloud worker stopped. Drain deadlines use the shared
admission rule.

Archiving or deleting an agent is separate resource cleanup. Preserve outputs
and reconcile owned work before any cleanup allowed by project policy. Native
delegation within a Cursor session uses the
[subagent mapping](cursor-subagents.md), not these agent/run endpoints.

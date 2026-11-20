# Deferred: Cursor native subagents

Native Cursor subagents are not supported in mstack 0.2.0. This reference
preserves the researched operation mapping for later work. Do not set
`execution.delegation` to `subagent` in this release; the mapping has not had a
live runtime trial.

If reconsidered in a later release, use when `execution.delegation` is
`subagent` and the selected `agent-cursor` session exposes native delegation.
The parent session still belongs to its actual runtime. Follow the shared
[execution contract](../SKILL.md#execution-integration-contract) and
[configuration](configuration.md); phase requirements remain in workflow.

If this mapping is reconsidered for a later release, inspect the exposed tool
schema because signatures vary by Cursor surface. Use `drain` by default and
configure `onDeadline: halt` only if the native task operation supports
cancellation and the integration can confirm the task stopped. Do not infer
native task support from the separate Cursor SDK.

## Availability and model selection

Inspect the current session's delegation tool and existing task identities.
Cursor documents [subagents](https://cursor.com/docs/subagents) as separate
contexts, with foreground/background execution and returned agent IDs for
resume. Resume only within the same controller session for the same confirmed
worker assignment. Across controller sessions, reconcile the previous task
and start a fresh task from current project records; do not carry forward its
conversation. Native tasks use the parent's Cursor access; other harnesses
require their own launch integration.

Resolve the role's model through shared configuration. Pass it through the
native launch tool when supported, or use an existing custom subagent
definition with the selected model. An implicit `inherit` does not implement
an explicitly different model selection. Record the actual model when the
surface exposes it and report uncertainty under the parent contract.

Do not generate or install custom subagent definitions as an incidental part
of dispatch. Their provisioning is separate project setup. Include the task's
required context in the mandate; a separate context is not a separate checkout.

## Operation mapping

| Operation | Current-session mapping |
| --- | --- |
| Launch | Invoke the exposed Task/delegation tool with the admitted mandate and resolved model, using its actual schema. Retain its agent/task ID. |
| Observe/wait | Foreground return, background completion event, or the task's exposed status/output mechanism. |
| Continue | Within the same controller session, resume the recorded agent ID through the exposed delegation operation for the same confirmed assignment. |
| Halt | Use a cancellation operation for that task if the current surface supplies one; otherwise report unsupported cancellation and any active task. |
| Reconcile/release | Use returned output and retained tracker artifacts through the parent contract before retry or context reuse. |

Background local tasks may expose output under `~/.cursor/subagents/`; use the
path and identity actually returned for the task. Do not assume a local path
works for a cloud session. Default shared-checkout behavior requires attention
to the parent's isolation/admission contract before parallel edits.

A task tool returning a final message is an execution observation. Record and
validate the assigned phase result using workflow and tracker. Resuming a task
retains its context; use a new task for a newly selected model unless the
surface explicitly supports changing it.

## Run controls

Use background delegation or a verified interruptible foreground operation
when the controller must continue receiving stop/deadline signals. Apply the
shared story and elapsed-time controls before each launch or same-session
resume. Do not resume a task across a controller-session boundary.

Native subagents may run unattended with the shared default `drain` behavior.
Configure `onDeadline: halt` only when the current task surface exposes
cancellation and the integration can confirm the task stopped. Before an
unattended run, disclose when cancellation cannot be confirmed.

A user halt closes work dispatch even if task cancellation is unavailable.
Report that limitation and retain controller admission and active/uncertain
task ownership through reconciliation and checkpointing.
Do not promise a hard stop at a deadline without a supported cancellation and
confirmation path. Model fallbacks use the parent's configured-candidate rule.

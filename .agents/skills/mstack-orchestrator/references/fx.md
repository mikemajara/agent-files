# fx CLI harness integration

Use when the resolved agent harness is `fx` and the selected execution surface
can invoke and observe the `fx` CLI. This maps the native fx command-line
interface (`fx ask`), not libfx, ACP, or fx native subagents. Native subagent
delegation is deferred to a separate mapping. Follow the parent
[execution contract](../SKILL.md) and [configuration](configuration.md);
workflow owns phase requirements and tracker owns work records.

Command and response details follow the official
[`fx ask` documentation](https://fx.sh/docs/using-fx/fx-ask). This confirms the
documented CLI shape; it is not a live mstack runtime or reliability trial.

## Availability and launch

Confirm `fx` is installed and authenticated for the intended provider/account,
and that the selected model is available through that account. Resolve the
assigned checkout and the runtime's project-admission and workspace policy
before launch. `fx ask` runs in the current working directory; it does not create
a separate checkout or filesystem isolation. Multiple workers must not edit a
shared checkout concurrently unless the runtime/project explicitly provides
safe isolation and admission.

The `fx ask` command accepts a prompt, `--model <model-id>`, and, for supported
models, `--effort <level>`. Pass the mandate as prompt data, not shell syntax;
construct an argument array rather than interpolating it into a shell command.
Do not assume model IDs or account access transfer from another harness. Use
configured model candidates and options, and verify model/effort support before
dispatch. A model string alone does not prove which provider or account served
it.

A one-shot launch can use:

```bash
fx ask --json --no-save --model "$model" --effort "$effort" "$mandate"
```

Omit `--effort` when not configured or supported. Use `--no-save` for a
one-off worker so it does not create resumable conversation state. If structured
output is not needed, omit `--json`; otherwise parse the JSON and check both the
process exit status and the reported `exit_code` before accepting `final_output`.
A nonzero status or empty `final_output` is an execution failure/incomplete
response, not a validated phase result. The worker's response remains subject
to workflow validation and tracker reconciliation.

## Observe, continue and recover

The runtime observes the `fx ask` process and its stdout/stderr. With `--json`,
stdout is a JSON result and progress/diagnostics are on stderr. Retain the
process identity and available output with the assignment. A timeout or lost
runtime connection is not proof that the process stopped or that the request
failed; reconcile the process and retained output before retrying or using a
configured fallback.

Do not use `--resume last` or another saved session to continue an admitted
worker across controller sessions. The shared controller contract requires a
later session to reconcile the previous worker and start fresh work from current
project records after its outcome is known. fx session recovery is a harness
feature, not authoritative project state.

## Halt and limitations

This mapping does not define a per-request cancellation command or confirm
process-tree termination. A runtime may expose process cancellation, but do not
claim the worker stopped until the runtime confirms the relevant process and
work have ended. If cancellation cannot be confirmed, retain worker ownership
and follow the parent recovery-only policy. Use the shared `drain` default;
`onDeadline: halt` is unsupported unless the selected runtime independently
provides and verifies cancellation and terminal-state observation.

The mapping does not establish exclusive controller admission, runtime
availability, model compatibility, concurrent-edit safety, or live operational
validation. Confirm those capabilities for the selected runtime/harness pairing
before unattended dispatch. fx native subagents are not covered here; their
current-session lifetime, shared workspace and cancellation behavior require a
separate integration mapping before selecting `delegation: subagent`.

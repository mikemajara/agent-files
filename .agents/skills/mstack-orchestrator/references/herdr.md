# Herdr integration

Use for agent harnesses controlled through an existing Herdr server. Follow
the parent [orchestrator contract](../SKILL.md) and shared
[configuration policy](configuration.md). Workflow owns phase requirements;
tracker owns story/PR operations.

Herdr is the supported mstack 0.2.0 runtime based on its published CLI and
agent-automation documentation. This mapping has not had a live mstack trial.
Use `drain` by default; hard halt remains unsupported unless the selected
harness can confirm process-tree termination.

## Availability and capabilities

Resolve the Herdr server/session and project checkout before dispatch. A server
may be controlled from an unattended process; an interactive PM pane is not a
universal prerequisite. Inspect the selected target, available shell panes and
live agents before creating or reusing a worker. Installation, server startup
and integration activation are separate setup work.

Herdr sessions provide separate runtime namespaces, not a project-keyed
controller lock. Require the configured launcher/scheduler to establish the
parent orchestrator's exclusive project admission before dispatch. If that
exclusivity cannot be confirmed, do not start an unattended run.

Herdr does not provide project-level admission in this mapping. Its documented
hard process-tree cancellation is also unsupported unless the selected
harness supplies and verifies that capability; use `drain` otherwise.

`execution.runtimeOptions.session` or `execution.runtimeOptions.machine`
selects the target. Use only one targeting mode for an operation.

Use Herdr's [CLI reference](https://herdr.dev/docs/cli-reference/) to check the
installed command surface. Bind operations to the same server/session. The
examples below assume that target and the variables have already been resolved.
Do not rely on whichever pane happens to have focus.

For a named session, prefix the operations with
`herdr --session "$session_name"`; for a configured remote machine, use its
supported `--machine` selector instead. Retain that target with the run record.

| Configured harness | Herdr kind mapping |
| --- | --- |
| `codex` | `codex`; pass the selected model as `-m <model>` in the argument array after `--`. |
| `agent-cursor` | `cursor`; pass the selected model as `--model <model>` in the argument array after `--`. |
| `fx` or another harness | No mapping supplied here; verify supported kind/executable and control operations before dispatch. |

Keep model arguments as separate array entries rather than interpolating them
into a shell command. Herdr's automation example uses `-m <model>` for Codex;
Cursor documents `--model <model>` for its CLI. Use the interactive harness
mode so Herdr can retain and observe the worker; non-interactive modes require
a separate lifecycle mapping. See [Herdr agent automation](https://herdr.dev/docs/agent-automation/)
and [Cursor CLI parameters](https://docs.cursor.com/en/cli/reference/parameters).

Herdr selects the interactive executable through its kind. Resolve model and
other launch arguments through that harness's verified interface and project
settings. There are no Herdr-specific role/model defaults. A configured name
alone does not establish support.

## Execution operations

Use agent operations for recognized coding agents and pane operations for
terminal topology. A worker needs an available shell pane in its assigned
checkout; a pane does not provide filesystem isolation by itself.

```bash
herdr agent list
herdr pane get "$worker_pane"
herdr agent start "$worker_name" --kind "$kind" --pane "$worker_pane" -- "${harness_args[@]}"
herdr agent get "$worker_name"
herdr agent prompt "$worker_name" "$mandate" --wait --timeout "$wait_ms"
```

`worker_name` must be unique among live agents. `harness_args` is an argument
array resolved before launch, including the selected model and workspace
options supported by that harness. `mandate` contains the task assignment from
the parent run procedure. Quote it as data, without shell evaluation.

The [agent automation contract](https://herdr.dev/docs/agent-automation/)
defines startup and wait behavior. A successful start observes readiness in the
chosen terminal. Prompt/wait returns runtime observations; it does not validate
the assigned phase. Idle/done means ready for input, and blocked describes a
detected approval/question UI. Interpret those observations through the parent
reconciliation procedure.

Retain the server/session, pane, returned agent identity and any reported
native session identity with the run's story/phase assignment. Names follow
the live occupant, so verify the current occupant before continuation or stop.
Reusing a pane does not select an unrelated conversation for continuation.

For a wait that returns before the task settles, inspect the recorded worker
and continue observation rather than submit the mandate again:

```bash
herdr agent get "$worker_name"
herdr agent wait "$worker_name" --timeout "$wait_ms"
```

Use finite waits or an external supervisor to leave run controls observable.
Recompute the remaining admission window between waits. A wait timeout is not
a cancellation. If launch or prompt delivery is uncertain, reconcile that
worker before retry or fallback.

## Failure and cleanup

On an explicit halt or supported halt deadline, close admission first. Herdr
provides an input operation for requesting interruption of the recorded worker:

```bash
herdr agent get "$worker_name"
herdr agent send-keys "$worker_name" ctrl+c
```

The harness determines the effect of that key. Confirm interruption and any
remaining processes using a verified harness-specific procedure. An idle badge
or successful key delivery is insufficient to claim that all work stopped.
The documented Herdr operations do not establish a process-tree termination
guarantee. Treat `ctrl+c` as best effort, not confirmed cancellation. Hard
`onDeadline: halt` is unsupported unless the selected harness supplies a
verified process-tree stop and confirmation procedure. The default `drain`
policy remains available. If a halt is requested without that capability,
report active/uncertain work and retain ownership instead of launching a
replacement. Releasing detection metadata does not terminate a process. Do not
stop the whole server to cancel one run.

After a confirmed stop, reconcile late outputs through tracker under the parent
contract. Reuse only a confirmed available shell pane and the intended session
context. Pane/window reuse and cleanup follow project execution settings.

---
name: mstack-workflow
version: 0.2.0
description: Define and follow story phases, readiness gates, verification requirements and project memory. Use when researching, refining, implementing or validating stories, or shaping a new story.
---

# mstack-workflow

Workflow holds the rules: phases, gates, transitions and memory. Orchestrator
coordinates stories through those phases. Tracker performs record operations.
These skills guide behavior; access is controlled by the environment the actor
runs in.

Cross-skill links are relative to this skill directory. A full mstack release
installs all three version-matched skill directories as siblings, preserving
their names and layout. Workflow rules may be used independently; if an
operation depends on a linked sibling that is missing, stop that operation and
report the incomplete installation rather than substituting another version.

Own phase definitions, prerequisites, required outputs, exit validation and valid
transitions. Apply the same standards to every actor. Use workflow directly
when performing a phase; it requires neither of the other skills to apply its
rules. To run stories through the pipeline, use
[mstack-orchestrator](../mstack-orchestrator/SKILL.md). For record operations, use
[mstack-tracker](../mstack-tracker/SKILL.md). Both follow workflow's contracts.

Inspect the codebase for current behavior and follow project `AGENTS.md` for
project instructions.
Read project `AGENTS.md` and relevant project memory before work.

Material decisions, facts, questions and gotchas as they arise are captured in [memory](references/memory.md).

Read [lifecycle](references/lifecycle.md), the flow across phases, to establish the current
phase, the phase-file header fields, and valid destinations. Each phase contract is a
file under [phases](references/phases/). Use [work-item attributes](references/attributes.json) for
[type][attribute:type], [priority][attribute:priority], [phase][attribute:phase] and
[status][attribute:status] definitions. `label` names an attribute or value; `children`
lists its values. Concrete tracker mappings belong to tracker. Attribute values do not
establish readiness or completion; phase contracts still apply, including
limitations explicitly marked in their references.

## Project layout and issue tracking

Project memory lives in `.mstack/memory.md`. Optional `.mstack/config.json`
holds shared project settings; execution settings are needed only when coordinating
workers. Orchestrator's optional, gitignored `.mstack/config.local.json` overrides
execution choices only, not shared workflow rules or tracker selection. Local
stories use `.mstack/issues/` under the selection rules below.

> **Use filesystem issues only when no issue tracker is selected. A configured
> tracker being unavailable does not activate this fallback.**

When no issue tracker is selected by project configuration or the current
request, use `.mstack/issues/`. Tracker owns [selection](../mstack-tracker/SKILL.md#issue-tracker-selection)
and the [filesystem contract](../mstack-tracker/references/filesystem.md), including
the issue template and concrete operations. The same phase, verification and
completion requirements apply to local and hosted stories. Issue storage does
not supply PR hosting or waive a missing PR capability.

## Phase contracts

Read the reference for the phase being performed:

| Phase or concern | Reference |
| --- | --- |
| [Research][phase:research] — Establish facts | [Contract](references/phases/research.md) |
| [Refinement][phase:refinement] — Specify scope and acceptance criteria | [Contract](references/phases/refinement.md) |
| [Implementation][phase:implementation] — Produce a change ready for [QA][phase:qa] | [Contract](references/phases/implementation.md) |
| [QA][phase:qa] — Judge the specified behavior | [Contract](references/phases/qa.md) |
| Define scenarios or judge evidence | [Verification](references/verification.md) |

[Implementation][phase:implementation] is ready for [QA][phase:qa] only after
all implementation exit conditions pass and an independent QA actor is assigned.
[QA][phase:qa] passing requires an independent actor and evidence recorded on
the PR. Delivery completion requires merge followed by confirmed story closure under
[story completion](references/lifecycle.md#story-completion). A tracker field
alone does not establish completion. The lifecycle defines the delivery
sequence; the current request determines whether the actor performs merge and
closure. Orchestrator defaults to proposing merge after QA passes.

## Definitions

An actor is a human or agent that works on a project. Both follow this
workflow's contracts. For independent QA, use a different human or a separate
agent session/task that did not implement the change. Renaming or resuming
the implementation session in a QA role does not make it a different actor.

Attribute references use `[name][attribute:value]`, e.g.
`[implementation][phase:implementation]` or `[blocked][status:blocked]`.
Use `[phase][attribute:phase]` for an attribute itself. These are semantic
markers, not navigation links; look up the labels in
[attributes.json](references/attributes.json) with grep or rg.

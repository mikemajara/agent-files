---
entry: true
output: research-brief
forward: refinement
---

# Research

## Entry prerequisites

Stories in [research][phase:research] identify a problem, a requested capability, or a possible change in
the project whose relevant facts need investigation. A feasibility question is in
scope for that identification, including, and not only, whether a capability can
be added and what effect it has on the wider project.

## Required outputs

A [research][phase:research] brief with the request, relevant current-state evidence,
remaining factual unknowns and decisions needed to shape a specification. Distinguish
observed facts from recommendations.

## Exit validation

| Required question | Pass condition |
| --- | --- |
| What change or problem is being considered, and what is true today? | Stories in [research][phase:research] capture the request and the affected behavior or system, and cite inspected sources or observations that establish the relevant current behavior, including the absence of the requested capability where that applies. |
| Do the established facts support a feasible, testable specification? | Stories in [research][phase:research] list the remaining choices and factual unknowns, or state that none remain. No unresolved factual unknown prevents defining feasible scope, acceptance criteria, and verification scenarios. Product choices may remain for [refinement][phase:refinement]. |

Investigation prompts: affected users, dependencies, compatibility, project
conventions and behavior to preserve. Use the prompts relevant to the change;
retain material findings and uncertainty. These are guidance, not extra gates.

## Valid destinations

Stories in [research][phase:research] leave that phase for
[refinement][phase:refinement] when both pass conditions are true. Research may
also record evidence supporting a decision not to proceed or a duplicate
disposition. Apply [lifecycle](../lifecycle.md#story-completion) for those
non-delivery outcomes: they are closure decisions, not research-gate passes or
phase transitions, and require authorization under the current request and
project instructions. Otherwise, continue in [research][phase:research] or
hold the story [blocked][status:blocked] under [lifecycle](../lifecycle.md).

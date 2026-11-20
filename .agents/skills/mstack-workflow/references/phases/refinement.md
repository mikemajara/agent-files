---
entry: true
output: specification
forward: implementation
returns: [research]
---

# Refinement

## Entry prerequisites

Stories in [refinement][phase:refinement] request a change in the project that is to be specified.

## Required outputs

Stories in [refinement][phase:refinement] contain a specification with the goal,
scope, exclusions, testable acceptance criteria and verification scenarios.
Record any product or technical constraints that affect implementation or
judgment in the specification; state when none apply. When the change
could affect behavior that must be preserved, name that behavior so QA can
check it for regressions.

Only this phase changes the specification. A return here invalidates earlier
QA verdicts under [specification changes](../lifecycle.md#specification-changes).

## Exit validation

| Required question | Pass condition |
| --- | --- |
| What change is being specified? | Stories in [refinement][phase:refinement] state the goal, scope and exclusions, with testable acceptance criteria. The specification can be judged without the original conversation. |
| Are the constraints that affect implementation or judgment captured? | Relevant product and technical constraints are reflected in the scope, acceptance criteria or verification scenarios. State when none apply; examples such as compatibility, performance, security and behavior to preserve are prompts, not a mandatory checklist. |
| Can the result be implemented and judged from these stories? | Stories in [refinement][phase:refinement] resolve the product decisions needed to implement and judge the result. Each acceptance criterion has a verification scenario with prerequisites and an expected observable result. Choices that do not block implementation are identified. |

## Valid destinations

Stories in [refinement][phase:refinement] leave that phase when all required
pass conditions are true. The
next phase is [implementation][phase:implementation]. They return to
[research][phase:research] when a missing fact prevents the specification. Otherwise
they continue in [refinement][phase:refinement] or are held [blocked][status:blocked]
under [lifecycle](../lifecycle.md).

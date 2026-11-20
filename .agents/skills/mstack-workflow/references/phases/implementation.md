---
entry: true
output: reviewable-change
forward: qa
returns: [refinement]
---

# Implementation

## Entry prerequisites

Stories in [implementation][phase:implementation] state the goal, what is in
scope, what is out of scope, and testable acceptance criteria. Scope and product
decisions needed to implement and judge the result are resolved. Each acceptance
criterion has a verification scenario with prerequisites and an expected
observable result. The specification must be assessable without the original
context. Choices that do not block implementation are identified. Relevant
constraints that affect implementation or judgment are captured in the
specification, or it states that none apply.

## Required outputs

Stories in [implementation][phase:implementation] contain the code for the features the specification describes, and that code stays within the specified scope.

During [implementation][phase:implementation], create a version-control branch
and open a pull request (PR) for the story. The default is one story, one branch
and one PR. Research and refinement alone do not require a branch or PR.

Name the branch `<type>/<story-reference>-<short-description>`, using the story's
[type][attribute:type]: [feat][type:feat], [fix][type:fix] or [nit][type:nit].
The story reference identifies the story in its tracker; it need not be a GitHub
issue number.

The PR links to the story, describes the changes included and identifies the
implementing actors so QA can be assigned independently. The story links back
to the PR. Keep the specification, acceptance criteria and verification
scenarios in the story; record results and evidence on the PR under
[QA](qa.md).

Before requesting QA, run the available project checks that apply to the change,
following project instructions. Record the commands and outcomes on the PR. If
the project provides no applicable runnable checks, state that explicitly.
Acceptance criteria still require the independent QA verdict; these
implementation checks do not replace it.

For a [fix][type:fix] story, record the
[fix reproduction](../verification.md#fix-reproduction) on the PR before
requesting QA.

Keep the specification unchanged during implementation. A needed specification
change returns the story to [refinement][phase:refinement] under
[specification changes](../lifecycle.md#specification-changes).

## Exit validation

| Required question | Pass condition |
| --- | --- |
| Does the change stay within the specified scope? | Stories in [implementation][phase:implementation] change only what the specification covers. |
| Are all the specified features implemented? | Stories in [implementation][phase:implementation] implement every feature the specification describes. The change is that code or configuration. |
| Is the change available for review and QA? | The implementation is on the story's branch in an open PR that describes the included changes and identifies the implementing actors. The story and PR link to each other, and the acceptance criteria have executable verification scenarios. |
| For a fix story, is the defect reproduced on base and resolved on head? | [Fix][type:fix] stories record the [fix reproduction](../verification.md#fix-reproduction) on the PR: it fails on the base commit and passes on the head commit, or the PR states why that is impractical and the substitute evidence used. Not applicable to other types. |
| Did the applicable implementation checks pass? | Run applicable project checks and record commands and outcomes on the PR. They all pass, or the PR explicitly states that no applicable runnable checks are available. A failed or unreported applicable check does not pass this gate. |

## Valid destinations

Stories in [implementation][phase:implementation] are ready for QA when all
pass conditions are true. Assign an independent actor under [QA](qa.md) before
QA starts. They return to [refinement][phase:refinement] when the specification
does not cover the entry prerequisites. Otherwise they continue in
[implementation][phase:implementation] or are held [blocked][status:blocked]
under [lifecycle](../lifecycle.md).

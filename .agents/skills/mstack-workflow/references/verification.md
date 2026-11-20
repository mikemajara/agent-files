# Verification

## Required traceability

Connect every acceptance criterion to one or more verification scenarios. Each
scenario identifies its prerequisites, inputs or actions, and expected
observable result. For each execution, record the observed result, retained
evidence and tested commit; identify the tested build or instance when it
affects the result. Retain evidence after cleanup. Projects may choose their
own record layout; the required facts must remain clear and traceable per
scenario.

Before accepting an execution record, check that every acceptance criterion
has scenario coverage, each scenario has enough detail to execute and judge,
and each execution identifies its result, evidence and tested commit. Evidence
must show the expected behavior, not only that a command completed.

Record QA execution results, evidence links and the verdict on the PR as defined
by [QA](phases/qa.md). Link them to the story's acceptance criteria and
verification scenarios, and identify the tested commit. The story links to the
verdict without duplicating the report.

## Fix reproduction

A [fix][type:fix] story records one reproduction of the defect on the PR: the
scenario, the command or steps, the result on the base commit and the result
on the head commit, with both commits identified. The base result shows the
reported defect, not an unrelated failure; the head result shows the expected
behavior. If a base reproduction is impractical, record why and the substitute
evidence used. QA reruns the reproduction on both commits, or judges whether
the substitute demonstrates the fix.

## Scope and regression check

QA records one check covering both the diff and its reach:

1. **Scope.** Each change in the diff traces to the specification. A change it
   does not cover is a code defect to remove, or a specification hole when
   the change is needed.
2. **Regressions.** Name the behavior outside the acceptance criteria that the
   change could affect, such as callers, shared data, configuration or
   behavior the specification says to preserve. Effort follows risk. For each
   named risk, run at least the cheapest check that would catch it.

Record the risks, checks and results with the verdict. Stating that nothing
could be affected without inspecting the diff is not a pass. Only a
demonstrated failure, with its command or steps and observed result, fails
this check; an unproven concern is recorded as a note. A failure that already
occurs on the base commit and that the change does not reach is recorded
separately, not as a regression.

## Judgment

Evidence must demonstrate the required behavior. A successful command or a completion
field alone is insufficient. Do not substitute an easier check for an unreachable
required scenario. Missing required evidence blocks a pass; established code defects
return to [implementation][phase:implementation] and specification holes return to
[refinement][phase:refinement]. Apply the same standards regardless of actor or harness.

A verdict applies to the tested commit. If that commit changes before merge,
rerun every required acceptance scenario, the head side of any fix
reproduction and the scope and regression check on the new commit, and record
the new results and evidence. Old or replayed evidence is not automatically current
proof. A return to refinement invalidates earlier QA verdicts under
[specification changes](lifecycle.md#specification-changes). Only refinement
changes the specification; a separate specification version is not required.

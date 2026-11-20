# Filesystem integration

> **Use filesystem issues only when no issue tracker is selected. A configured
> tracker being unavailable does not activate this fallback.**

Use under the parent's [selection rules](../SKILL.md#issue-tracker-selection),
or when filesystem tracking is explicitly selected. Follow the parent
[tracker contract](../SKILL.md) and workflow's phase contracts. This integration
provides issue storage, relationships and recorded workflow facts. PRs, QA
records and merge confirmation require a separate integration.

Validation pending: this integration requires a short-lived lock for a file
mutation when writers could overlap, but no concrete lock provider or live
concurrent-writer trial has validated the behavior. Do not assume filesystem
issue files provide locking or safe concurrent writes.

Use an environment-provided lock scoped to the issue file being changed. Hold
it only while reading the current file, checking and applying the change, and
confirming the result; then release it. The lock must recover automatically if
its owner crashes, so it cannot leave the file locked indefinitely. Do not
lock the whole project or controller session for filesystem writes. Do not
approximate a lock with issue labels, assignees, or a non-atomic file check.
Independent issue-number allocation and concurrent writes across worktrees
remain unsupported.

## Project and record identity

Use `.mstack/issues/` at the target project root. Create the directory only
when creating the first issue; reading a missing directory means no local
issues yet, provided access to the project root succeeds. An unreadable
directory is a read failure, not an empty backlog.

Each issue is a Markdown file named `<number>.md`, such as `123.md`, with an
immutable positive integer number, no leading zeroes and no title slug. Its
identity is the project plus `.mstack/issues/123.md`. Use the repository's
known identity, or its designated root path when no remote exists, to qualify
the project. A bare number is ambiguous across projects and trackers. Use
`local-123` as the story reference in workflow's branch naming convention;
it is not GitHub issue `#123`.

Retain closed files in the same directory. Do not renumber, delete or reuse
issue numbers. Commit issue files and their updates through the project's
permitted version-control route; preserve unrelated changes. Report local
confirmation separately from commit or publication confirmation. Uncommitted
records are provisional until committed through the project's chosen route.

Designate one authoritative checkout for issue reads and writes before the
first operation. During a coordinated run, the controller alone writes issue
records; workers return proposed updates with their findings, and the controller
serializes and confirms them. For standalone use, the caller must ensure one
writer and serialize allocation and updates there, including requests from
workers in other worktrees. Give workers the record identity and current
contents; a branch copy is not current tracker state. If the checkout cannot
be accessed or single-writer use cannot be ensured, report the missing access
or concurrency control rather than writing a second copy. Commit and
publication procedures follow project policy; this contract does not include
direct default-branch writes or pushes in the operation's scope.

## File format

Use UTF-8 Markdown with a YAML frontmatter block delimited by `---`. All fields
below are required; empty arrays are valid. The body after frontmatter is the
canonical specification and issue notes, not a separate `body` YAML property.

| Field | Representation |
| --- | --- |
| `number` | Positive integer matching the filename; immutable |
| `title` | Nonempty quoted string; may change without renaming the file |
| `state` | `open` or `closed`, separate from workflow status |
| `labels` | Array of strings, including assigned workflow attributes as `<attribute>:<value>` |
| `assignees` | Array of project-recognized actor names; naming one records assignment, not tool access or run scope |
| `createdAt` | Quoted UTC ISO-8601 timestamp; retained on update |
| `updatedAt` | Quoted UTC ISO-8601 timestamp; refreshed on every issue edit |

Map assigned attributes using workflow's [vocabulary](../../mstack-workflow/references/attributes.json),
for example `type:fix`, `priority:high`, `phase:refinement` and `status:open`.
Use one label per assigned attribute. Replace the previous value when changing
an attribute and preserve other labels. Resolve missing values when needed
and conflicting values before recording a transition; do not guess defaults.
There are no separate YAML `phase` or `status` fields and no `status:done`.

Start from the bundled [issue template](../assets/issue.md), replacing its
number, title and timestamp placeholders with actual values. It intentionally
supplies no default workflow labels. Fill in content required by the current
[phase contract](../../mstack-workflow/SKILL.md#phase-contracts); unused optional
sections may be omitted. Placeholder text and empty headings do not satisfy
gates. Store findings and open questions in the body and append dated,
attributed notes for discussion. Keep the specification current rather than
maintaining a second editable plan or promoted copy.

Preserve unknown frontmatter keys and unrelated body content on edits. Treat
malformed YAML, duplicate keys, filename/number mismatches, missing required
fields and invalid field types as record problems requiring correction. Do
not hide them from a backlog result or silently repair them by inventing facts.

## Find and read

Enumerate all issue files, including closed records, before narrowing a search.
From the designated project root, after checking directory availability:

```bash
rg --files --hidden --no-ignore .mstack/issues
rg -n --hidden --no-ignore --glob '*.md' 'login|redirect' .mstack/issues
cat .mstack/issues/123.md
```

Read frontmatter to filter by state and assigned attributes. Text matches may
come from notes or examples; they do not establish a record's current labels.
For queues such as active, blocked or available implementation work, combine
`state: open` with the relevant `status:*` and `phase:*` labels. Disclose the
checkout, filters, limits and any unreadable or invalid records. Keyword
matches are duplicate candidates, not proof of duplication.

## Create and update

1. Read current records in the authoritative checkout and search open and
   closed issues for the same outcome before creating one. Inspect candidates;
   do not create a duplicate merely because its wording differs.
2. With no other issue write in progress, allocate one greater than the
   highest retained number, or `1` for an empty backlog. Check filenames and
   frontmatter agree first. Reconcile missing tracked files or pending issue
   changes from other writers before allocation. Recheck that the destination
   does not exist and create without overwriting an existing file. If a
   collision appears, read and reconcile it before choosing another number.
3. For an update, read the entire current file and retain that version while
   preparing the edit. Check it is unchanged immediately before writing. If
   it changed, reconcile rather than overwrite it. Keep writes serialized;
   this check alone does not make concurrent writes safe.
4. Apply only the intended edits, preserve the number and `createdAt`, and
   refresh `updatedAt`. Re-read the result to confirm content, metadata and
   relationships. Return the project-qualified path and confirmed changes.
5. Commit/publish using project policy, reporting anything still provisional.
   After an uncertain write, read and search current records before retrying;
   do not allocate another issue until the original outcome is reconciled.

## Relationships, QA and completion

Record related issues and established duplicates as project-qualified paths
or full remote record URLs in the body. Record a blocker with the missing
prerequisite and observable resume condition under workflow's
[blocked-work rules](../../mstack-workflow/references/lifecycle.md#missing-inputs-blocked-work-and-resume).
An assignee, label or successful file write alone proves no workflow gate.

Keep PR and QA-verdict URLs in the issue's relationships section. Link from
the PR to the issue using an accessible repository file URL when hosted; also
retain the project-qualified path so its local identity is clear. Do not use
`Closes #123` for a local issue. If a required story or specification link is
inaccessible, report the missing capability/input under the parent contract.

Only refinement changes the specification sections. Record a return to
refinement in the issue notes and mark the earlier verdict as superseded on
the PR, linking to the return, under
[specification changes](../../mstack-workflow/references/lifecycle.md#specification-changes).
A separate specification version is not required. A Git file permalink may
make a committed story accessible to reviewers without adding a versioning
requirement. Follow [verification](../../mstack-workflow/references/verification.md)
for tested commits, invalidation and retained evidence. QA execution results
and the verdict stay on the PR; the issue links to them without duplicating
the report.

Record phase/status changes only after validation under workflow. For delivery
closure, follow [story completion](../../mstack-workflow/references/lifecycle.md#story-completion):
after QA passes for the current commit with no intervening return to refinement
and merge is confirmed through the PR integration, record the merge reference
in the body, set `state: closed`,
refresh `updatedAt` and re-read the file. Keep the final phase as QA; do not
invent a completion status. If closure fails after merge, report merge as
confirmed and the issue update as pending, then resume that remaining update.

For non-delivery closure within the request, record the decision and reason
in the notes, and link to the original story for a duplicate. Set
`state: closed`, refresh `updatedAt` and re-read the file. A duplicate also
records `status:duplicate`. These outcomes do not require QA or merge and are not
delivered work. Retain the closed file under its original number.

Without a PR capability, continue independent work where possible and report
the affected delivery operation as unavailable. Filesystem issues do not waive
workflow's PR, QA, evidence or merge requirements for delivery. Changing the
tracker selection does not convert existing files into hosted issues or turn
them into a cache.

## Claim and release

For each mutation, acquire the lock for that issue file before reading it and
hold it through the confirmed write and read-back. If a lock is unavailable,
do not write concurrently; report the conflict or unavailable capability.
Re-read and reconcile the current record before applying a proposed update.
Record the run/actor in a dated note and `assignees`, change `status:open` to
`status:doing`, and re-read to confirm before dispatch. No concurrent writer
may claim the same story.

Release only after confirming the worker stopped and reconciling its outputs.
Record the release, remove this run's assignment and restore `status:open` for
available work on an open story; preserve a validated blocked or duplicate
disposition. If a worker may remain active, retain its ownership and report the uncertainty.
Changing labels or assignees alone is not a lock for concurrent controllers.

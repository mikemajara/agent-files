# GitHub integration

Use for stories stored in GitHub Issues, for PRs hosted on GitHub, or both.
Follow the parent [tracker contract](../SKILL.md). A story stored elsewhere
keeps its identity and specification in that system; use this integration only
for its GitHub records and link back to the story's full URL. For
[filesystem stories](filesystem.md#relationships-qa-and-completion), use
an accessible repository file URL and retain the project-qualified issue path.

Workflow owns phase prerequisites, required content, validation and completion.
This reference maps those records and operations to GitHub. Read the linked
workflow contract for requirements; the command examples do not establish gates.

This integration does not automatically migrate legacy labels or maintain an
offline cache/export. Legacy phase labels such as `phase:refine` and
`phase:implement` require an explicit migration decision; changing tracker
selection applies to new stories and does not migrate existing records. Any
export used outside this integration must be marked with its source, time and
coverage and does not substitute for a current GitHub read. GitHub Projects
fields are outside this Issues/PR mapping.

## Availability and target

Use an installed, authenticated `gh` with access to the target repository.
Specify the repository on operations; story and PR repositories may differ.
Confirm access with `gh repo view` and a read of the required Issues or PR
record. An authentication check alone does not establish repository access.

Examples below use these task-specific variables; replace their values with
the actual target and record IDs. Issue and PR numbers are independent.

```bash
repo="OWNER/REPO"
issue=123
pr=456
gh repo view "$repo" --json nameWithOwner,url
```

Handle missing `gh`, authentication failures, disabled Issues and access errors
under the parent's availability rules. Report the missing capability. A
previous export does not substitute for a failed current read.

## Record and attribute mappings

| Workflow record | GitHub representation |
| --- | --- |
| Story identity | Repository plus issue number and full issue URL, when Issues stores the story |
| Specification | Issue body; content follows the applicable [phase contract](../../mstack-workflow/SKILL.md#phase-contracts) |
| Phase findings and holds | Issue body or comment URLs; content follows the applicable phase contract and [lifecycle](../../mstack-workflow/references/lifecycle.md#missing-inputs-blocked-work-and-resume) |
| Change | PR URL, head branch, tested commit and target base branch |
| QA | PR comment and evidence URLs; content follows [QA outputs](../../mstack-workflow/references/phases/qa.md#required-outputs) |
| Relationships | Cross-links in issue/PR bodies and QA-comment URLs, under the parent tracker contract |
| Story completion | GitHub issue state when Issues stores the story; closure follows [workflow completion](../../mstack-workflow/references/lifecycle.md#story-completion) |

Map each assigned workflow attribute to a label named `<attribute>:<value>`.
The [workflow vocabulary](../../mstack-workflow/references/attributes.json) defines
meaning; [github-labels.json](github-labels.json) supplies the GitHub names,
colors and short display descriptions.

| Attribute | Labels |
| --- | --- |
| [type][attribute:type] | `type:feat`, `type:fix`, `type:nit` |
| [priority][attribute:priority] | `priority:high`, `priority:medium`, `priority:low` |
| [phase][attribute:phase] | `phase:research`, `phase:refinement`, `phase:implementation`, `phase:qa` |
| [status][attribute:status] | `status:open`, `status:doing`, `status:blocked`, `status:duplicate` |

Use one matching label for each assigned attribute. When changing an attribute,
remove its previous label and preserve labels for other attributes and unrelated
project concerns. Missing or conflicting values need resolution, not a guessed
default. Legacy `phase:refine` and `phase:implement` labels do not map
automatically. GitHub's open/closed issue state is separate from workflow
[status][attribute:status]; there is no `status:done` label.

### Label setup and checking

Locate this installed tracker skill's directory and invoke its bundled
[helper](../scripts/github/setup-labels.mjs) by absolute path. Run it only for a
repository using the Issues attribute mapping. It requires Node.js and `gh`.

```bash
tracker_skill="/absolute/path/to/installed/mstack-tracker"
node "$tracker_skill/scripts/github/setup-labels.mjs" --repo "$repo" --check
node "$tracker_skill/scripts/github/setup-labels.mjs" --repo "$repo" --dry-run
node "$tracker_skill/scripts/github/setup-labels.mjs" --repo "$repo" --apply
```

The default is `--check`. Check compares all configured labels, including their
colors and descriptions. Dry-run reports proposed changes. Apply creates
missing labels or updates changed metadata and then verifies the result.
Existing labels outside the mapping are preserved. Add `--format json` for
machine output. Exit codes are 0 for a successful check, preview or apply,
1 for check differences, and 2 for an operation or verification failure.
Failures report writes acknowledged by GitHub; re-read current state before
retrying.

## Find and read

```bash
gh issue list --repo "$repo" --state open --label "status:doing" --limit 50 \
  --json number,title,labels,updatedAt,url
gh issue list --repo "$repo" --state open \
  --label "status:open,phase:implementation" --limit 50 \
  --json number,title,labels,updatedAt,url
gh issue list --repo "$repo" --state all --search "login redirect" --limit 20 \
  --json number,title,labels,state,url
gh issue view "$issue" --repo "$repo" \
  --json number,title,body,labels,state,comments,updatedAt,url
gh pr view "$pr" --repo "$repo" \
  --json number,title,body,state,url,headRefName,headRefOid,baseRefName,comments,mergedAt,mergeCommit
```

Read the existing body and labels before preparing an edit. List/search
results may be filtered or capped: retain their query and limit, and fetch
further results when completeness matters. A keyword match does not establish
that an issue is a duplicate or that a PR implements it.

## Create and update stories

Prepare the complete intended body in a file. Preserve unrelated content when
editing an existing body. The example values illustrate GitHub syntax; use the
attributes supplied for the actual story.

```bash
gh issue create --repo "$repo" --title "Repair login redirect" \
  --body-file /tmp/story.md \
  --label "type:fix,priority:high,phase:refinement,status:open"
gh issue edit "$issue" --repo "$repo" --body-file /tmp/story.md
gh issue edit "$issue" --repo "$repo" \
  --remove-label "status:open" --add-label "status:doing"
gh issue edit "$issue" --repo "$repo" \
  --remove-label "phase:refinement" --add-label "phase:implementation"
```

The label edits record updates validated under the
[workflow lifecycle](../../mstack-workflow/references/lifecycle.md). Re-read labels
before updating them and remove the actual prior value. Store a workflow hold
record or a duplicate relationship in the issue body or a linked comment.

Read the issue after writing to confirm its body, labels and relationships.
After creating a story, retain the returned URL and use its number for further
operations. Search current records before retrying an uncertain creation.

## Claims

Before dispatch, read the story and check existing claims and workers. Record
the owning run/actor in an issue comment and update `status:open` to
`status:doing` using the label operation above; re-read both to confirm the
claim. Prepare comment content in a file and use
`gh issue comment "$issue" --repo "$repo" --body-file /tmp/claim.md`.
On release, record the stopped worker and reconciled result, then restore
`status:open` only for available work on an open story. Keep validated blocked
or duplicate dispositions. Labels and comments do not provide atomic locking; concurrent
controller admission is not supported by this mapping.

## PRs, QA and tested commits

Use [implementation outputs](../../mstack-workflow/references/phases/implementation.md#required-outputs)
for branch and PR requirements. GitHub's create, edit and comment operations
accept the prepared body files:

```bash
gh pr create --repo "$repo" --base main --head fix/123-login-redirect \
  --title "Repair login redirect" --body-file /tmp/pr.md
gh pr edit "$pr" --repo "$repo" --body-file /tmp/pr.md
gh pr comment "$pr" --repo "$repo" --body-file /tmp/qa.md
```

Use the actual base, branch and story reference; the example is not a base-branch
policy. PR creation returns a URL to use for the story/PR relationship through
the selected story integration.

Use a PR comment as the GitHub location for the
[QA output](../../mstack-workflow/references/phases/qa.md#required-outputs). Comment
creation returns the URL for the story's verdict link. The PR's `headRefOid`
identifies its head commit. Issue URLs identify stories. Only refinement
changes the issue's specification; a return to refinement invalidates earlier
QA verdicts under [specification changes](../../mstack-workflow/references/lifecycle.md#specification-changes).
Record the return in the issue body or a comment and mark the earlier verdict
as superseded through a PR comment linking to that return. A separate
specification version is not required. Follow
[verification](../../mstack-workflow/references/verification.md) for tested
commits and retained evidence.

Use the story's full URL when it lives elsewhere, or the filesystem story link
described above. A local issue number is not a GitHub issue number; do not use
GitHub closing keywords for it. For GitHub issues,
[closing keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
such as `Closes OWNER/REPO#123` can close an issue when the PR merges into the
default branch. Use them only for intended stories whose closure is included
in the request; use plain URLs for links otherwise. Before merge, check for
automatic issue closures and keep them within the requested scope. Confirm
any intended closure after merge. Other trackers need
their own closure operation.

## Merge and story closure

Workflow's [story completion](../../mstack-workflow/references/lifecycle.md#story-completion)
determines when merge and closure may occur. The commands below perform an
operation within the current request and project instructions after that
contract passes. Orchestrator defaults to proposing merge after passing QA;
having these commands does not include merge or closure in a run's scope.
Use the repository's permitted merge method and honor GitHub's
required checks and reviews.

For a repository using squash merges, the operation is:

```bash
tested_commit="FULL_COMMIT_SHA_FROM_QA"
gh pr merge "$pr" --repo "$repo" --squash --match-head-commit "$tested_commit"
gh pr view "$pr" --repo "$repo" --json state,headRefOid,mergedAt,mergeCommit,url
```

Use the repository's permitted merge method. The
[head-match option](https://cli.github.com/manual/gh_pr_merge) prevents merging
an unexpected head. A queued or auto-merge request is pending until the PR state
is `MERGED`; the read returns its merge commit identity and time. Workflow's
[verification judgment](../../mstack-workflow/references/verification.md#judgment)
governs changes to the tested commit and invalidated QA verdicts.

When delivery closure is included in the request and the story is a GitHub
issue, verify any automatic closure and close it explicitly if still open
once the workflow completion contract is satisfied:

```bash
gh issue close "$issue" --repo "$repo" --reason completed
gh issue view "$issue" --repo "$repo" --json state,url
```

Use the merge result when recording the operation's outcome through the selected
story integration, including when GitHub closed the issue automatically. If
story storage uses another system, perform and confirm closure through that integration.
A failed closure leaves the merge confirmed and the story update pending;
report that partial result and resume from the remaining operation.

For a decision not to proceed or an established duplicate, record the reason
and the original story link for a duplicate under workflow's non-delivery
closure rule. When closure is within the request, use
`gh issue close "$issue" --repo "$repo" --reason "not planned"`, then read
the issue to confirm closure and its recorded disposition. Do not use
`--reason completed` or imply a delivered change for these outcomes. A
duplicate also records `status:duplicate`, preserving unrelated labels.

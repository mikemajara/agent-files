# Notion integration

Use Notion for story storage and [GitHub](github.md) for PRs, QA records and merge confirmation. Follow the parent [tracker contract](../SKILL.md); workflow owns phase gates, evidence and completion. Selecting Notion does not create matching GitHub Issues or migrate existing stories.

Validation pending: this is an instruction-only database and operation mapping. No Notion connector, API client or provisioning script is bundled, and no live database, permission, pagination or concurrent-writer trial has validated it. An environment must supply the operations below; missing capabilities stop the affected operation, not select filesystem fallback.

## Selection and target

Select `notion` through the current request or the project's `.mstack/config.json`:

```json
{
  "tracker": {
    "issues": "notion",
    "notion": {
      "databaseId": "NOTION_DATABASE_ID",
      "dataSourceId": "NOTION_DATA_SOURCE_ID"
    }
  }
}
```

`tracker.notion` supplies the database container and its designated story data source. These nonempty IDs must identify the same target; do not choose the first data source or resolve a database by its display name. They can instead be supplied explicitly in the current request. This integration uses one dedicated story data source per project. Another project's stories require a separate target, not a title filter. Do not store tokens in project configuration.

Use an authenticated Notion connector or API client with access to the actual database, data source and story pages. It must support distinct database and data-source operations, Unique ID properties, paginated property/block retrieval and targeted block updates; a database-only or search-only connector is insufficient. Confirm the client's supported API version and operation schemas before use. Read the target schema, query its story data source, and, when records exist, read a story's properties and blocks to establish read capability; verify write capability separately when needed. For an empty target, a successful schema read and complete empty query allow first-story creation within scope; its properties and blocks must then be read back before reporting success. Access to a parent page or a workspace search result alone does not establish access to the target records. Report missing sharing, authorization or unsupported operations without exposing credentials.

## Database setup and properties

For a new target, create a database named `mstack Stories` under the explicitly designated parent page, with one story data source and the exact property names and types below. Database creation is a separate, explicitly requested setup operation; selecting Notion does not authorize provisioning or alteration of an existing database. Retain the returned database and data-source IDs, read back the schema, and record the confirmed target in project settings through the project's permitted route.

| Property | Notion property type | Required representation |
| --- | --- | --- |
| `Name` | Title | Nonempty story title; editable without changing identity |
| `ID` | Unique ID | Prefix `MST`; Notion-assigned numeric component, never manually allocated or changed |
| `Type` | Select | `feat`, `fix`, `nit` |
| `Priority` | Select | `high`, `medium`, `low` |
| `Phase` | Select | `research`, `refinement`, `implementation`, `qa` |
| `Status` | Select | `open`, `doing`, `blocked`, `duplicate` |
| `State` | Select | `open`, `closed`; explicitly set `open` when creating a story |
| `PR` | URL | Full PR URL, empty until linked |
| `QA Verdict` | URL | Full verdict-comment URL on the PR, empty until available |
| `Merge` | URL | Confirmed merge reference URL, empty before confirmed merge |
| `Claim` | Rich text | Owning run and actor identities; empty when unclaimed |
| `Created` | Created time | Notion-managed creation time |
| `Updated` | Last edited time | Notion-managed last-edit time |

The four workflow selects map one-to-one to the canonical [attribute vocabulary](../../mstack-workflow/references/attributes.json). Use Select rather than Notion's grouped Status property: phase, activity and closure are separate dimensions. Configure only the listed options. There is no `done` phase or workflow status. `State` is a storage disposition, not an additional workflow attribute.

Every story uses this schema. Assigned workflow attributes have exactly one canonical option; an unassigned attribute remains empty until resolved, with no invented default. Missing values needed for an operation, unknown options, incorrect property types or missing properties require correction before that operation. Never silently create a new option during a story update. `Claim` stores runtime identities rather than requiring actors to be Notion workspace members.

On an existing target, compare property names, types, Unique ID prefix and select options before use. Preserve unrelated properties and content. Report discrepancies; obtain explicit authorization before schema changes, renaming, conversion or migration. Do not overwrite an existing database to make it fit this mapping.

A table view showing these properties is sufficient for initial review. Optional views can filter `State = open`, then `Phase` and `Status`; views and board columns are not canonical workflow facts. Do not use archive or trash as story closure: closed stories remain readable and queryable in the same data source.

## Identity and story content

Retain the project identity, database ID, data-source ID, page ID, returned full page URL and `ID` value after creation. The page ID is stable identity; titles and display names are not. Qualify the numeric ID with its project and Notion target when referring to a story. Use `notion-<numeric-ID>` as the story reference in workflow's [branch convention](../../mstack-workflow/references/phases/implementation.md#required-outputs); for example, `fix/notion-123-login-redirect`. It is not GitHub issue `#123`.

The story page's blocks hold the canonical specification and notes. Use these top-level headings, omitting optional sections when unused:

- `Specification`: the goal, scope, acceptance criteria, verification scenarios and other content required by the current [phase contract](../../mstack-workflow/SKILL.md#phase-contracts).
- `Findings and questions`: research findings and unresolved decisions.
- `Relationships`: related story URLs, established duplicate links and external prerequisites.
- `Activity`: dated, attributed phase outcomes, claims/releases, holds, specification returns and closure decisions.

Empty headings and templates do not satisfy gates. Only refinement changes the specification; other phases append their findings and outcomes without rewriting it. A hold records the missing prerequisite and observable resume condition under [blocked-work rules](../../mstack-workflow/references/lifecycle.md#missing-inputs-blocked-work-and-resume). Use page blocks rather than connector-specific comments for required durable notes, so comment access is not an additional prerequisite.

Keep one canonical specification, not an editable GitHub Issue mirror. PRs link to the full Notion page URL; ensure reviewers can read it. Store the PR URL in `PR` and the verdict-comment URL in `QA Verdict`. Results and evidence stay on the PR under [verification](../../mstack-workflow/references/verification.md); a Notion property is a pointer, not a second QA report. A return to refinement is recorded in `Activity` and supersedes earlier verdicts on the PR under [specification changes](../../mstack-workflow/references/lifecycle.md#specification-changes). Clear the current `QA Verdict` pointer when invalidated, retaining the old URL in the activity note and the original PR record.

## Concrete operations

Map these operations to the environment's available Notion tools or API client. Inspect its supported argument and response schemas; do not guess tool names or treat an operation unsupported by the connector as successful.

| Operation | Notion operation and confirmation |
| --- | --- |
| Inspect target | Retrieve the database and designated data-source schema; confirm membership, property types and options against the table above. |
| Find stories | Query the designated data source by properties. Follow every pagination cursor when completeness matters. Include both `State` values for duplicate searches; disclose filters, cursors, limits and omitted results. Workspace search alone is not a complete backlog query. |
| Read story | Retrieve page properties and all page-block children, recursively following child blocks and pagination. Resolve truncated property values through property retrieval when needed. Return identity, attributes, content and links; report inaccessible or incomplete content. |
| Create story | Search current open and closed stories for the same outcome, inspect candidates, then create a page under the designated data source with supplied properties and specification blocks. Let Notion assign `ID`, `Created` and `Updated`. Retrieve the resulting properties and all blocks to confirm the stored story. |
| Update properties | Read current properties, validate workflow changes, and update only the intended property IDs and values. Preserve unrelated values; read back the changed properties. |
| Update content | Read and identify the affected block IDs, then update those blocks or append notes beneath the appropriate heading. Do not replace the whole page or delete unrelated child blocks. Retrieve affected blocks and their parent ordering to confirm. |
| Link story and PR | Set `PR`, link the story from the PR, and set `QA Verdict` when a verdict exists. Read back both systems' records; report any incomplete side separately. |
| Record transition | Check the applicable workflow gate, record the supporting outcome in `Activity`, update `Phase` and/or `Status`, then read back both note and properties. A partial note/property write requires reconciliation, not an assumed transition. |
| Close story | Record the validated closure decision and references in `Activity`, set `State = closed`, and read back notes, links and properties. Do not archive, trash or delete the page. |

For available implementation work, query `State = open AND Phase = implementation AND Status = open`. Active work uses `State = open AND Status = doing`; blocked work uses `State = open AND Status = blocked`. A filtered view is not an exhaustive duplicate search. Property queries do not search specification blocks: use title matches only to prioritize candidates, then enumerate open and closed stories with pagination and inspect their page content when establishing search coverage. A connector's full-content search can narrow this work only when its coverage is known; disclose any uninspected records rather than claiming no duplicates exist. Sort and pagination must not exclude older eligible stories; expose `ID`'s numeric component for orchestrator's immutable-number tie-breaker.

Before each mutation, re-read current properties and affected blocks. Compare them with the version used to prepare the update; if changed, reconcile rather than overwrite. Last-edit times are drift signals, not an atomic compare-and-swap. Keep writes serialized within the run. On a failed or uncertain creation, query and inspect current records before retrying; no successful response does not prove no page was created. On partial updates, report confirmed fields/blocks and remaining work, re-read, and resume only the missing steps. Follow the parent's [failure handling](../SKILL.md#availability-and-failures).

## Claim and release

This mapping does not provide atomic claims or concurrent-controller admission. Require the environment's exclusive controller admission before coordinated dispatch. The controller serializes story writes; workers return proposed updates. Standalone use requires one designated writer, including coordination with human editors. If exclusive write coordination cannot be ensured, stop the affected mutation instead of treating `Claim`, a view filter or last-edit time as a lock.

Before dispatch, read the current story, inspect `Claim`, activity and known workers, and reconcile existing ownership. For an available open story, record the run/actor in `Claim`, append a dated claim note and change `Status = open` to `doing`. Re-read all three before dispatch. If a claim write is partial or unconfirmed, do not dispatch.

Release only after the worker is confirmed stopped and its outputs are reconciled. Record the release and outcome, clear only this run's claim, and restore `Status = open` only for available work on an open story; preserve validated blocked or duplicate dispositions. Re-read to confirm. If worker state is uncertain, retain ownership and report the reconciliation condition.

## QA, merge and closure

Use [GitHub operations](github.md#prs-qa-and-tested-commits) for the PR, tested commit, independent QA verdict and merge confirmation. GitHub closing keywords do not close a Notion story; use plain story URLs, not `Closes #123`. Notion does not replace PR access or weaken workflow gates.

For delivery closure within the current scope, follow [story completion](../../mstack-workflow/references/lifecycle.md#story-completion): confirm valid passing QA for the current tested change with no invalidating return to refinement, then confirm merge through the PR integration. Retain `PR` and `QA Verdict`, set `Merge` to the confirmed merge reference, record the closure outcome in `Activity`, and set `State = closed`. Keep the final `Phase = qa`; do not invent `Status = done`. Clear a claim only under the release rule above. Read back the page to confirm closure. If Notion fails after merge, report merge as confirmed and story closure as pending; do not repeat the merge.

For authorized non-delivery closure, record the decision and reason in `Activity`, and the original story URL in `Relationships` for an established duplicate. Set `Status = duplicate` for duplicates and `State = closed`; do not invent QA, PR or merge evidence. Read back the disposition. These are not delivered changes. Reopening, tracker migration and schema migration must be explicit decisions, not side effects of a run or a changed selector.

# Project continuity

## v0.1 delivery

The [format and schemas](issues/1.md), [two-agent example](issues/3.md), [offline validator](issues/6.md), and [OpenBot backup skill](issues/8.md) are merged after independent QA. The backup was exercised with synthetic transfer v1 fixtures, not a real export. Preserve the trusted manifest digest separately from the backup. Integration and routine refinements and the second-domain example were follow-up work, not prerequisites for v0.1. Source inventory is not planned for the spec repository. Real environment trials belong in a separate private workspace or repository.

## 2026-11-20 — Agent Files v0.1 setup

[Miguel’s Agent Files repository](https://github.com/mikemajara/agent-files) is the private destination for the spec, docs, versioned schemas, validator and companion backup skill; no npm publication is required. The local issue store and matching mstack skills were migrated to `/Users/miguel/src/github/mikemajara/agent-files`, now the sole authoritative checkout. The former `agents-work` checkout is retained as a planning snapshot. No commits or pushes.

The [Notion design](https://app.notion.com/p/3a5e06b059c48338ae5981adfd0de72c) now describes standalone agents without teams. Supplied and learned memories use agent-owned JSON. The [format](issues/1.md), [example](issues/3.md), [validator](issues/6.md) and [backup skill](issues/8.md) stories are in refinement. Backup coverage, format validity and integrity are separate checks; first use a sanitized OpenBot export and verify against a trusted digest kept outside the backup. No implementation or QA was started.

## 2026-11-19 — Minimum descriptive format

Miguel clarified that the goal is the minimum descriptive definition of agents and teams for humans and agents to read: who they are, how they should behave and what they should connect to. Core concepts are identity, purpose, behavior, knowledge, skills, tools/integrations, routines and relationships. MCP is an optional technical detail. Harnesses, sandboxes, installation, runtime adapters and software-factory workflows are outside the specification, not later prerequisites.

Updated [Notion](https://app.notion.com/p/3a5e06b059c48338ae5981adfd0de72c), project instructions and existing stories to this scope. First sequence: [minimum format](issues/1.md), [small agent/team example](issues/3.md), [readability/consistency](issues/6.md). The name Agent Definition Format is only a suggestion. All records remain in refinement and local/uncommitted; no implementation or dispatch.

The researched projects are related approaches, not accepted matches or mandatory foundations. Agentproto explicitly describes agents, collectives, routines and MCP drivers but also broader runtime contracts. Research does not gate writing the small first format.

The inspected export at /Users/miguel/Downloads/openbot-transfer-2026-11-19/ has agent-local skill references and byte-identical SKILL.md copies for find-skills and sales-engineering; this does not establish runtime skill access. Preserve the export and source repositories. Earlier dated planning entries below are historical; current scope and specifications are above and in the linked stories.

## 2026-11-16 — Initial setup

Confirmed direction from Miguel: develop the structure directly in this repository before extracting a separate specification. Define named agents, reusable skills, tools/connections and routines including prompts. Definitions must be portable across bot apps and omit agent runtime state.

The private [agents-work repository](https://github.com/miguelalcalde/agents-work) was empty at setup. Its original local issue checkout was `/Users/miguel/src/github/miguelalcalde/agents-work`. Mstack 0.2.0 was copied from clean upstream checkout commit `9996139c1ce817d9d9f67fb18b2ec7d6de0b8276`; all three installed global skill copies matched upstream. No orchestration runtime or model selection is configured.

Observed source split: [agents](https://github.com/miguelalcalde/agents) contains the Eve/Mai runtime; [agent-files-mai](https://github.com/miguelalcalde/agent-files-mai) contains Mai instructions and skills; [skills](https://github.com/miguelalcalde/skills) contains shared work skills. Earlier inspection found uncommitted edits and differences between local and GitHub copies. Re-read before transfer. In particular, the installed local task-management includes an execution-contract reference absent from Mai's inspected copy.

The initial backlog is draft refinement work, not an approved schema. See the canonical [issue files](issues/); do not duplicate their specifications here. Skills and routine assignments should be references rather than copied definitions. Exact file formats, stable-ID policy, team/group representation and app setup mechanism remain open.

## 2026-11-16 — Mission notes and planned handoff

Miguel established [Agent-structure](https://app.notion.com/p/3a5e06b059c48338ae5981adfd0de72c) as the shared workspace for mission and design discussion. The mission includes reusable role preparation: baseline knowledge and skills should already be defined when starting an agent in a new app, avoiding repeated custom onboarding. The project-manager role is Miguel’s motivating example. The shared page holds the maintained mission wording.

The handoff has now occurred in the Agent structure channel: Preston owns product/planning and Skillian supports skills/integrations. The handoff authorizes refinement and coordination; it does not start development execution.

## 2026-11-16 — Product planning review

Reviewed all seven drafts against the maintained mission. Reusable role preparation and baseline knowledge were underrepresented; the existing [layout](issues/1.md), [role/roster](issues/3.md) and downstream drafts now cover them explicitly. Setup preview must expose effective preparation, inaccessible knowledge, updates and destination conflicts; runtime mappings stay outside portable definitions. All seven remain open in refinement.

Initial slice selection (subsequently reopened in discussion): prove the project-manager role and Preston using one maintained knowledge resource and one reconciled shared skill, plus an offline setup preview and a clearly labeled second-agent fixture to demonstrate reuse. Use the existing story records for this scope; the full roster, live reconstruction and routines follow later. Next settle the exact baseline content, composition rule and preview contract before implementation readiness. Selection of this refinement slice does not authorize implementation. No target-app compatibility is established.

## 2026-11-17 — Recovered discussion and focused source reconciliation

Miguel questioned the separate role layer after selecting the initial slice. The latest agreed approach is to walk through Preston concretely before settling structure; the earlier selection is not approval of a role schema or code generation. Devin is available in the channel once setup is aligned.

The source reconciliation investigation was outside the spec. No source repositories or registrations were changed.

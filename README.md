# Agent Files

Describe standalone agents in portable folders, including instructions, memories, skills, tools/integrations and routines. Agent-owned memories travel with the agent; shared resources are referenced, not copied per agent. Teams, credentials, runtime history, harnesses and execution stay out of v0.1.

[Agent Files](https://github.com/mikemajara/agent-files) is the home for the spec, versioned schemas, docs, validator and companion backup skill. This checkout holds the authoritative local planning backlog.

## Current stage

The maintained mission and related-work notes are in [Agent-structure](https://app.notion.com/p/3a5e06b059c48338ae5981adfd0de72c). Existing projects offer related ideas but do not establish the simple descriptive format wanted here. Agent Definition Format is a proposed descriptive name, not an adopted brand. See the [0.1 format](SPEC.md) and the [two-agent example](examples/README.md).

## Validate a package

With Node.js and npm, install the locked dependencies once using `npm ci --ignore-scripts`. Then run `npm run validate -- examples/standalone` or replace that directory with your own package. Validation uses the bundled schemas and works offline once dependencies are installed. Add `--json` for machine-readable results. Exit codes: `0` valid, `1` invalid package, `2` invocation or internal error. Run `npm test` to check the valid example and controlled failure cases.

Read [AGENTS.md](AGENTS.md) and [.mstack/memory.md](.mstack/memory.md). Mstack 0.2.0 under `.agents/skills/` and canonical filesystem stories under `.mstack/issues/` are authoring materials, separate from portable definitions.

## First version

1. [Standalone format and schemas](.mstack/issues/1.md).
2. [Two standalone agents sharing resources](.mstack/issues/3.md).
3. [Offline validation and independent readability](.mstack/issues/6.md).
4. [Backup skill and tamper verification](.mstack/issues/8.md).

## Follow-up backlog

5. [Source inventory and reconciliation](.mstack/issues/2.md).
6. [Tools and integrations](.mstack/issues/4.md).
7. [Routine and collaboration descriptions](.mstack/issues/5.md).
8. [A second-domain example](.mstack/issues/7.md).

See the story records for current delivery status.

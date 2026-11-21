# Community garden example

This fictional package has no live services, credentials or runtime state. Start at the [package configuration](community-garden/config.json), then read either the [plot observer](community-garden/agents/observer/agent.json) or the [garden planner](community-garden/agents/planner/agent.json).

## What the format expresses

Both agents independently select the shared [garden-notes skill](community-garden/skills/garden-notes/SKILL.md) and [plot log](community-garden/tools/plot-log/tool.json). They need read-only observations with plot labels and dates to make a weekly plan. The unassigned [MCP variant](community-garden/tools/plot-log-mcp/tool.json) describes the same capability with optional connection details. Its endpoint is illustrative and must not be contacted; neither agent depends on MCP.

The [weekly routine](community-garden/routines/weekly-plan/routine.json) names its participants, trigger and result. Its [prompt](community-garden/routines/weekly-plan/prompt.md) describes the observer-to-planner handoff, required fields, and what to do if input is missing. It describes work, not a scheduler or standing team. The planner’s example memory remains with that agent.

## What this comparison shows

The same fields and reference rules as the [original example](README.md) describe a different domain without a schema extension. The read-only rule and handoff order are prose, so a consumer can understand them but cannot infer a permission grant or enforced execution order. A missing log is handled in the prompt, not an app-specific runtime field. This example demonstrates no need to add new fields.

From the repository root, check the package with `node bin/agent-files.cjs validate examples/community-garden --json`.

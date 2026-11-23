# Agent Files

## Purpose

- Define **Agent Files**: a lightly opinionated, harness-agnostic common-denominator convention for describing agents so an agent in any platform can capture how it behaves, remembers, and works—and another agent in a different platform can interpret those files into its own native setup.
- Cover six shared concepts across agent platforms: **identity** (name, model, and references), **instructions**, **memories**, **skills**, **tools/integrations**, and **routines** (schedule/trigger and prompt), plus explicit gap reporting for anything a harness hides.
- Treat the agent itself as the adapter. Pair the spec with an agent-facing `SKILL.md` (and optional progressive harness notes under `references/`, such as `openbot.md` or `grok-bot.md`) rather than building deterministic converters, validators, or platform-specific runtime adapters.
- Keep secrets, credentials, chat history, execution logs, and runtime state outside captured agent definitions.

## Development workflow

- Use the version-matched [mstack-workflow](.agents/skills/mstack-workflow/SKILL.md), [mstack-tracker](.agents/skills/mstack-tracker/SKILL.md), and, when explicitly coordinating a run, [mstack-orchestrator](.agents/skills/mstack-orchestrator/SKILL.md).
- Read [.mstack/memory.md](.mstack/memory.md) before project work. Canonical stories live in [GitHub Issues for `mikemajara/agent-files`](https://github.com/mikemajara/agent-files/issues), as configured in [.mstack/config.json](.mstack/config.json).
- Development records under `.mstack/` and development skills under `.agents/` are repository authoring material, separate from the Agent Files spec and skill.
- Do not commit, push, activate routines, or modify external repositories without user authorization.

## Checks

- Validate `.mstack/config.json` and local Markdown links, including heading anchors.
- Verify all three mstack skills under `.agents/skills/` remain present and version-matched at `0.2.0`.
- Prove the spec and skill against a real agent performing an autonomous backup rather than synthetic fixtures alone.

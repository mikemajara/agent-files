# Project continuity

## 2026-11-22 — Clean-slate reset

Reset `main` in [mikemajara/agent-files](https://github.com/mikemajara/agent-files) to remove the earlier deterministic `openbot-backup` converter, Node validator, versioned JSON schemas, and synthetic examples so they do not pollute future context. Closed historical issue records `1.md`–`8.md` are retained under `.mstack/issues/` for mstack numbering continuity and are superseded by [story 9](issues/9.md).

## Current direction

- **Mission:** Define and share agents without platform lock-in. Near term, let any agent capture itself (or a requested set of agents) from its current platform into a repository without being bound to that platform's export format; longer term, enable harness-agnostic publishing of agents.
- **Six common concepts:** Identity (e.g. `agent.json` with name, model, references), standing instructions (e.g. `instructions.md`), memories, skills (`SKILL.md` folders), tools/integrations, and routines (schedule/trigger and prompt), plus explicit gap reporting when a harness hides something.
- **Agent as adapter:** The spec is lightly opinionated and intentionally non-deterministic. An agent in any harness maps its native files to Agent Files on export and maps Agent Files into its native files on import.
- **Skill as agent-facing spec documentation:** Ship one primary `SKILL.md` that documents the format for agents, guides autonomous execution without interactive hand-holding, forbids committing secrets, cautions about personal memories in public repositories, requires explicit gap reporting, and grows progressive per-harness lookup hints under `references/` (such as `openbot.md`, `grok-bot.md`, and CLI skill locations). Re-run cadence and update style are left to the user.
- **First critical test:** Point a real agent (in OpenBot, GrokBot, or a CLI harness) at the skill and ask it to back itself up (or several requested agents) into a repo. Judge whether the output faithfully captures how the agent behaves, remembers, and works, with zero secrets and explicit gaps for anything inaccessible.

## Active backlog

- [`.mstack/issues/9.md`](issues/9.md) — Define the Agent Files spec and autonomous agent skill.

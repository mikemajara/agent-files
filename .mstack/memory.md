# Project continuity

## 2026-11-22 — Clean-slate reset

Reset `main` in [mikemajara/agent-files](https://github.com/mikemajara/agent-files) to remove the earlier deterministic `openbot-backup` converter, Node validator, versioned JSON schemas, and synthetic examples so they do not pollute future context. Closed historical issue records `1.md`–`8.md` are retained under `.mstack/issues/` for mstack numbering continuity and are superseded by [story 9](issues/9.md).

## Current direction

- **Mission:** Define and share agents without platform lock-in. Near term, let any agent capture itself (or a requested set of agents) from its current platform into a repository without being bound to that platform's export format; longer term, enable harness-agnostic publishing of agents.
- **Six common concepts:** Identity (e.g. `agent.json` with name, model, references), standing instructions (e.g. `instructions.md`), memories, skills (`SKILL.md` folders), tools/integrations, and routines (schedule/trigger and prompt), plus explicit gap reporting when a harness hides something.
- **Agent as adapter:** The spec is lightly opinionated and intentionally non-deterministic. An agent in any harness maps its native files to Agent Files on export and maps Agent Files into its native files on import.
- **Skill as agent-facing spec documentation:** Ship one primary `SKILL.md` that documents the format for agents, guides autonomous execution without interactive hand-holding, forbids committing secrets, cautions about personal memories in public repositories, requires explicit gap reporting, and grows progressive per-harness lookup hints under `references/` (such as `openbot.md`, `grok-bot.md`, and CLI skill locations). Re-run cadence and update style are left to the user.
- **First critical test:** Point a real agent (in OpenBot, GrokBot, or a CLI harness) at the skill and ask it to back itself up (or several requested agents) into a repo. Judge whether the output faithfully captures how the agent behaves, remembers, and works, with zero secrets and explicit gaps for anything inaccessible.

## 2026-11-22 — Story 9 delivered (spec + autonomous agent skill)

Delivered [story 9](issues/9.md) via [PR #8](https://github.com/mikemajara/agent-files/pull/8) (merged at [`9e6bc1f`](https://github.com/mikemajara/agent-files/commit/9e6bc1fbfefd39d3a515417712922b6fbea71704) after [independent QA passed](https://github.com/mikemajara/agent-files/pull/8#issuecomment-7086243861)):

- Shipped [`SPEC.md`](../SPEC.md), [`README.md`](../README.md), [`skills/agent-files/SKILL.md`](../skills/agent-files/SKILL.md), and initial progressive lookup references under `skills/agent-files/references/` (`openbot.md`, `cli.md`).
- Established a three-state convention for instructions, memories, skills, tools, and routines: **populated** (file + reference), **verified empty** (file + reference with `None (verified empty).` or `"skills": []`), and **unavailable or excluded** (omitted + `gaps.md` entry), so unexplained omissions are never mistaken for empty configurations.
- Proven against a real OpenBot agent (Penny) autonomously backing herself up from a single prompt (memories excluded and recorded in `gaps.md`, routines explicitly verified empty, zero secrets) and independently interpreted across harnesses by Quentinn.
- Standing delivery rule from Miguel: merge PRs and close delivered stories automatically once strict independent QA passes on the tested commit without pausing for manual PR review.

## Active backlog

No open stories. Next candidate work: real-agent capture/recreation trials in another harness (such as GrokBot or a CLI harness) and additional `references/<harness>.md` lookup notes.

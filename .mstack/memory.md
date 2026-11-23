# Project continuity

## 2026-11-22 — Clean-slate reset

Reset `main` in [mikemajara/agent-files](https://github.com/mikemajara/agent-files) to remove the earlier deterministic `openbot-backup` converter, Node validator, versioned JSON schemas, and synthetic examples so they do not pollute future context.

## Current direction

- **Mission:** Define and share agents without platform lock-in. Near term, let any agent capture itself (or a requested set of agents) from its current platform into a repository without being bound to that platform's export format; longer term, enable harness-agnostic publishing of agents.
- **Six common concepts:** Identity (e.g. `agent.json` with name, model, references), standing instructions (e.g. `instructions.md`), memories, skills (`SKILL.md` folders), tools/integrations, and routines (schedule/trigger and prompt), plus explicit gap reporting when a harness hides something.
- **Agent as adapter:** The spec is lightly opinionated and intentionally non-deterministic. An agent in any harness maps its native files to Agent Files on export and maps Agent Files into its native files on import.
- **Skill as agent-facing spec documentation:** Ship one primary `SKILL.md` that documents the format for agents, guides autonomous execution without interactive hand-holding, forbids committing secrets, cautions about personal memories in public repositories, requires explicit gap reporting, and grows progressive per-harness lookup hints under `references/` (such as `openbot.md`, `grok-bot.md`, and CLI skill locations). Re-run cadence and update style are left to the user.
- **First critical test:** Point a real agent (in OpenBot, GrokBot, or a CLI harness) at the skill and ask it to back itself up (or several requested agents) into a repo. Judge whether the output faithfully captures how the agent behaves, remembers, and works, with zero secrets and explicit gaps for anything inaccessible.

## 2026-11-22 — Story 9 delivered (spec + autonomous agent skill)

Delivered story 9 via [PR #8](https://github.com/mikemajara/agent-files/pull/8) (merged at [`9e6bc1f`](https://github.com/mikemajara/agent-files/commit/9e6bc1fbfefd39d3a515417712922b6fbea71704) after [independent QA passed](https://github.com/mikemajara/agent-files/pull/8#issuecomment-7086243861)):

- Shipped [`SPEC.md`](../SPEC.md), [`README.md`](../README.md), [`skills/agent-files/SKILL.md`](../skills/agent-files/SKILL.md), and initial progressive lookup references under `skills/agent-files/references/` (`openbot.md`, `cli.md`).
- Established a three-state convention for instructions, memories, skills, tools, and routines: **populated** (file + reference), **verified empty** (file + reference with `None (verified empty).` or `"skills": []`), and **unavailable or excluded** (omitted + `gaps.md` entry), so unexplained omissions are never mistaken for empty configurations.
- Proven against a real OpenBot agent (Penny) autonomously backing herself up from a single prompt (memories excluded and recorded in `gaps.md`, routines explicitly verified empty, zero secrets) and independently interpreted across harnesses by Quentinn.
- Standing delivery rule from Miguel: merge PRs and close delivered stories automatically once strict independent QA passes on the tested commit without pausing for manual PR review.

## 2026-11-23 — Story 10 delivered (opt-in global skills + spec-repo guardrail)

Delivered story 10 via [PR #9](https://github.com/mikemajara/agent-files/pull/9) (merged at [`72c6781`](https://github.com/mikemajara/agent-files/commit/72c678173705209b6916090ec9d6b517ceb4a88d) after [independent QA passed](https://github.com/mikemajara/agent-files/pull/9#issuecomment-7093567592)):

- Scoped default skill capture in [`skills/agent-files/SKILL.md`](../skills/agent-files/SKILL.md), [`references/cli.md`](../skills/agent-files/references/cli.md), and [`references/openbot.md`](../skills/agent-files/references/openbot.md) to agent-assigned or agent/project-scoped skills; machine-wide/user-global skill libraries are opt-in only when explicitly requested and otherwise recorded in `gaps.md`.
- Added core-first bulk-capture ordering (so large skill libraries never starve core agent definitions) and an explicit guardrail in [`SKILL.md`](../skills/agent-files/SKILL.md) and [`README.md`](../README.md) forbidding writing backups inside the `agent-files` spec repository itself.
- Proven on a cold-start Claude Code CLI run completing autonomously in ~20 seconds with zero secrets and an untouched spec repo.

## 2026-11-23 — Tracker moved to GitHub Issues

[mstack configuration](config.json) now selects [GitHub Issues](https://github.com/mikemajara/agent-files/issues) as the canonical tracker. The `.mstack/issues/` directory was removed; closed filesystem records remain in Git history.

## Active backlog

- [#11 — Structured formats, external skill references, and validation](https://github.com/mikemajara/agent-files/issues/11) (refinement).
- [#12 — Recurring backup logs and environment/Vault metadata](https://github.com/mikemajara/agent-files/issues/12) (refinement).

# Agent Files

**Define and share agents without platform lock-in.**

Agent Files is a lightweight convention for describing an agent's identity, instructions, memories, skills, tools and integrations, and routines. The agent does the translation: it reads what its current platform exposes, records what it couldn't capture, and writes files another agent can interpret on a different platform. See the [specification](SPEC.md).

## What a backup looks like

```text
agents/<agent-id>/
  agent.json       # identity and references
  instructions.md  # standing guidance
  memories.md      # kept separate so it can be excluded
  tools.md         # capabilities and integrations
  routines.md      # triggers, participants, and prompts
  gaps.md          # what wasn't captured and why
skills/<skill-name>/SKILL.md  # shared across agents
```

Use one directory under `agents/` per agent. Keep reusable skills in `skills/` and reference them from `agent.json`. Mark verified-empty concepts explicitly and log unavailable or excluded concepts in `gaps.md`.

## Use the skill

Point your agent at [`skills/agent-files/SKILL.md`](skills/agent-files/SKILL.md) and tell it what to capture or where to recreate an agent.

**Never write backups inside the `agent-files` repository.** It holds the spec and skill, not backups. Use a separate local folder outside this repository or a separate backup repository.

**Back up:** “Read the Agent Files skill and save your backup to a new local folder outside the `agent-files` checkout. Leave out memories and record anything you couldn't capture.”

**Recreate:** “Read the Agent Files skill and recreate the agent from my backup folder on this platform. Report what doesn't map and leave routines inactive.”

Never include secrets or runtime data. Review the backup and keep personal memories out before publishing.

## Current work

- Active story: [Story 10 — Skill scope and backup guardrails](.mstack/issues/10.md)
- Project continuity: [`.mstack/memory.md`](.mstack/memory.md)
- Repository rules: [`AGENTS.md`](AGENTS.md)

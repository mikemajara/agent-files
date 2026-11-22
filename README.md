# Agent Files

**Define and share agents without platform lock-in.**

Agent Files is a lightweight convention for describing an agent's identity, instructions, memories, skills, tools and integrations, and routines. The agent does the translation: it reads what its current platform exposes, records what it couldn't capture, and writes files another agent can interpret on a different platform. See the [specification](SPEC.md).

## What a backup looks like

```text
agents/<agent-id>/
  agent.json       # identity and references
  instructions.md  # standing guidance
  memories.md      # optional; separate for private sharing decisions
  tools.md         # capabilities and integrations
  routines.md      # triggers, participants, and prompts
  gaps.md          # what wasn't captured and why
skills/<skill-name>/SKILL.md  # shared across agents
```

Use one directory under `agents/` per agent. Keep reusable skills in `skills/` and reference them from `agent.json`.

## Use the skill

Point your agent at [`skills/agent-files/SKILL.md`](skills/agent-files/SKILL.md) in this repository and tell it what to capture or where to recreate an agent. For example:

**Back up:** “Read `skills/agent-files/SKILL.md` and save your Agent Files to `./my-agent-backup/`. Leave out memories and record anything you couldn't capture.”

**Recreate:** “Read `skills/agent-files/SKILL.md` and recreate the agent from `./my-agent-backup/` in this platform. Report what doesn't map and leave routines inactive.”

Never include secrets or runtime data. Review the backup and keep personal memories out before publishing.

## Current work

- Active specification story: [`.mstack/issues/9.md`](.mstack/issues/9.md)
- Project continuity: [`.mstack/memory.md`](.mstack/memory.md)
- Repository rules: [`AGENTS.md`](AGENTS.md)

# Agent Files

**Define and share agents without platform lock-in.**

Agent Files is a lightweight convention for describing an agent's identity, instructions, memories, skills, tools and integrations, and routines. The agent using this spec, does the translation adjusting to its harness: it reads what its current platform exposes, records what it couldn't capture, and writes files another agent can interpret on a different platform. See the [specification](SPEC.md).

## What a backup looks like

```text
agents/<agent-id>/
  agent.json       # identity and references
  instructions.md  # standing guidance
  memories.md      # durable memories in their own file so private context is easy to leave out when sharing
  tools.md         # capabilities and integrations
  routines.md      # triggers, participants, and prompts
  gaps.md          # what wasn't captured and why
skills/<skill-name>/SKILL.md  # shared across agents
```

<!-- COMMENT: "does tools have to be an md file, or can we think of a deterministic json structure that helps capture links, sources, and so on?" the same applies to skills, what if this particular agent is using some skills? and are we validating that the skills are present in the repo or have a valid link to gh or similar?" Same applies to routines, and could potentially apply to memories.md -->
<!-- PRESTON: Tracked in https://github.com/mikemajara/agent-files/issues/11 to decide lightweight JSON vs Markdown for tools/skills/routines/memories and external skill links/validation while keeping the spec lightweight. -->

Use one directory under `agents/` per agent. Keep reusable skills in `skills/` and reference them from `agent.json`. Mark verified-empty concepts explicitly and log unavailable or excluded concepts in `gaps.md`.

## Use the skill

Point your agent at [`skills/agent-files/SKILL.md`](skills/agent-files/SKILL.md) and tell it what to capture or where to recreate an agent.

Choose a separate local folder or backup repository, or leave the destination open and let the agent choose a clean folder outside this repository and suggest a private backup repository if useful.

### Back up one or more agents

Back up the current agent or name others to include, and choose a local folder or private GitHub repository.

```text
Use the Agent Files skill to back up yourself and agents X and Y to my private GitHub repository at https://github.com/owner/agents. Leave out memories and record anything you couldn't capture.
```

### Maintain a recurring backup and log

Ask an agent with scheduling and repository access to keep backups up to date.

```text
Use the Agent Files skill to set up a weekly backup of agents X, Y, and Z to my private repository at https://github.com/owner/agents. Update the backups with the latest changes and append each backup's date and a short summary of changes to BACKUP-LOG.md in that repository.
```

### Recreate an agent on another platform

Give the agent on the destination platform the path or URL of your backup.

```text
Use the Agent Files skill to recreate agent X from https://github.com/owner/agents using this platform's native setup. Report anything that doesn't map and leave routines inactive.
```

- Never include secrets or runtime data.
- Warn if repo is public before exporting any personal data that should be private like memories or facts.
- Do not export vault data like environment variable keys unless explicitly asked for.

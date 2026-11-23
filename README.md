# Agent Files

**Define and share agents without platform lock-in.**

Agent Files is a lightweight convention for describing an agent's identity, instructions, memories, skills, tools and integrations, and routines. The agent using this spec, does the translation adjusting to its harness: it reads what its current platform exposes, records what it couldn't capture, and writes files another agent can interpret on a different platform. See the [specification](SPEC.md).

## What a backup looks like

```text
agents/<agent-id>/
  agent.json       # identity and references
  instructions.md  # standing guidance
  memories.md      # kept separate so it can be excluded <!-- COMMENT: what does "separate so it can be excluded" mean? -->
  tools.md         # capabilities and integrations <!-- COMMENT: "does tools have to be an md file, or can we think of a deterministic json structure that helps capture links, sources, and so on?" the same applies to skills, what if this particular agent is using some skills? and are we validating that the skills are present in the repo or have a valid link to gh or similar?" Same applies to routines, and could potentially apply to memories.md -->
  routines.md      # triggers, participants, and prompts
  gaps.md          # what wasn't captured and why
skills/<skill-name>/SKILL.md  # shared across agents
```

Use one directory under `agents/` per agent. Keep reusable skills in `skills/` and reference them from `agent.json`. Mark verified-empty concepts explicitly and log unavailable or excluded concepts in `gaps.md`.

## Use the skill

Point your agent at [`skills/agent-files/SKILL.md`](skills/agent-files/SKILL.md) and tell it what to capture or where to recreate an agent.

**Never write backups inside the `agent-files` repository.** It holds the spec and skill, not backups. Use a separate local folder outside this repository or a separate backup repository.

<!-- COMMENT: This line above was specified cos i'm testing in the same account as the skill and agent-files repo are, there shouldn't beb further confusion when anyone else uses it. so maybe we don't need to be that explicit. or we can be prescriptive about the agent having to decide where to capture the agents -->

**Back up:** “Read the Agent Files skill and save your backup to a new local folder outside the `agent-files` checkout. Leave out memories and record anything you couldn't capture.”

**Recreate:** “Read the Agent Files skill and recreate the agent from my backup folder on this platform. Report what doesn't map and leave routines inactive.”

<!-- COMMENT: for Back up and Recreate lines above, we don't have to be so prescriptive and uninformative, we can explain diff use cases and place them in a codeblock that allows users to quickly copy andn paste to their agents. Example 1: back yourself up and X many agents (you elaborate). Example 2: "Keep a running back up routine of agents X, Y and Z in repo github.com/owner/agents, and set up a routine that updates this reporegularly with the latest changes. add a afile to the repo in log format that logs every back up with the changes and latest date to inform about the procedure." -->

- Never include secrets or runtime data.
- Warn if repo is public before exporting any personal data that should be private like memories or facts.
- Do not export vault data like environment variable keys unless explicitly asked for.

# Agent Files

**Define and share agents without platform lock-in.**

Agent Files is a lightly opinionated, harness-agnostic convention for the six concepts every agent platform shares—identity, instructions, memories, skills, tools/integrations, and routines—paired with a reusable agent skill (`SKILL.md`) that teaches any agent how to read and write the format.

It is not a deterministic converter or runtime protocol. The agent itself acts as the adapter: an agent in OpenBot, GrokBot, or a CLI harness reads the skill to back itself up (or a set of agents) into a repository, records explicit gaps for anything its harness hides, and lets another agent in a different harness map those files into its own native structure.

## Current work

- Active specification story: [`.mstack/issues/9.md`](.mstack/issues/9.md)
- Project continuity: [`.mstack/memory.md`](.mstack/memory.md)
- Repository rules: [`AGENTS.md`](AGENTS.md)

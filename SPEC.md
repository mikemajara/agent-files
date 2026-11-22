# Agent Files specification

Agent Files is a file convention for defining and sharing agents without platform lock-in. A harness is the platform that runs an agent. The agent is the adapter: it maps what it can read in the source harness into Agent Files, then an agent in the target harness interprets those files into its own native setup. The files describe the intended behavior; they do not install integrations or activate routines.

## Layout

Use the same layout for one agent or several. Give each agent a directory under `agents/` and store reusable skills once under the root `skills/` directory. Paths in metadata are relative to the Agent Files root and point inside it, so the bundle can move as a unit.

```text
<root>/
  agents/
    <agent-id>/
      agent.json
      instructions.md
      memories.md        # optional; keep separate for private sharing decisions
      tools.md
      routines.md
      gaps.md
  skills/
    <skill-name>/
      SKILL.md
```

The Markdown files are readable descriptions, not runtime configuration. Omit supporting files that are empty, out of scope, or unavailable, and omit their references. Record unavailable or knowingly omitted material in `gaps.md` so absence is not mistaken for an empty configuration.

## Six shared concepts

| Concept | Convention |
| --- | --- |
| Identity | `agent.json` records `id` (stable and unique within the bundle, matching the directory name), `name`, and, when known, `description` (what the agent does) and `model` (the configured name or identifier). Use `instructions`, `memories`, `tools`, `routines`, and `gaps` for paths to the corresponding files, and `skills` for a list of shared skill directory paths, such as `skills/research`. |
| Standing instructions | `instructions.md` preserves durable guidance that shapes behavior across sessions. Do not include one-off prompts or conversation transcripts. |
| Memories | `memories.md` holds permitted durable memories, not the conversations they came from. Keep memories out of the other files. Before sharing publicly, review the bundle for personal information, remove `memories.md` by default, and drop its reference from `agent.json`. |
| Skills | Each `skills/<skill-name>/` contains `SKILL.md` and any portable supporting files it needs. Reference that directory from each agent that uses the skill rather than copying it per agent. |
| Tools and integrations | `tools.md` names capabilities, MCP servers, and external services the agent relies on and explains what it uses them for. Describe the dependency, not endpoints with secrets, auth configuration, launch commands, or other runtime wiring. |
| Routines | `routines.md` describes each routine by name, schedule or trigger (for example, a cron expression with its timezone), participants (use bundle agent IDs where available), and prompt. Preserve intent without scheduler job IDs, run history, or scheduler wiring. |

## Gaps

Use one entry per gap in the affected agent's `gaps.md`: **concept or item — what is missing — why**. For example: `Skills — calendar skill body — source exposes its name but not its contents`. Record hidden model settings, inaccessible private memories, or user-requested omissions without disclosing the missing content. Distinguish material you couldn't inspect from a concept you verified was empty. Do not guess or silently drop a gap; when recreating an agent, report any target limitation or substitution rather than claiming an exact match.

## Never include

Do not put secrets, credentials, tokens, chat history, execution logs, or runtime state anywhere in Agent Files, including skill attachments and gap notes. A target harness supplies its own authorized access and runtime configuration.

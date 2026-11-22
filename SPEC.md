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
      memories.md        # kept separate so it can be excluded
      tools.md
      routines.md
      gaps.md
  skills/
    <skill-name>/
      SKILL.md
```

The Markdown files are readable descriptions, not runtime configuration. For instructions, memories, skills, tools, and routines, record one of three states:

| State | How to record it |
| --- | --- |
| Populated | Write the concept's file and reference it in `agent.json`. For skills, use a non-empty `skills` list referencing the shared skill folders. |
| Verified empty | Keep the file and its reference in `agent.json`. Write a brief note such as `None (verified empty).` For skills, use `"skills": []`. |
| Unavailable or excluded | Omit the file and its reference, or omit the `skills` key. Record the omission in `gaps.md`. |

A missing file or `skills` key without a matching gap is an unverified omission. Do not interpret it as empty.

## Six shared concepts

| Concept | Convention |
| --- | --- |
| Identity | `agent.json` records `id` (stable and unique within the bundle, matching the directory name), `name`, and, when known, `description` (what the agent does) and `model` (the configured name or identifier). Use `instructions`, `memories`, `tools`, `routines`, and `gaps` for paths to the corresponding files, and `skills` for a list of shared skill directory paths, such as `skills/research`. |
| Standing instructions | `instructions.md` preserves durable guidance that shapes behavior across sessions. Do not include one-off prompts or conversation transcripts. |
| Memories | `memories.md` holds permitted durable memories, not the conversations they came from. Keep memories out of the other files. Before sharing publicly, review the bundle for personal information. By default, remove `memories.md`, drop its reference from `agent.json`, and record the exclusion in `gaps.md` without revealing memory content. |
| Skills | Each `skills/<skill-name>/` contains `SKILL.md` and any portable supporting files it needs. Reference that directory from each agent that uses the skill rather than copying it per agent. |
| Tools and integrations | `tools.md` names capabilities, MCP servers, and external services the agent relies on and explains what it uses them for. Describe the dependency, not endpoints with secrets, auth configuration, launch commands, or other runtime wiring. |
| Routines | `routines.md` describes each routine by name, schedule or trigger (for example, a cron expression with its timezone), participants (use bundle agent IDs where available), and prompt. Preserve intent without scheduler job IDs, run history, or scheduler wiring. |

## Gaps

Use one entry per gap in the affected agent's `gaps.md`: **concept or item — what is missing — why**. For example: `Skills — calendar skill body — source exposes its name but not its contents`. Keep any available, in-scope content and log the missing parts without disclosing them. Reference `gaps.md` from the `gaps` key in `agent.json`; omit both only when there are no gaps or exclusions. Verified-empty concepts are not gaps. When recreating an agent, report any target limitation or substitution rather than claiming an exact match.

## Never include

Do not put secrets, credentials, tokens, chat history, execution logs, or runtime state anywhere in Agent Files, including skill attachments and gap notes. A target harness supplies its own authorized access and runtime configuration.

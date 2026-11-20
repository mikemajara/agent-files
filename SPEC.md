# Agent Files format 0.1

Start at the package’s `config.json`. Its `formatVersion` selects the corresponding schema set from the specification repository; for `"0.1"`, use [`schemas/0.1/`](schemas/0.1/). Agent packages do not include schemas. Reject unsupported versions rather than guessing.

## Layout

```text
config.json
agents/<id>/agent.json
agents/<id>/instructions.md
agents/<id>/memory.json       # optional
skills/<id>/SKILL.md
tools/<id>/tool.json
routines/<id>/routine.json
routines/<id>/prompt.md
```

Only roots with content need to exist. Skill folders can include supporting files, such as `references/`; tool folders can include setup notes, configuration and code. Follow an agent’s `agent.json` to its standing instructions, optional memories, and selected resources. A memory file is an array of nonempty strings; use the same representation for supplied and learned memories.

An integration is described as a tool. A tool may carry a `config` object without secrets, a `source` reference to an external tool, or bundled files. MCP is optional. Routine definitions name the intended trigger (with a timezone if scheduled), participants, result and prompt; they do not activate routines.

## References and validation

IDs use lowercase ASCII letters and digits in segments separated by single hyphens. Structured resource IDs match their folder names; skill IDs are their folder names. IDs are unique within a resource kind. Fields such as `skills`, `tools`, `routines`, and `participants` resolve IDs within the corresponding root. Omitted resource lists select nothing; an unassigned resource is valid. Display names do not affect references. Local file references stay inside the package and do not traverse symlinks.

Use the matching schemas for fields, types and fixed values, and separate package checks for files, IDs and reference targets. Validation is offline and never executes bundled code or follows external sources. These files express intended use, not permission grants or runtime guarantees. Teams, credentials, chat transcripts, run history, indexes and harness configuration are outside the format.

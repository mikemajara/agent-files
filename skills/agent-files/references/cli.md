# CLI coding harness lookup hints

For Claude Code, Codex, pi, or another CLI harness, start with its active profile and the project and user scopes it actually loads. Paths vary by harness and installation; these are candidates, not a search list for every machine.

| Concept | Where to look |
| --- | --- |
| Identity | Check the selected agent definition, profile, or exposed model setting. Capture the configured name, role, and model when known, not a transient session override or provider account. |
| Instructions | Check project `AGENTS.md` or `CLAUDE.md` and the applicable user-level equivalent, such as `~/.codex/AGENTS.md` or `~/.claude/CLAUDE.md`. Capture durable instructions that apply to the requested agent; preserve scope and precedence where they affect behavior. |
| Skills | Start with explicitly assigned skills and project/workspace sources such as `.agents/skills/` or `.claude/skills/`. Auto-discovery alone is not assignment. Audit or copy user-global or machine-wide libraries such as `~/.agents/skills/`, `~/.claude/skills/`, or `~/.codex/skills/` only when explicitly requested. Otherwise log their unbundled scope in `gaps.md`, with a count only if already available. If names collide, follow the active definition within the allowed scope. |
| Tools and integrations | Prefer exposed tool and MCP metadata. Otherwise check the applicable declarations, such as project `.mcp.json` or `~/.codex/config.toml`. Extract capability, server, or service names and purpose only, never environment variables, tokens, auth headers, launch commands, or raw configuration. |
| Memories | Look for an explicit durable memory store or memory notes the harness exposes. Do not treat session transcripts, caches, or generated history summaries as durable memories. |
| Routines | Look for authorized, agent-owned schedule or event-trigger definitions in the harness or its connected scheduler. Read definitions only; capture intent, not execution state or scheduler wiring. |

Log gaps when provider defaults hide the model, a plugin exposes a skill or tool name without its definition, or the harness does not expose a memory store or schedules. If you verified a concept is empty, keep that distinct from an unavailable lookup.

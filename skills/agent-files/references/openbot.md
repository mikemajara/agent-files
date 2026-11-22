# OpenBot lookup hints

Use only the setup and read-only tools OpenBot exposes to you for the requested agent. Read the relevant entries below; do not export whole tool responses.

| Concept | Where to look |
| --- | --- |
| Identity | Use the supplied agent profile or `openbot.read_agent` (omit `agentId` for yourself). Take only the name, role or description, and exposed configured model. Keep account and browser profile details out. |
| Instructions | Look in the agent's workspace Instructions, `<workspace>/AGENTS.md`, and any user-level `AGENTS.md` or `CLAUDE.md` that applies to the agent. Capture user-authored standing guidance, not injected platform instructions or task-specific context. |
| Memories | If in scope, use `openbot.list_memories` for your own durable entries; follow `nextCursor` until done. `openbot.search_memories` helps locate specific entries, not establish a complete inventory. Do not mine chat history or assume access to another agent's private memories. |
| Skills | Start with the requested agent's installed or available skills, as exposed by its setup or current skill inventory. Use `openbot.list_local_skills` and `openbot.read_local_skill` for library entries; look for readable sources under `<workspace>/.agents/skills/` or `~/.agents/skills/` when applicable. The shared library is not itself the agent's inventory. |
| Tools and integrations | Use the agent's exposed tool list and the MCP assignments in `openbot.read_agent`. `openbot.list_mcp_servers` can help distinguish servers available to you from the server-wide list. Capture names and purpose only, not addresses, commands, auth configuration, or Vault entries. |
| Routines | Use `openbot.list_routines` for scheduled and event-triggered definitions and `openbot.list_routine_flows` if needed to identify participants. Preserve the named trigger or schedule, timezone where applicable, participants, and prompt when exposed. Never copy webhook URLs, scheduler wiring, job IDs, or run history. |

Log gaps for platform instructions you cannot inspect, opaque model settings, skills whose bodies or assets are not exposed, or another agent's private memories or tools. A visible profile or skill name does not prove you can read the underlying definition.

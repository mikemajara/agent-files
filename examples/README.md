# Standalone agents

This synthetic example uses no accounts or credentials. Start with [the package configuration](standalone/config.json), then open either [the coordinator](standalone/agents/coordinator/agent.json) or [the researcher](standalone/agents/researcher/agent.json). Follow the IDs into the shared skill, tool and routine folders. Both agents can be read on their own. The `notes` skill is intentionally unassigned. The review describes participation for that routine only; no scheduler or tool is activated.

The [search tool folder](standalone/tools/search/) has a `tool.json` that describes the capability. A tool can also keep non-secret configuration in `tool.json`, bundle executable files alongside it, or name an external tool in `source` and include setup notes. This example does not require or run any of those options.

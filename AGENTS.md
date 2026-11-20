# Agent Files

## Purpose

- Describe standalone agents through the minimum common concepts: instructions, memory, skills, tools/integrations and routines. Keep teams and groups out of v0.1.
- Keep the core independent of applications and domains. Harnesses, sandboxes, installation, runtime adapters and software-factory workflows are outside this specification; humans and agents interpret definitions using their own systems.
- Give agents stable identities and explicit resource references. Keep shared skills and per-tool packages independent of assignment. MCP is optional; describe intended behavior without claiming enforcement.
- Keep routine definitions and their prompts together, separate from agents' standing instructions. Allow references to participating agents and skills.
- Include portable agent-owned memories; keep conversations, execution history, credentials and app-generated instance IDs outside the portable definition package.
- Preserve the existing Mai runtime and source repositories; reconcile local edits before transferring definitions.

## Development workflow

- Use the version-matched [mstack-workflow](.agents/skills/mstack-workflow/SKILL.md), [mstack-tracker](.agents/skills/mstack-tracker/SKILL.md) and, when explicitly coordinating a run, [mstack-orchestrator](.agents/skills/mstack-orchestrator/SKILL.md).
- Read `.mstack/memory.md` before project work. Current story specifications live in `.mstack/issues/`; `.mstack/config.json` selects filesystem tracking.
- This `agent-files` checkout is the authoritative local issue store. Keep the former `agents-work` checkout as a read-only planning snapshot. Serialize issue writes and use short-lived per-file locks. Do not allocate issues concurrently across checkouts.
- Initial stories are drafts in refinement. Resolve their open decisions before declaring them ready for implementation; do not treat their labels as evidence of readiness.
- Development records under `.mstack/` and development skills under `.agents/` are repository authoring material, separate from the portable agent definitions.
- Do not commit, push, activate routines or modify source repositories without the applicable user authorization.

## Checks

- Parse shared JSON configuration and issue frontmatter; verify required issue fields, unique numbers, workflow labels and local links.
- Verify all three mstack skills remain present, version-matched and linked correctly after an upgrade.
- Definition readability and consistency checks will be established by the relevant stories. Do not require runtime or installation support to judge the descriptive format.

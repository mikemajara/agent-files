# Backlog Memory

## Decisions

- **JSON-first file state** (2026-08-12, Part A done 2026-08-13): Default starter durable state is JSON (+ markdown docs) on Blob/R2/local — not DuckDB+CSV. Goal is a lightning-fast household/personal agent app, not a SQL warehouse. Shared plan with recetas: `.backlog/plans/PLAN-json-file-state.md`. DuckDB was **removed from the default** (not an optional flag). SQL-over-files can be an advanced recipe later if needed; issue #3 superseded.
- Seed demo entity: `workspace/notes.json` with domain tools `list_notes` / `get_note` / `add_note` / `update_note`.

## Blockers

## Project Conventions

- Storage adapters: Vercel Blob / R2 / local `./data` via `getStorage()`.
- JSON helpers: `src/lib/json-store.ts` (`readJsonFile` / `writeJsonFile` / `updateJsonFile`).
- Agent tools should be domain-specific (`list_*` / `get_*` / `add_*` / `update_*`), not generic `run_sql`.
- Provision smoke: `GET /api/notes` + `/eve/v1/health` (not `/api/schema`).

## Gotchas

- Concurrent writes: last-write-wins on full JSON rewrite; in-process lock only.
- `create-agent-files` clones GitHub `main` — push template changes before scaffolding; bump CLI version when republishing npm metadata.

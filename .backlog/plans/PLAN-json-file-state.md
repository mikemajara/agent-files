---
slug: json-file-state
status: done
issue:
prd:
created_at: 2026-08-12T00:36:00+02:00
shared_with:
  - mikemajara/agent-files
  - mikemajara/recetas
notes: Part B (recetas) done 2026-08-12. Part A (agent-files) done 2026-08-13.---

# Plan: JSON-first file state (drop DuckDB/CSV default)

## Summary

Treat **object storage + JSON (and markdown) files** as the default database for small agentic apps (1–5 people, household / personal tools). Drop DuckDB + CSV from the **default** starter path. Keep typed TypeScript query helpers instead of shipping SQL.

This plan is shared by **agent-files** (starter) and **recetas** (first real app). Bolsa may keep CSV+DuckDB as a specialized ledger demo — out of scope unless explicitly pulled in.

## Decision (locked)

| Choice | Verdict |
| --- | --- |
| Default durable state | Files on cheap object storage (Vercel Blob / R2) + local `./data` fallback |
| Default document shape | **JSON** for structured mutable state; **markdown** for prose docs (recipes, notes) |
| DuckDB + CSV in starter | **Remove from default** — not “optional toggle” (options bloat the starter) |
| SQL in the companion | Drop from default tools; use domain tools (`list_*`, `get_*`, `update_*`) |
| Neon / Supabase / Turso | Wrong weight for ad-hoc 1–5 person apps; avoid as default |
| When DuckDB *would* make sense | Few+ MB of tabular rows, real need for ad-hoc SQL / analytics — advanced recipe later, not starter |

**Thesis:** DuckDB+CSV was a compromise (“SQL without a DB server”). For kitchen/household scale, JSON + small query modules is simpler and as efficient. Efficiency at this volume is a non-issue; complexity is the cost.

## What “low volume” means here

Safe full-file read/mutate/write for years:

- Meal plans: ~730 slots/year → still KB–low hundreds of KB
- Shopping lists: weekly churn, tiny
- Settings / planning notes: one JSON object
- Recipes: dozens–low hundreds of markdown files (already fine)

Partition later (`meal-plan/2026.json`, `homes/{id}/…`) if needed — not day one for a single home.

## Target architecture

```text
storage (Blob | R2 | local)
  {prefix}/          # e.g. notes/, recetas/, or homes/{homeId}/
    *.json           # mutable structured state
    *.md             # documents (optional)
```

App code:

- `getStorage()` — readText / writeText / listKeys (already in agent-files / bolsa / recetas patterns)
- Domain modules (e.g. `lib/queries.ts`, `lib/notes.ts`) — parse JSON, mutate, write back
- Agent tools call those modules — **no** `run_sql` / catalog / `/api/query` in the default starter

Tenancy foreshadow (recetas research follows this):

```text
homes/{homeId}/state/shopping.json
homes/{homeId}/state/meal-plan.json
homes/{homeId}/state/settings.json
homes/{homeId}/md/{slug}.md
```

v1 single-home can use a fixed prefix; multi-user research maps identity → homeId → prefix.

---

## Part A — agent-files (starter)

Owner: agent working in `mikemajara/agent-files`.

### Tasks

- [x] **A1. Reframe product docs** — README / AGENTS: “object storage as DB” = JSON (+ md), not CSV+DuckDB. Starter is lightning-fast for household apps, not a SQL warehouse.
- [x] **A2. Replace notes (or seed) persistence** — store as JSON (or keep md notes if that’s the demo); remove DuckDB materialization from the hot path.
- [x] **A3. Remove default DuckDB surface** — drop `duckdb` dependency, `src/lib/duck.ts`, `/api/query`, catalog SQL autocomplete wiring, agent tools `run_sql` / `list_tables` / `describe_table` from default template.
- [x] **A4. Replace with domain agent tools** — e.g. `list_notes`, `get_note`, `add_note`, `update_note` (match whatever seed app remains).
- [x] **A5. Simplify `create-agent-files` scaffold** — generated app should `npm install && npm run dev` without native addon / webpack-only duckdb constraints if possible.
- [x] **A6. Supersede “Make DuckDB optional” (#3)** — closing note: removed from default rather than optional flag; optional advanced recipe can be a later doc if anyone wants SQL-over-files.
- [x] **A7. Update memory** — record decision: JSON-first; DuckDB not in starter; SQL is an advanced opt-in doc at most.

### Verification (agent-files)

- [x] Fresh scaffold path: no native DuckDB build (deps + scripts cleaned)
- [x] Agent tools create/list/update seed entities
- [x] Local `./data` works with no cloud creds; Blob/R2 still work when configured
- [x] No `/api/query` or catalog required to use the app

### Out of scope (agent-files)

- Porting bolsa’s ledger to JSON
- Multi-tenant auth in the starter
- Publishing a separate “SQL recipe” package (nice-to-have later)

---

## Part B — recetas (app)

Owner: agent working in `mikemajara/recetas`. Depends on the same principles as Part A; does **not** need to wait for agent-files publish, but should not reintroduce DuckDB.

### Tasks

- [x] **B1. File-backed household state** — replace Turso/`@libsql/client` / `lib/db.ts` with JSON files via `lib/state-store.ts` (R2 + local `./data` fallback).
  - `state/shopping.json`
  - `state/meal-plan.json`
  - `state/settings.json`
- [x] **B2. Keep `lib/queries.ts` API** — same function signatures for UI + agent tools; swap internals only.
- [x] **B3. Seed + migrate** — missing files treated as empty; no Turso export (fresh JSON). Optional export skipped.
- [x] **B4. Drop Turso env** — removed `TURSO_*` from `.env.example` / `.env.local`; dropped `@libsql/client`.
- [x] **B5. Align auth research** — auth stays a **research inbox item** only (not part of this migration). PRD note: app data is file-prefixed; identity/session store TBD in research.

### Verification (recetas)

- [x] Local smoke: `scripts/validate-state-json.ts`
- [x] R2 smoke: `scripts/probe-state-r2.ts`
- [x] `pnpm exec tsc --noEmit` + `pnpm build`
- [ ] Manual: shopping / meal plan / settings in the running app (optional follow-up)
- [ ] Agent tools for plan/shop still work (same `lib/queries` API — expected)

### Out of scope (recetas, this plan)

- Staples / fridge planning instructions (follows after file migration)
- Implementing multi-user auth (research inbox item first)

---

## Sequencing

1. Agree this plan (done when status stays `ready`).
2. **Recetas B1–B4** can proceed immediately (unblocks household app).
3. **Agent-files A1–A7** in parallel or next — shared plan file copied into both repos.
4. Then recetas auth/multi-user research (inbox), then staples/fridge agent instructions.

## Risks

- **Better Auth still needs a credential/session store** — file state for app data ≠ identity DB. Research must pick a minimal session approach (may still be a tiny hosted store, or encrypted file — undecided).
- **Concurrent writes** — last-write-wins on full JSON rewrite is fine for one household; document it.
- **Bolsa divergence** — intentional; ledger SQL demo ≠ starter default.
- **agent-files #3** — “optional DuckDB” becomes “removed”; communicate in issue closeout.

## Notes

- Copy of this plan should live in both:
  - `recetas/.backlog/plans/PLAN-json-file-state.md`
  - `agent-files/.backlog/plans/PLAN-json-file-state.md`
- Hand the agent-files agent **Part A** + Decision + Target architecture.
- Hand the recetas agent **Part B** + Decision + Target architecture.

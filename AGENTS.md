# Agent Files

Template for **agent apps that use file storage as the database**, queried with DuckDB, shipped with an Eve companion.

## Architecture

- **Storage:** `files-sdk` adapters — Vercel Blob (default), Cloudflare R2, or local `./data`
- **Catalog:** CSV headers + DuckDB types + `catalog.json` sidecar (`GET /api/schema`)
- **Query:** in-memory DuckDB per request (`POST /api/query`)
- **Agent:** `agent/` Eve tools — `list_tables`, `describe_table`, `run_sql`, `add_note`

## When to use which skill

| User intent | Skill |
| --- | --- |
| Link Vercel + AI Gateway so Companion works (OIDC pull); optional deploy | `.agents/skills/provision-vercel` |
| Create Blob store / switch to R2 or local | `.agents/skills/provision-storage` |
| Add a new CSV table | Extend seed + catalog; register via storage prefix `*.csv` |

`provision-vercel` Definition of Done = linked project + Gateway creds (`VERCEL_OIDC_TOKEN` via `vercel env pull`, or `AI_GATEWAY_API_KEY`) + `/api/schema` + `/eve/v1/health`. It does **not** include machine-specific HTTPS (Caddy / `*.mgl.dev` / portless).

## Local

```bash
cp .env.example .env.local
# STORAGE_BACKEND=local for zero-cloud, or vercel/r2 with credentials
npm install
npm approve-scripts   # allow duckdb native build if prompted
# Companion needs Gateway: ask agent for provision-vercel (vercel link + env pull)
npm run dev
```

## Scaffold

```bash
npx create-agent-files@latest my-app
```

See root [README.md](README.md).

# Agent Files

Template for **agent apps that use file storage as the database** — JSON (+ markdown) on Blob / R2 / local — shipped with an Eve companion.

## Architecture

- **Storage:** `files-sdk` adapters — Vercel Blob (default), Cloudflare R2, or local `./data`
- **State:** JSON files under `STORAGE_PREFIX` (seed demo: `notes.json`) via `src/lib/json-store.ts` + domain modules
- **Agent:** `agent/` Eve tools — `list_notes`, `get_note`, `add_note`, `update_note`

## When to use which skill

| User intent | Skill |
| --- | --- |
| Link Vercel + AI Gateway so Companion works (OIDC pull); optional deploy | `.agents/skills/provision-vercel` |
| Create Blob store / switch to R2 or local | `.agents/skills/provision-storage` |
| Add a new entity | Add a JSON module under `src/lib/` + domain tools; seed via `ensureSeeded` / missing-key fallback |

`provision-vercel` Definition of Done = linked project + Gateway creds (`VERCEL_OIDC_TOKEN` via `vercel env pull`, or `AI_GATEWAY_API_KEY`) + `GET /api/notes` + `/eve/v1/health`. It does **not** include machine-specific HTTPS (Caddy / `*.mgl.dev` / portless).

## Local

```bash
cp .env.example .env.local
# STORAGE_BACKEND=local for zero-cloud, or vercel/r2 with credentials
npm install
# Companion needs Gateway: ask agent for provision-vercel (vercel link + env pull)
npm run dev
```

## Scaffold

```bash
npx create-agent-files@latest my-app
```

See root [README.md](README.md).

# Agent Files

**GitHub template** + **`npx create-agent-files`** for agent apps that treat **object storage as the database**.

- **Eve** companion (`agent/`) with catalog + SQL tools  
- **files-sdk** storage: **Vercel Blob (default)**, Cloudflare R2, or local `./data`  
- **DuckDB** in-memory queries over CSV views  
- **Schema catalog** shared by SQL autocomplete and the agent  
- **Agent skills** under `.agents/skills/` to provision Vercel + storage  

Bolsa (stocks) remains a separate specialized demo. This repo is the generic starter.

## Quick start

### Option A — CLI

```bash
npx create-agent-files@latest my-app
cd my-app
npm install
npm run dev
```

### Option B — GitHub template

Use this template on GitHub → clone → `npm install` → copy `.env.example` to `.env.local`.

## Storage

| `STORAGE_BACKEND` | Credentials |
| --- | --- |
| `vercel` (default) | `BLOB_READ_WRITE_TOKEN` or OIDC + Blob store |
| `r2` | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` |
| `local` | none — files under `./data/{STORAGE_PREFIX}/` |

If cloud credentials are missing, the app **falls back to local** so development works immediately.

## Agent provisioning

Point Cursor (or another coding agent) at:

- `.agents/skills/provision-vercel` — **link + `vercel env pull` (OIDC)** so Companion has AI Gateway; deploy only if asked  
- `.agents/skills/provision-storage` — Blob / R2 / local setup  

Machine-specific HTTPS (Caddy / `*.mgl.dev`) is **not** part of these skills.

See [AGENTS.md](./AGENTS.md).

## Scripts

```bash
npm run dev     # http://localhost:3460 (webpack — required for duckdb)
npm run build
npm start
```

## Publish CLI (maintainers)

```bash
cd packages/create-agent-files
npm login
npm publish --access public
```

Or add an `NPM_TOKEN` repo secret and run the **Publish create-agent-files** GitHub Action / create a GitHub Release.

Until published, run the scaffolder from a checkout:

```bash
node /path/to/agent-files/packages/create-agent-files/bin/create-agent-files.js my-app --storage vercel
```

# Agent Files

**GitHub template** + **`npx create-agent-files`** for agent apps that treat **object storage as the database**.

- **Eve** companion (`agent/`) with domain tools over JSON state  
- **files-sdk** storage: **Vercel Blob (default)**, Cloudflare R2, or local `./data`  
- **JSON (+ markdown)** for durable state — typed helpers, not SQL  
- **Agent skills** under `.agents/skills/` to provision Vercel + storage  

Bolsa (stocks / DuckDB ledger) remains a separate specialized demo. This repo is the generic starter for household / personal agent apps.

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

Seed demo state: `{STORAGE_PREFIX}/notes.json`.

## Agent provisioning

Point Cursor (or another coding agent) at:

- `.agents/skills/provision-vercel` — **link + `vercel env pull` (OIDC)** so Companion has AI Gateway; deploy only if asked  
- `.agents/skills/provision-storage` — Blob / R2 / local setup  

Machine-specific HTTPS (Caddy / `*.mgl.dev`) is **not** part of these skills.

See [AGENTS.md](./AGENTS.md).

## Scripts

```bash
npm run dev     # http://localhost:3460
npm run build
npm start
```

## Publish CLI (maintainers)

Package: `packages/create-agent-files` → npm name **`create-agent-files`**.

### Before every publish

```bash
# from repo root — syntax check + npm pack dry-run
node scripts/prepare-publish.mjs
# or: npm run prepare-publish -C packages/create-agent-files
```

Bump `version` in `packages/create-agent-files/package.json` when republishing
(npm rejects duplicate versions). Commit and push.

### Publish

**Preferred — GitHub Actions** (needs repo secret `NPM_TOKEN` = npm Automation token with publish rights):

1. Actions → **Publish create-agent-files** → Run workflow  
   **or** `gh release create create-agent-files-v0.1.1 --generate-notes`
2. Workflow runs `prepare-publish.mjs`, then `npm publish --access public --provenance`

**Local:**

```bash
cd packages/create-agent-files
npm login
npm publish
```

### After publish

```bash
npx create-agent-files@latest my-app --storage local -y
```

Until published, run from a checkout:

```bash
node /path/to/agent-files/packages/create-agent-files/bin/create-agent-files.js my-app --storage vercel
```

**Note:** the CLI clones this GitHub repo, so scaffolds pick up template changes after you push `main` — even before a CLI version bump.

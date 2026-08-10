---
name: provision-vercel
description: >-
  Link an Agent Files app to a Vercel project and make the Eve companion
  agent-ready locally (AI Gateway via OIDC). Also use when deploying, setting
  Vercel env, or provisioning production for agent-files / create-agent-files.
  Do not use for mgl.dev / Caddy / phone HTTPS — that is a separate local-server
  concern.
---

# Provision Vercel (Agent Files)

**Portable product path** — get a scaffolded app to “Companion can call tools”
without machine-specific reverse proxies.

## Goal / Definition of Done

From the app root, after this skill:

1. `.vercel/` exists (project linked)
2. `.env.local` has **either** a non-empty `VERCEL_OIDC_TOKEN` (preferred) **or** `AI_GATEWAY_API_KEY`
3. `npm run dev` (or `pnpm`) serves the app on its configured host port
4. Smoke: `GET /api/schema` and `GET /eve/v1/health` succeed
5. Companion can start a session (Gateway auth works)

**Out of scope (do not do here):** Caddy, `*.mgl.dev`, UFW, portless, or any
Miguel-server wiring. If the user wants phone/HTTPS on a home server, that is a
separate optional step after this skill succeeds.

Deploy (preview/production URL) is **optional** — only when the user asks to
deploy or “go live on Vercel.”

## Prerequisites

- Vercel CLI (`npx vercel` is fine)
- Auth via `VERCEL_TOKEN` env **or** prior `vercel login`
- Never print tokens in full; never commit `.env.local`

## Steps

### 1. Auth

```bash
printenv VERCEL_TOKEN >/dev/null || npx vercel whoami
```

If neither works, ask the user for a token from https://vercel.com/account/tokens
and export `VERCEL_TOKEN` (do not pass `--token` on the CLI).

### 2. Link / create project

From the **app root** (the Next.js project, not `packages/create-agent-files`):

```bash
npx vercel link --yes --project <app-name>
```

Prefer the directory / `package.json` `name`. Connect the GitHub remote if present.

### 3. Storage backend (credentials only)

Keep whatever `STORAGE_BACKEND` the scaffolder wrote (`local` is fine for first
Companion smoke).

- If the user wants Blob/R2 cloud storage now → follow **provision-storage**
- If `STORAGE_BACKEND=local`, skip Blob tokens; file DB still works under `./data`

Do **not** block Gateway/OIDC on Blob setup.

### 4. Eve / AI Gateway (required for Companion)

**Preferred — OIDC for local + hosted:**

```bash
npx vercel env pull .env.local --yes
```

That merges project env and writes a short-lived `VERCEL_OIDC_TOKEN` (~12h).
Eve / AI Gateway use it automatically. When it expires locally, re-run
`vercel env pull` (or use `vercel dev` for auto-refresh).

On Vercel deployments, OIDC is provisioned automatically — no key required.

**Fallback — long-lived gateway key** (only if OIDC pull is unavailable or the
user insists):

1. Create a key at https://vercel.com/dashboard/ai/api-keys
2. Put `AI_GATEWAY_API_KEY=...` in `.env.local`
3. Optionally mirror to Vercel:

```bash
npx vercel env add AI_GATEWAY_API_KEY production --value "$AI_GATEWAY_API_KEY" --yes
npx vercel env add AI_GATEWAY_API_KEY preview --value "$AI_GATEWAY_API_KEY" --yes
npx vercel env add AI_GATEWAY_API_KEY development --value "$AI_GATEWAY_API_KEY" --yes
```

Prefer OIDC; do not require the user to mint an API key when `env pull` works.

Also ensure non-secret defaults exist locally and (if deploying) on Vercel:

```bash
# .env.local / Vercel development|preview|production as needed
STORAGE_BACKEND=local   # or vercel|r2 once provision-storage is done
STORAGE_PREFIX=workspace
```

### 5. Restart local app + smoke

```bash
npm run dev
# or: pnpm run dev
```

```bash
curl -sS "http://127.0.0.1:<port>/api/schema" | head -c 400
curl -sS "http://127.0.0.1:<port>/eve/v1/health"
```

Use the port from `package.json` `dev` script (template default `3460`). Expect
schema JSON and Eve `ok`/`ready`. Then open Companion and confirm a turn does
not fail with “AI Gateway received no credentials.”

### 6. Deploy (only if requested)

Default to **preview** unless the user explicitly asks for production:

```bash
npx vercel env add STORAGE_BACKEND production --value vercel --yes   # if using Blob
npx vercel env add STORAGE_PREFIX production --value workspace --yes
# repeat preview + development as needed

npx vercel deploy -y --no-wait
# production only if requested:
# npx vercel deploy --prod -y --no-wait
```

Poll with `npx vercel inspect <url>` until Ready. Smoke:

```bash
curl -sS "$URL/api/schema" | head -c 400
curl -sS "$URL/eve/v1/health"
```

### 7. Report

Return: project name, whether OIDC or API key is in use, local smoke results,
any missing env, and deployment URL(s) **only if** step 6 ran.

## Notes

- Build uses `next build --webpack` (DuckDB native binary; Turbopack panics on
  node-pre-gyp).
- `agent/agent.ts` must list `duckdb` under `build.externalDependencies` so Eve
  does not bundle the native addon into authored tools.
- Do **not** configure `/srv`, Caddy, UFW, or `*.mgl.dev` in this skill.

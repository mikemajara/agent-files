---
name: provision-vercel
description: >-
  Link this Agent Files app to a Vercel project, configure Blob storage and AI
  Gateway env, and deploy. Use when the user asks to deploy, set up Vercel,
  create a Blob store, or provision production for agent-files / create-agent-files.
---

# Provision Vercel (Agent Files)

Goal: a linked Vercel project with storage + Eve credentials and a live URL.

## Prerequisites

- Vercel CLI available (`npx vercel` is fine)
- Auth via `VERCEL_TOKEN` env **or** prior `vercel login`
- Never print tokens in full; never commit `.env.local`

## Steps

### 1. Auth

```bash
printenv VERCEL_TOKEN >/dev/null || npx vercel whoami
```

If neither works, ask the user for a token from https://vercel.com/account/tokens and export `VERCEL_TOKEN` (do not pass `--token` on the CLI).

### 2. Link / create project

From the app root (the Next.js project, not `packages/create-agent-files`):

```bash
npx vercel link --yes --project <app-name>
```

Prefer the directory/`package.json` name. Connect the GitHub remote if present.

### 3. Storage backend

Set `STORAGE_BACKEND=vercel` unless the user chose R2/local.

Then follow **provision-storage** (Vercel Blob section) to obtain `BLOB_READ_WRITE_TOKEN` or link a Blob store for OIDC (`BLOB_STORE_ID`).

### 4. Eve / AI Gateway

- Local: set `AI_GATEWAY_API_KEY` in `.env.local`
- Vercel: set the same env for Production/Preview/Development, **or** rely on project OIDC when using AI Gateway with a linked project

```bash
npx vercel env add AI_GATEWAY_API_KEY production --value "$AI_GATEWAY_API_KEY" --yes
npx vercel env add AI_GATEWAY_API_KEY preview --value "$AI_GATEWAY_API_KEY" --yes
npx vercel env add AI_GATEWAY_API_KEY development --value "$AI_GATEWAY_API_KEY" --yes
```

Also set:

```bash
npx vercel env add STORAGE_BACKEND production --value vercel --yes
# repeat preview + development
npx vercel env add STORAGE_PREFIX production --value workspace --yes
```

### 5. Deploy

Default to **preview** unless the user explicitly asks for production:

```bash
npx vercel deploy -y --no-wait
# production only if requested:
# npx vercel deploy --prod -y --no-wait
```

Poll with `npx vercel inspect <url>` until Ready. Smoke:

```bash
curl -sS "$URL/api/schema" | head -c 400
curl -sS "$URL/eve/v1/health"
```

### 6. Report

Return: project name, deployment URL(s), storage backend, any missing env vars.

## Notes

- Build uses `next build --webpack` (DuckDB native binary; Turbopack panics on node-pre-gyp).
- Do not use Miguel-specific `/srv` or `mgl.dev` paths in this skill.

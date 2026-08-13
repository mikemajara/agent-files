---
name: provision-storage
description: >-
  Configure Agent Files storage backends (Vercel Blob default, Cloudflare R2, or
  local ./data). Use when switching STORAGE_BACKEND, creating a Blob store,
  wiring R2 credentials, or smoke-testing file uploads.
---

# Provision storage (Agent Files)

Unified API: `readText` / `writeText` / `url` / `listKeys` via `src/lib/storage`.

Env switch: `STORAGE_BACKEND=vercel|r2|local` (default `vercel`).  
Prefix: `STORAGE_PREFIX` (default `workspace`).

If cloud credentials are missing, the factory **falls back to local** so `npm run dev` still works.

## Vercel Blob (default)

1. In the Vercel dashboard: Project → Storage → Create Blob store → connect to this project.
2. Copy the read-write token into `.env.local`:

```bash
STORAGE_BACKEND=vercel
STORAGE_PREFIX=workspace
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

On Vercel deployments, prefer OIDC: leave the long-lived token unset and ensure the Blob store is linked (`BLOB_STORE_ID` if required by the SDK).

3. Mirror env to Vercel (`BLOB_READ_WRITE_TOKEN` and/or store id) for all environments.
4. Smoke (Node, from app root with env loaded):

```bash
curl -sS http://127.0.0.1:3460/api/notes
```

Expect `backend: "vercel"` (or `"local"` if token missing) and a `notes` array.

## Cloudflare R2

```bash
STORAGE_BACKEND=r2
STORAGE_PREFIX=workspace
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=agent-files
# optional public CDN origin (not the S3 API host):
# R2_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev
```

Install peers if needed: `@aws-sdk/client-s3` (already in template).  
Smoke via `/api/notes` → `backend: "r2"`.

## Local

```bash
STORAGE_BACKEND=local
STORAGE_PREFIX=workspace
```

Files land in `./data/workspace/` (gitignored). First request seeds `notes.json`.

## Switching backends

1. Update `STORAGE_BACKEND` in `.env.local` and Vercel env.
2. Re-seed is automatic only when keys are **missing** — migrating data between backends is a manual copy.
3. Restart `npm run dev` / redeploy.

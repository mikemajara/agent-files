import { Files } from "files-sdk";
import { r2 } from "files-sdk/r2";
import type { StorageAdapter } from "./types";

let _files: Files | null = null;

function getFiles(): Files {
  if (_files) return _files;
  const bucket = process.env.R2_BUCKET?.trim() || "agent-files";
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim() || undefined;
  _files = new Files({
    adapter: r2({
      bucket,
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      ...(publicBaseUrl ? { publicBaseUrl } : {}),
      client: "fetch",
    }),
  });
  return _files;
}

export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim(),
  );
}

export const r2Adapter: StorageAdapter = {
  async readText(key) {
    const files = getFiles();
    if (!(await files.exists(key))) return null;
    return (await files.download(key)).text();
  },
  async writeText(key, body, contentType) {
    await getFiles().upload(key, body, {
      contentType:
        contentType ??
        (key.endsWith(".json")
          ? "application/json"
          : "text/csv; charset=utf-8"),
    });
  },
  async url(key, expiresInSeconds = 60) {
    const files = getFiles();
    if (!(await files.exists(key))) return null;
    return files.url(key, { expiresIn: expiresInSeconds });
  },
  async listKeys(prefix) {
    const keys: string[] = [];
    for await (const file of getFiles().listAll({ prefix })) {
      if (file.key) keys.push(file.key);
    }
    return keys;
  },
};

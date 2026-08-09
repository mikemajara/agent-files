import { Files } from "files-sdk";
import { vercelBlob } from "files-sdk/vercel-blob";
import type { StorageAdapter } from "./types";

let _files: Files | null = null;

function getFiles(): Files {
  if (_files) return _files;
  _files = new Files({
    adapter: vercelBlob({
      addRandomSuffix: false,
      allowOverwrite: true,
      access: "public",
    }),
  });
  return _files;
}

export function vercelConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      (process.env.VERCEL_OIDC_TOKEN?.trim() &&
        process.env.BLOB_STORE_ID?.trim()),
  );
}

export const vercelBlobAdapter: StorageAdapter = {
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

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter } from "./types";

function localRoot(): string {
  return path.join(process.cwd(), "data");
}

function localPath(key: string): string {
  return path.join(localRoot(), key);
}

export const localAdapter: StorageAdapter = {
  async readText(key) {
    try {
      return await readFile(localPath(key), "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  },
  async writeText(key, body) {
    const filePath = localPath(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body, "utf8");
  },
  async url(key) {
    const exists = await this.readText(key);
    if (exists === null) return null;
    return `file://${localPath(key)}`;
  },
  async listKeys(prefix) {
    const dir = path.join(localRoot(), prefix.replace(/\/$/, ""));
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile())
        .map((e) => path.posix.join(prefix.replace(/\/$/, ""), e.name));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  },
};

import { getStorage } from "@/lib/storage";

/** Serialize mutations per key (last-write-wins across isolates is still possible). */
const chains = new Map<string, Promise<unknown>>();

function withKeyLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  chains.set(
    key,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

export async function readJsonFile<T>(key: string, fallback: T): Promise<T> {
  const storage = getStorage();
  const raw = await storage.readText(key);
  if (raw == null || raw.trim() === "") return fallback;
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(key: string, value: unknown): Promise<void> {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  const storage = getStorage();
  await storage.writeText(key, body, "application/json; charset=utf-8");
}

/** Read-modify-write under a per-key in-process lock. */
export async function updateJsonFile<T>(
  key: string,
  fallback: T,
  mutate: (current: T) => T | Promise<T>,
): Promise<T> {
  return withKeyLock(key, async () => {
    const current = await readJsonFile(key, fallback);
    const next = await mutate(current);
    await writeJsonFile(key, next);
    return next;
  });
}

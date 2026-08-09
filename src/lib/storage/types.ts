export type StorageBackendName = "vercel" | "r2" | "local";

export type StorageAdapter = {
  readText(key: string): Promise<string | null>;
  writeText(key: string, body: string, contentType?: string): Promise<void>;
  url(key: string, expiresInSeconds?: number): Promise<string | null>;
  listKeys(prefix: string): Promise<string[]>;
};

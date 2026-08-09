import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import duckdb from "duckdb";
import { storagePrefix } from "@/lib/schema";
import { ensureSeeded, getStorage } from "@/lib/storage";

export type QueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
};

function openMemory(): duckdb.Database {
  return new duckdb.Database(":memory:");
}

function jsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(jsonSafe);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = jsonSafe(v);
    }
    return out;
  }
  return value;
}

function all(
  conn: duckdb.Connection,
  sql: string,
  params: unknown[] = [],
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    conn.all(sql, ...params, (err, rows) => {
      if (err) reject(err);
      else {
        resolve(
          ((rows ?? []) as Record<string, unknown>[]).map(
            (row) => jsonSafe(row) as Record<string, unknown>,
          ),
        );
      }
    });
  });
}

function run(conn: duckdb.Connection, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    conn.run(sql, (err) => (err ? reject(err) : resolve()));
  });
}

function tableNameFromKey(key: string): string | null {
  const prefix = `${storagePrefix()}/`;
  if (!key.startsWith(prefix) || !key.endsWith(".csv")) return null;
  const base = key.slice(prefix.length, -".csv".length);
  if (!base || base.includes("/")) return null;
  return base;
}

/**
 * Open in-memory DuckDB, materialize every CSV under the storage prefix as a view.
 */
export async function withWorkspaceDb<T>(
  fn: (conn: duckdb.Connection) => Promise<T>,
): Promise<T> {
  await ensureSeeded();
  const storage = getStorage();
  const prefix = `${storagePrefix()}/`;
  const keys = (await storage.listKeys(prefix)).filter((k) =>
    tableNameFromKey(k),
  );

  if (keys.length === 0) {
    throw new Error(`No CSV tables found under ${prefix}`);
  }

  const dir = await mkdtemp(path.join(tmpdir(), "agent-files-duck-"));
  const db = openMemory();
  const conn = db.connect();

  try {
    for (const key of keys) {
      const name = tableNameFromKey(key);
      if (!name) continue;
      const body = await storage.readText(key);
      if (!body) continue;
      const filePath = path.join(dir, `${name}.csv`);
      await writeFile(filePath, body, "utf8");
      const escaped = filePath.replace(/'/g, "''");
      await run(
        conn,
        `CREATE OR REPLACE VIEW ${name} AS SELECT * FROM read_csv_auto('${escaped}', header=true, sample_size=-1)`,
      );
    }
    return await fn(conn);
  } finally {
    conn.close();
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
}

export async function querySql(
  sql: string,
  rowLimit = 1000,
): Promise<QueryResult> {
  return withWorkspaceDb(async (conn) => {
    const limited = `SELECT * FROM (${sql}) AS q LIMIT ${rowLimit}`;
    const rows = await all(conn, limited);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return { columns, rows };
  });
}

export async function queryNotes(): Promise<Record<string, unknown>[]> {
  return withWorkspaceDb(async (conn) => {
    return all(
      conn,
      `
      SELECT id, created_at, title, body, tags
      FROM notes
      ORDER BY created_at DESC, id DESC
      `,
    );
  });
}

const FORBIDDEN =
  /\b(attach|copy|export|import|install|load|pragma|call|create\s+secret|drop|alter|update|delete|insert|replace|truncate|vacuum|checkpoint|force|set\s+)/i;

export function assertReadOnlySelect(sql: string): void {
  const trimmed = sql.trim().replace(/;+\s*$/, "");
  if (!trimmed) throw new Error("SQL is empty");
  if (trimmed.includes(";")) {
    throw new Error("Only a single statement is allowed");
  }
  if (!/^(with|select)\b/i.test(trimmed)) {
    throw new Error("Only SELECT / WITH queries are allowed");
  }
  if (FORBIDDEN.test(trimmed)) {
    throw new Error("Query contains a forbidden keyword");
  }
}

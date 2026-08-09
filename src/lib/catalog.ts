import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import duckdb from "duckdb";
import {
  catalogKey,
  SEED_CATALOG,
  storagePrefix,
  type CatalogSidecar,
} from "@/lib/schema";
import { ensureSeeded, getStorage, storageBackend } from "@/lib/storage";

export type CatalogColumn = {
  name: string;
  type: string;
  sample: string | null;
  description?: string;
};

export type CatalogTable = {
  name: string;
  key: string;
  description?: string;
  joins?: string[];
  columns: CatalogColumn[];
  rowEstimate: number | null;
};

export type SchemaCatalog = {
  backend: string;
  tables: CatalogTable[];
};

function parseCsvLines(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
}

function splitCsvRow(line: string): string[] {
  return line.split(",").map((c) => c.trim());
}

function tableNameFromKey(key: string): string | null {
  const prefix = `${storagePrefix()}/`;
  if (!key.startsWith(prefix) || !key.endsWith(".csv")) return null;
  const base = key.slice(prefix.length, -".csv".length);
  if (!base || base.includes("/")) return null;
  return base;
}

function openMemory(): duckdb.Database {
  return new duckdb.Database(":memory:");
}

function all(
  conn: duckdb.Connection,
  sql: string,
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    conn.all(sql, (err, rows) => {
      if (err) reject(err);
      else resolve((rows ?? []) as Record<string, unknown>[]);
    });
  });
}

async function duckDescribe(
  csvBody: string,
  tableHint: string,
): Promise<{ types: Record<string, string>; rowEstimate: number | null }> {
  const dir = await mkdtemp(path.join(tmpdir(), "agent-files-catalog-"));
  const filePath = path.join(dir, `${tableHint}.csv`);
  const db = openMemory();
  const conn = db.connect();
  try {
    await writeFile(filePath, csvBody, "utf8");
    const escaped = filePath.replace(/'/g, "''");
    const desc = await all(
      conn,
      `DESCRIBE SELECT * FROM read_csv_auto('${escaped}', header=true, sample_size=-1)`,
    );
    const types: Record<string, string> = {};
    for (const row of desc) {
      const name = String(row.column_name ?? "");
      const type = String(row.column_type ?? "UNKNOWN");
      if (name) types[name] = type;
    }
    const countRows = await all(
      conn,
      `SELECT count(*)::BIGINT AS n FROM read_csv_auto('${escaped}', header=true, sample_size=-1)`,
    );
    const n = countRows[0]?.n;
    const rowEstimate =
      typeof n === "bigint"
        ? Number(n)
        : typeof n === "number"
          ? n
          : n != null
            ? Number(n)
            : null;
    return { types, rowEstimate };
  } finally {
    conn.close();
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
}

async function loadSidecar(): Promise<CatalogSidecar> {
  const storage = getStorage();
  const raw = await storage.readText(catalogKey());
  if (!raw) return JSON.parse(SEED_CATALOG) as CatalogSidecar;
  try {
    return JSON.parse(raw) as CatalogSidecar;
  } catch {
    return JSON.parse(SEED_CATALOG) as CatalogSidecar;
  }
}

export async function buildSchemaCatalog(): Promise<SchemaCatalog> {
  await ensureSeeded();
  const storage = getStorage();
  const sidecar = await loadSidecar();
  const prefix = `${storagePrefix()}/`;

  let csvKeys = (await storage.listKeys(prefix)).filter((k) =>
    tableNameFromKey(k),
  );
  const notesPath = `${prefix}notes.csv`;
  if (!csvKeys.includes(notesPath)) csvKeys.push(notesPath);
  csvKeys = [...new Set(csvKeys)].sort();

  const tables: CatalogTable[] = [];
  for (const key of csvKeys) {
    const name = tableNameFromKey(key);
    if (!name) continue;
    const body = await storage.readText(key);
    if (!body) continue;
    const lines = parseCsvLines(body);
    if (lines.length === 0) continue;
    const headers = splitCsvRow(lines[0]);
    const sampleValues =
      lines.length > 1 ? splitCsvRow(lines[1]) : headers.map(() => "");

    let types: Record<string, string> = {};
    let rowEstimate: number | null = Math.max(0, lines.length - 1);
    try {
      const described = await duckDescribe(body, name);
      types = described.types;
      rowEstimate = described.rowEstimate;
    } catch {
      // header-only fallback
    }

    const docs = sidecar.tables?.[name];
    tables.push({
      name,
      key,
      description: docs?.description,
      joins: docs?.joins,
      rowEstimate,
      columns: headers.map((col, i) => ({
        name: col,
        type: types[col] ?? "UNKNOWN",
        sample: sampleValues[i] ?? null,
        description: docs?.columns?.[col],
      })),
    });
  }

  return { backend: storageBackend(), tables };
}

export async function listTablesSummary() {
  const catalog = await buildSchemaCatalog();
  return catalog.tables.map((t) => ({
    name: t.name,
    description: t.description,
    columnCount: t.columns.length,
  }));
}

export async function describeTable(tableName: string) {
  const catalog = await buildSchemaCatalog();
  const name = tableName.trim().toLowerCase();
  return catalog.tables.find((t) => t.name.toLowerCase() === name) ?? null;
}

export function catalogToSqlSchema(
  catalog: SchemaCatalog,
): Record<string, string[]> {
  const schema: Record<string, string[]> = {};
  for (const table of catalog.tables) {
    schema[table.name] = table.columns.map((c) => c.name);
  }
  return schema;
}

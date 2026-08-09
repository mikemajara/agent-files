"use client";

import { useCallback, useState } from "react";
import { SqlEditor } from "@/components/SqlEditor";
import { CompanionPanel } from "@/components/CompanionPanel";

type Note = {
  id: string;
  created_at: string;
  title: string;
  body: string;
  tags: string;
};

type Tab = "notes" | "query";

type QueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
};

type WorkspaceAppProps = {
  initialNotes: Record<string, unknown>[];
  initialBackend: string;
  initialError: string | null;
};

const SAMPLE_SQL = `SELECT tags, count(*) AS n
FROM notes
GROUP BY tags
ORDER BY n DESC`;

export function WorkspaceApp({
  initialNotes,
  initialBackend,
  initialError,
}: WorkspaceAppProps) {
  const [tab, setTab] = useState<Tab>("notes");
  const [backend, setBackend] = useState(initialBackend);
  const [notes, setNotes] = useState(() => initialNotes as unknown as Note[]);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const [sql, setSql] = useState(SAMPLE_SQL);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [querying, setQuerying] = useState(false);
  const [companionOpen, setCompanionOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notes");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load notes");
      setNotes(json.notes ?? []);
      setBackend(json.backend ?? "unknown");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  async function onAddNote(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, tags }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add note");
      setNotes(json.notes ?? []);
      setBackend(json.backend ?? backend);
      setTitle("");
      setBody("");
      setTags("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  async function onRunQuery(e: React.FormEvent) {
    e.preventDefault();
    setQuerying(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Query failed");
      setQueryResult({ columns: json.columns, rows: json.rows });
      if (json.backend) setBackend(json.backend);
    } catch (err) {
      setQueryResult(null);
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setQuerying(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3 border-b border-line pb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
              CSV · DuckDB · files-sdk · Eve
            </p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
              Agent Files
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-chip px-3 py-1 font-mono text-xs text-muted">
              storage: {backend}
            </span>
            <button
              type="button"
              onClick={() => setCompanionOpen(true)}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white"
            >
              Companion
            </button>
          </div>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Template for agent apps that persist state as files. Default storage
          is Vercel Blob; R2 and local{" "}
          <code className="font-mono">./data</code> are supported too.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Sections">
        {(
          [
            ["notes", "Notes"],
            ["query", "SQL"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              tab === id
                ? "bg-accent text-white"
                : "bg-panel text-foreground ring-1 ring-line hover:bg-accent-soft"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void refresh()}
          className="ml-auto rounded-md px-3 py-1.5 text-sm text-muted ring-1 ring-line hover:bg-panel"
        >
          Refresh
        </button>
      </nav>

      {error ? (
        <div
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger ring-1 ring-red-200"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading from storage…</p>
      ) : null}

      {!loading && tab === "notes" ? (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <form
            onSubmit={onAddNote}
            className="flex flex-col gap-3 rounded-lg bg-panel p-4 ring-1 ring-line"
          >
            <div>
              <h2 className="text-lg font-medium">Add note</h2>
              <p className="text-sm text-muted">
                Appends a row and rewrites notes.csv.
              </p>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Title</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-md border border-line bg-background px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Body</span>
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="rounded-md border border-line bg-background px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted">Tags</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="space separated"
                className="rounded-md border border-line bg-background px-2 py-1.5"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="mt-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Writing CSV…" : "Append note"}
            </button>
          </form>

          <section className="overflow-hidden rounded-lg bg-panel ring-1 ring-line">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-lg font-medium">Notes</h2>
              <p className="text-sm text-muted">Raw notes.csv rows.</p>
            </div>
            <ul className="divide-y divide-line">
              {notes.length === 0 ? (
                <li className="px-4 py-6 text-sm text-muted">No notes yet.</li>
              ) : (
                notes.map((n) => (
                  <li key={String(n.id)} className="px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-medium">{n.title}</h3>
                      <span className="font-mono text-[11px] text-muted">
                        {String(n.created_at).slice(0, 19)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted whitespace-pre-wrap">
                      {n.body}
                    </p>
                    {n.tags ? (
                      <p className="mt-1 font-mono text-[11px] text-muted">
                        {n.tags}
                      </p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      ) : null}

      {!loading && tab === "query" ? (
        <section className="flex flex-col gap-4 rounded-lg bg-panel p-4 ring-1 ring-line">
          <div>
            <h2 className="text-lg font-medium">SQL scratchpad</h2>
            <p className="text-sm text-muted">
              Read-only SELECT against CSV views (e.g.{" "}
              <code className="font-mono">notes</code>). Max 500 rows.
            </p>
          </div>
          <form onSubmit={onRunQuery} className="flex flex-col gap-3">
            <SqlEditor value={sql} onChange={setSql} />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={querying}
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {querying ? "Running…" : "Run query"}
              </button>
              <button
                type="button"
                onClick={() => setSql(SAMPLE_SQL)}
                className="rounded-md px-3 py-2 text-sm text-muted ring-1 ring-line hover:bg-chip"
              >
                Reset sample
              </button>
            </div>
          </form>

          {queryResult ? (
            <div className="overflow-x-auto rounded-md ring-1 ring-line">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-chip/60 font-mono text-xs text-muted uppercase">
                  <tr>
                    {queryResult.columns.map((c) => (
                      <th key={c} className="px-3 py-2 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResult.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={Math.max(queryResult.columns.length, 1)}
                        className="px-3 py-4 text-muted"
                      >
                        No rows.
                      </td>
                    </tr>
                  ) : (
                    queryResult.rows.map((row, i) => (
                      <tr key={i} className="border-t border-line">
                        {queryResult.columns.map((c) => (
                          <td key={c} className="px-3 py-2 font-mono text-xs">
                            {formatCell(row[c])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      <CompanionPanel
        open={companionOpen}
        onClose={() => setCompanionOpen(false)}
      />
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

"use client";

import { useCallback, useState } from "react";
import { CompanionPanel } from "@/components/CompanionPanel";

type Note = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  body: string;
  tags: string[];
};

type WorkspaceAppProps = {
  initialNotes: Note[];
  initialBackend: string;
  initialError: string | null;
};

export function WorkspaceApp({
  initialNotes,
  initialBackend,
  initialError,
}: WorkspaceAppProps) {
  const [backend, setBackend] = useState(initialBackend);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3 border-b border-line pb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
              JSON · files-sdk · Eve
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
              onClick={() => void refresh()}
              className="rounded-md px-3 py-1.5 text-sm text-muted ring-1 ring-line hover:bg-panel"
            >
              Refresh
            </button>
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
          Template for household agent apps that persist state as JSON files.
          Default storage is Vercel Blob; R2 and local{" "}
          <code className="font-mono">./data</code> work too.
        </p>
      </header>

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
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <form
            onSubmit={onAddNote}
            className="flex flex-col gap-3 rounded-lg bg-panel p-4 ring-1 ring-line"
          >
            <div>
              <h2 className="text-lg font-medium">Add note</h2>
              <p className="text-sm text-muted">
                Writes to <code className="font-mono">notes.json</code>.
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
                placeholder="space or comma separated"
                className="rounded-md border border-line bg-background px-2 py-1.5"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="mt-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Add note"}
            </button>
          </form>

          <section className="overflow-hidden rounded-lg bg-panel ring-1 ring-line">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-lg font-medium">Notes</h2>
              <p className="text-sm text-muted">
                From <code className="font-mono">notes.json</code>.
              </p>
            </div>
            <ul className="divide-y divide-line">
              {notes.length === 0 ? (
                <li className="px-4 py-6 text-sm text-muted">No notes yet.</li>
              ) : (
                notes.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-medium">{n.title}</h3>
                      <span className="font-mono text-[11px] text-muted">
                        {String(n.updated_at ?? n.created_at).slice(0, 19)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted whitespace-pre-wrap">
                      {n.body}
                    </p>
                    {n.tags?.length ? (
                      <p className="mt-1 font-mono text-[11px] text-muted">
                        {n.tags.join(" ")}
                      </p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      )}

      <CompanionPanel
        open={companionOpen}
        onClose={() => setCompanionOpen(false)}
      />
    </div>
  );
}

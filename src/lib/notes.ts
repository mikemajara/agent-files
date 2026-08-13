import { randomUUID } from "node:crypto";
import { readJsonFile, updateJsonFile } from "@/lib/json-store";
import {
  EMPTY_NOTES,
  normalizeTags,
  notesKey,
  type NewNoteInput,
  type Note,
  type NotesFile,
  type UpdateNoteInput,
} from "@/lib/schema";
import { ensureSeeded } from "@/lib/storage";

function sortNewestFirst(notes: Note[]): Note[] {
  return [...notes].sort((a, b) =>
    String(b.updated_at).localeCompare(String(a.updated_at)),
  );
}

export async function listNotes(opts?: {
  tag?: string;
  limit?: number;
}): Promise<Note[]> {
  await ensureSeeded();
  const file = await readJsonFile<NotesFile>(notesKey(), EMPTY_NOTES);
  let notes = sortNewestFirst(file.notes ?? []);
  if (opts?.tag?.trim()) {
    const tag = opts.tag.trim().toLowerCase();
    notes = notes.filter((n) =>
      (n.tags ?? []).some((t) => t.toLowerCase() === tag),
    );
  }
  if (opts?.limit != null && opts.limit >= 0) {
    notes = notes.slice(0, opts.limit);
  }
  return notes;
}

export async function getNote(id: string): Promise<Note | null> {
  await ensureSeeded();
  const file = await readJsonFile<NotesFile>(notesKey(), EMPTY_NOTES);
  return (file.notes ?? []).find((n) => n.id === id) ?? null;
}

export async function addNote(input: NewNoteInput): Promise<Note> {
  if (!input.title?.trim()) throw new Error("title is required");
  if (!input.body?.trim()) throw new Error("body is required");

  const now = new Date().toISOString();
  const note: Note = {
    id: `note_${randomUUID().slice(0, 8)}`,
    created_at: now,
    updated_at: now,
    title: input.title.trim(),
    body: input.body.trim(),
    tags: normalizeTags(input.tags),
  };

  await ensureSeeded();
  await updateJsonFile(notesKey(), EMPTY_NOTES, (file) => ({
    schemaVersion: 1 as const,
    notes: [...(file.notes ?? []), note],
  }));

  return note;
}

export async function updateNote(input: UpdateNoteInput): Promise<Note> {
  if (!input.id?.trim()) throw new Error("id is required");

  await ensureSeeded();
  let updated: Note | null = null;

  await updateJsonFile(notesKey(), EMPTY_NOTES, (file) => {
    const notes = [...(file.notes ?? [])];
    const idx = notes.findIndex((n) => n.id === input.id);
    if (idx < 0) throw new Error(`note not found: ${input.id}`);

    const current = notes[idx]!;
    const next: Note = {
      ...current,
      title:
        input.title !== undefined ? input.title.trim() : current.title,
      body: input.body !== undefined ? input.body.trim() : current.body,
      tags:
        input.tags !== undefined
          ? normalizeTags(input.tags)
          : current.tags,
      updated_at: new Date().toISOString(),
    };

    if (!next.title) throw new Error("title is required");
    if (!next.body) throw new Error("body is required");

    notes[idx] = next;
    updated = next;
    return { schemaVersion: 1 as const, notes };
  });

  if (!updated) throw new Error(`note not found: ${input.id}`);
  return updated;
}

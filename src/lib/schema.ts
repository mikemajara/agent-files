export function storagePrefix(): string {
  return (process.env.STORAGE_PREFIX?.trim() || "workspace").replace(
    /^\/+|\/+$/g,
    "",
  );
}

export function notesKey(): string {
  return `${storagePrefix()}/notes.json`;
}

export type Note = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  body: string;
  tags: string[];
};

export type NotesFile = {
  schemaVersion: 1;
  notes: Note[];
};

export type NewNoteInput = {
  title: string;
  body: string;
  tags?: string[] | string;
};

export type UpdateNoteInput = {
  id: string;
  title?: string;
  body?: string;
  tags?: string[] | string;
};

export const EMPTY_NOTES: NotesFile = { schemaVersion: 1, notes: [] };

export const SEED_NOTES: NotesFile = {
  schemaVersion: 1,
  notes: [
    {
      id: "note_001",
      created_at: "2024-06-01T10:00:00.000Z",
      updated_at: "2024-06-01T10:00:00.000Z",
      title: "Welcome",
      body: "Agent Files stores durable state as JSON files in object storage.",
      tags: ["intro", "template"],
    },
    {
      id: "note_002",
      created_at: "2024-06-02T14:30:00.000Z",
      updated_at: "2024-06-02T14:30:00.000Z",
      title: "Domain tools",
      body: "The companion uses list_notes / get_note / add_note / update_note — not SQL.",
      tags: ["agent"],
    },
    {
      id: "note_003",
      created_at: "2024-06-03T09:15:00.000Z",
      updated_at: "2024-06-03T09:15:00.000Z",
      title: "Storage backends",
      body: "Default is Vercel Blob via files-sdk. R2 and local ./data are supported too.",
      tags: ["storage", "vercel"],
    },
  ],
};

export function normalizeTags(tags?: string[] | string): string[] {
  if (tags == null) return [];
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  return String(tags)
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

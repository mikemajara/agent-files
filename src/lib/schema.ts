export function storagePrefix(): string {
  return (process.env.STORAGE_PREFIX?.trim() || "workspace").replace(
    /^\/+|\/+$/g,
    "",
  );
}

export function notesKey(): string {
  return `${storagePrefix()}/notes.csv`;
}

export function catalogKey(): string {
  return `${storagePrefix()}/catalog.json`;
}

export const NOTES_HEADER = "id,created_at,title,body,tags";

export const SEED_NOTES = `${NOTES_HEADER}
note_001,2024-06-01T10:00:00.000Z,Welcome,Agent Files stores durable state as CSV files in object storage and queries them with DuckDB.,intro template
note_002,2024-06-02T14:30:00.000Z,Schema catalog,catalog.json holds human descriptions agents and SQL autocomplete share.,schema agent
note_003,2024-06-03T09:15:00.000Z,Storage backends,Default is Vercel Blob via files-sdk. R2 and local ./data are also supported.,storage vercel
`;

export const SEED_CATALOG = JSON.stringify(
  {
    schemaVersion: 1,
    tables: {
      notes: {
        description:
          "Free-form workspace notes. Append-only ledger of ideas and status updates.",
        columns: {
          id: "Unique note id (string).",
          created_at: "ISO timestamp when the note was created.",
          title: "Short title.",
          body: "Note body text.",
          tags: "Space-separated tags.",
        },
        joins: [],
      },
    },
  },
  null,
  2,
);

export type CatalogSidecar = {
  schemaVersion?: number;
  tables?: Record<
    string,
    {
      description?: string;
      columns?: Record<string, string>;
      joins?: string[];
    }
  >;
};

export type Note = {
  id: string;
  created_at: string;
  title: string;
  body: string;
  tags: string;
};

export type NewNoteInput = {
  title: string;
  body: string;
  tags?: string;
};

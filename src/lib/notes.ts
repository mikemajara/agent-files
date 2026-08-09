import { randomUUID } from "node:crypto";
import { NOTES_HEADER, notesKey, type NewNoteInput } from "@/lib/schema";
import { ensureSeeded, getStorage } from "@/lib/storage";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function appendNoteCsv(existing: string, input: NewNoteInput): string {
  if (!input.title?.trim()) throw new Error("title is required");
  if (!input.body?.trim()) throw new Error("body is required");

  const id = `note_${randomUUID().slice(0, 8)}`;
  const created_at = new Date().toISOString();
  const row = [
    id,
    created_at,
    csvEscape(input.title.trim()),
    csvEscape(input.body.trim()),
    csvEscape((input.tags ?? "").trim()),
  ].join(",");

  const body = existing.trimEnd();
  if (!body) return `${NOTES_HEADER}\n${row}\n`;
  return `${body}\n${row}\n`;
}

export async function addNote(input: NewNoteInput): Promise<void> {
  await ensureSeeded();
  const storage = getStorage();
  const current = (await storage.readText(notesKey())) ?? "";
  const next = appendNoteCsv(current, input);
  await storage.writeText(notesKey(), next);
}

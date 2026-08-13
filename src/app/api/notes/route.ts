import { NextResponse } from "next/server";
import { addNote, listNotes } from "@/lib/notes";
import { storageBackend } from "@/lib/storage";
import type { NewNoteInput } from "@/lib/schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const notes = await listNotes();
    return NextResponse.json({ notes, backend: storageBackend() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<NewNoteInput>;
    const input: NewNoteInput = {
      title: String(body.title ?? ""),
      body: String(body.body ?? ""),
      tags: body.tags,
    };
    const note = await addNote(input);
    const notes = await listNotes();
    return NextResponse.json(
      { ok: true, note, notes, backend: storageBackend() },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

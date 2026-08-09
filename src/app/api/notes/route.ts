import { NextResponse } from "next/server";
import { queryNotes } from "@/lib/duck";
import { addNote } from "@/lib/notes";
import { storageBackend } from "@/lib/storage";
import type { NewNoteInput } from "@/lib/schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const notes = await queryNotes();
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
      tags: body.tags === undefined ? "" : String(body.tags),
    };
    await addNote(input);
    const notes = await queryNotes();
    return NextResponse.json(
      { ok: true, notes, backend: storageBackend() },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { defineTool } from "eve/tools";
import { z } from "zod";
import { addNote } from "@/lib/notes";
import { queryNotes } from "@/lib/duck";

export default defineTool({
  description:
    "Append a note to notes.csv (rewrites the file). Confirm with the user before calling.",
  inputSchema: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    tags: z.string().optional(),
  }),
  async execute(input) {
    await addNote(input);
    const notes = await queryNotes();
    return { ok: true, noteCount: notes.length, notes: notes.slice(0, 5) };
  },
});

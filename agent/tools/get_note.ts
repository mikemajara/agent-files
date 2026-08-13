import { defineTool } from "eve/tools";
import { z } from "zod";
import { getNote } from "@/lib/notes";

export default defineTool({
  description: "Get a single note by id from notes.json.",
  inputSchema: z.object({
    id: z.string().min(1),
  }),
  async execute({ id }) {
    const note = await getNote(id);
    if (!note) return { ok: false, error: `note not found: ${id}` };
    return { ok: true, note };
  },
});

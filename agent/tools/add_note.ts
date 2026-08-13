import { defineTool } from "eve/tools";
import { z } from "zod";
import { addNote } from "@/lib/notes";

export default defineTool({
  description:
    "Add a note to notes.json. Confirm with the user before calling.",
  inputSchema: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    tags: z.array(z.string()).optional(),
  }),
  async execute(input) {
    const note = await addNote(input);
    return { ok: true, note };
  },
});

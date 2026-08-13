import { defineTool } from "eve/tools";
import { z } from "zod";
import { updateNote } from "@/lib/notes";

export default defineTool({
  description:
    "Update an existing note in notes.json by id. Confirm with the user before calling.",
  inputSchema: z.object({
    id: z.string().min(1),
    title: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
  }),
  async execute(input) {
    const note = await updateNote(input);
    return { ok: true, note };
  },
});

import { defineTool } from "eve/tools";
import { z } from "zod";
import { listNotes } from "@/lib/notes";

export default defineTool({
  description:
    "List workspace notes from notes.json, newest first. Optional tag filter and limit.",
  inputSchema: z.object({
    tag: z.string().optional(),
    limit: z.number().int().min(0).optional(),
  }),
  async execute(input) {
    return await listNotes(input);
  },
});

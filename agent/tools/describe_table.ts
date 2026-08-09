import { defineTool } from "eve/tools";
import { z } from "zod";
import { describeTable } from "@/lib/catalog";

export default defineTool({
  description:
    "Describe a table: columns, DuckDB types, first-row samples, and catalog docs. Call before crafting unfamiliar SQL.",
  inputSchema: z.object({
    table: z.string().describe("Table name, e.g. notes"),
  }),
  async execute({ table }) {
    const detail = await describeTable(table);
    if (!detail) return { error: `Unknown table: ${table}` };
    return detail;
  },
});

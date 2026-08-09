import { defineTool } from "eve/tools";
import { z } from "zod";
import { listTablesSummary } from "@/lib/catalog";

export default defineTool({
  description:
    "List workspace tables available to DuckDB (CSV files under the storage prefix) with short catalog descriptions.",
  inputSchema: z.object({}),
  async execute() {
    return await listTablesSummary();
  },
});

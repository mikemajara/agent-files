import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertReadOnlySelect, querySql } from "@/lib/duck";

export default defineTool({
  description:
    "Run a single read-only SQL SELECT/WITH against DuckDB views of workspace CSVs. Max 200 rows returned.",
  inputSchema: z.object({
    sql: z
      .string()
      .describe("One SELECT or WITH statement. No writes, no multiple statements."),
  }),
  async execute({ sql }) {
    assertReadOnlySelect(sql);
    const result = await querySql(sql, 200);
    return {
      columns: result.columns,
      rowCount: result.rows.length,
      rows: result.rows,
    };
  },
});

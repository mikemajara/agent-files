import { NextResponse } from "next/server";
import { buildSchemaCatalog, catalogToSqlSchema } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET() {
  try {
    const catalog = await buildSchemaCatalog();
    return NextResponse.json({
      ...catalog,
      sqlSchema: catalogToSqlSchema(catalog),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

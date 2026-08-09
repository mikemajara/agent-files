import { NextResponse } from "next/server";
import { assertReadOnlySelect, querySql } from "@/lib/duck";
import { storageBackend } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_ROWS = 500;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sql?: string };
    const sql = body.sql?.trim() ?? "";
    assertReadOnlySelect(sql);
    const result = await querySql(sql, MAX_ROWS);
    return NextResponse.json({
      ...result,
      backend: storageBackend(),
      rowLimit: MAX_ROWS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status =
      message.includes("allowed") ||
      message.includes("forbidden") ||
      message.includes("empty") ||
      message.includes("single")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfigError } from "@/lib/supabase/env";
import { isMissingTableError } from "@/lib/setup/list-accounts";

const REQUIRED_TABLES = [
  "profiles",
  "appraisal_cycles",
  "appraisals",
  "kpi_templates",
] as const;

export async function GET() {
  try {
    const configError = getSupabaseConfigError();
    if (configError) {
      return NextResponse.json({ ok: false, error: configError }, { status: 500 });
    }

    const admin = createAdminClient();
    const missing: string[] = [];

    for (const table of REQUIRED_TABLES) {
      const { error } = await admin.from(table).select("id").limit(1);
      if (error && isMissingTableError(error.message)) {
        missing.push(table);
      }
    }

    return NextResponse.json({
      ok: missing.length === 0,
      missingTables: missing,
      hint:
        missing.length > 0
          ? "Open Supabase → SQL Editor → run supabase/schema.sql, then run the migrations in supabase/migrations/, then POST /api/setup/seed."
          : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Could not check database.",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";

const BERP_TABLES = [
  "apps",
  "clock_sessions",
  "leave_requests",
  "staff_updates",
] as const;

export async function GET() {
  const session = await requireProfile();
  if (!session || !canAccessAdmin(session.profile.role, session.profile.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const results: Record<string, { ok: boolean; error?: string }> = {};

    for (const table of BERP_TABLES) {
      const { error } = await admin.from(table).select("*").limit(1);
      results[table] = error
        ? { ok: false, error: error.message }
        : { ok: true };
    }

    const ready = BERP_TABLES.every((t) => results[t].ok);
    return NextResponse.json({ ready, tables: results });
  } catch (error) {
    return NextResponse.json(
      {
        ready: false,
        error:
          error instanceof Error ? error.message : "Could not check tables.",
      },
      { status: 500 }
    );
  }
}

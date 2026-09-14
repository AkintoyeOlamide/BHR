import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessBerp } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { BERP_APP_ID } from "@/lib/berp/app";

function canSendBerpPush(
  session: NonNullable<Awaited<ReturnType<typeof requireProfile>>>
) {
  return canAccessBerp(session.profile.role, session.profile.email);
}

/** Parse `YYYY-MM-DDTHH:mm` as Africa/Lagos wall time → UTC ISO. */
function lagosLocalToUtcIso(local: string): string | null {
  const match = local
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const y = Number(match[1]);
  const mo = Number(match[2]);
  const d = Number(match[3]);
  const h = Number(match[4]);
  const mi = Number(match[5]);
  const s = Number(match[6] ?? "0");
  const asUtcGuess = Date.UTC(y, mo - 1, d, h, mi, s);
  // Lagos is UTC+1 with no DST — subtract 1 hour from wall clock to get UTC.
  return new Date(asUtcGuess - 60 * 60 * 1000).toISOString();
}

export async function POST(request: Request) {
  const session = await requireProfile();
  if (!session || !canSendBerpPush(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    description?: string;
    body?: string;
    scheduled_at?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? body.body ?? "").trim();
  const scheduledRaw = String(body.scheduled_at ?? "").trim();

  if (!title || !description || !scheduledRaw) {
    return NextResponse.json(
      { error: "Title, description, and send time are required." },
      { status: 400 }
    );
  }
  if (title.length > 120) {
    return NextResponse.json(
      { error: "Title must be 120 characters or fewer." },
      { status: 400 }
    );
  }
  if (description.length > 500) {
    return NextResponse.json(
      { error: "Description must be 500 characters or fewer." },
      { status: 400 }
    );
  }

  const scheduledAt = lagosLocalToUtcIso(scheduledRaw);
  if (!scheduledAt) {
    return NextResponse.json(
      { error: "Send time must be YYYY-MM-DDTHH:mm (Lagos)." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("berp_push_messages")
      .insert({
        app_id: BERP_APP_ID,
        kind: "admin",
        title,
        body: description,
        scheduled_at: scheduledAt,
        status: "scheduled",
        created_by: session.profile.id,
      })
      .select(
        "id, kind, title, body, scheduled_at, status, created_at, sent_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not schedule push.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

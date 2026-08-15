import { NextResponse } from "next/server";
import {
  getLearnerSnapshot,
  upsertOnboardingLearner,
} from "@/lib/onboarding/server";
import { getSupabaseConfigError } from "@/lib/supabase/env";

export async function POST(request: Request) {
  try {
    const configError = getSupabaseConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const body = await request.json();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim();

    if (fullName.length < 2) {
      return NextResponse.json(
        { error: "Enter your full name." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid work email." },
        { status: 400 }
      );
    }

    const learner = await upsertOnboardingLearner({ fullName, email });
    const snapshot = await getLearnerSnapshot(learner.id);

    return NextResponse.json({ ok: true, ...snapshot });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start onboarding session.";
    if (message === "SUPABASE_ADMIN_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Server is missing Supabase admin configuration." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const configError = getSupabaseConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const learnerId = String(searchParams.get("learnerId") ?? "").trim();
    if (!learnerId) {
      return NextResponse.json(
        { error: "Missing learnerId." },
        { status: 400 }
      );
    }

    const snapshot = await getLearnerSnapshot(learnerId);
    if (!snapshot) {
      return NextResponse.json({ error: "Learner not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...snapshot });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not load onboarding progress.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

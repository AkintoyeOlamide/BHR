import { NextResponse } from "next/server";
import {
  completeOnboardingLesson,
  touchLearnerLocation,
} from "@/lib/onboarding/server";
import { getSupabaseConfigError } from "@/lib/supabase/env";

export async function POST(request: Request) {
  try {
    const configError = getSupabaseConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const body = await request.json();
    const learnerId = String(body.learnerId ?? "").trim();
    const email = String(body.email ?? "").trim();
    const departmentId = String(body.departmentId ?? "").trim();
    const lessonId = String(body.lessonId ?? "").trim();
    const action = String(body.action ?? "view").trim();

    if (!learnerId || !email || !departmentId || !lessonId) {
      return NextResponse.json(
        { error: "Missing progress fields." },
        { status: 400 }
      );
    }

    const snapshot =
      action === "complete_lesson"
        ? await completeOnboardingLesson({
            learnerId,
            email,
            departmentId,
            lessonId,
          })
        : await touchLearnerLocation({
            learnerId,
            email,
            departmentId,
            lessonId,
          });

    if (!snapshot) {
      return NextResponse.json({ error: "Learner not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...snapshot });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not update progress.";
    if (message === "LEARNER_NOT_FOUND") {
      return NextResponse.json({ error: "Learner not found." }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessManager } from "@/lib/auth/roles";

const TEMPLATE_ID = "default";

export async function GET() {
  const session = await requireProfile();
  if (!session || !canAccessManager(session.profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("kpi_templates")
      .select("goals, strengths, areas_for_improvement, development_plan")
      .eq("id", TEMPLATE_ID)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ template: getDefaultTemplate() });
    }

    return NextResponse.json({
      template: {
        goals: data.goals ?? "",
        strengths: data.strengths ?? "",
        areas_for_improvement: data.areas_for_improvement ?? "",
        development_plan: data.development_plan ?? "",
      },
    });
  } catch {
    return NextResponse.json({ template: getDefaultTemplate() });
  }
}

export async function PUT(request: Request) {
  const session = await requireProfile();
  if (!session || !canAccessManager(session.profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("kpi_templates")
      .select("id")
      .eq("id", TEMPLATE_ID)
      .maybeSingle();

    const payload = {
      goals: body.goals ?? "",
      strengths: body.strengths ?? "",
      areas_for_improvement: body.areas_for_improvement ?? "",
      development_plan: body.development_plan ?? "",
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await admin.from("kpi_templates").update(payload).eq("id", TEMPLATE_ID)
      : await admin.from("kpi_templates").insert({ id: TEMPLATE_ID, ...payload });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save dev plan template. Run supabase/migrations/005_dev_plan_template.sql",
      },
      { status: 500 }
    );
  }
}

function getDefaultTemplate() {
  return {
    goals: "",
    strengths: "",
    areas_for_improvement: "",
    development_plan: "",
  };
}

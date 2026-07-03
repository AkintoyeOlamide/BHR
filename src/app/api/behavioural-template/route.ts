import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessManager } from "@/lib/auth/roles";
import {
  BEHAVIOURAL_SECTION_WEIGHT_DEFAULT,
  calculateBehaviouralOverallRating,
  calculateBehaviouralSectionActual,
  calculateBehaviouralTotalWeight,
  createDefaultBehaviouralRows,
  isBehaviouralWeightOverLimit,
  type BehaviouralRow,
} from "@/lib/behavioural/calculations";

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
      .select("behavioural_section_weight, behavioural_items")
      .eq("id", TEMPLATE_ID)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ template: getDefaultTemplate() });
    }

    return NextResponse.json({
      template: {
        behavioural_section_weight:
          Number(data.behavioural_section_weight) ||
          BEHAVIOURAL_SECTION_WEIGHT_DEFAULT,
        behavioural_items: (data.behavioural_items as BehaviouralRow[])?.length
          ? (data.behavioural_items as BehaviouralRow[])
          : createDefaultBehaviouralRows(1),
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
  const items: BehaviouralRow[] = body.behavioural_items ?? [];

  if (isBehaviouralWeightOverLimit(items)) {
    return NextResponse.json(
      {
        error: `Total behavioural weight cannot exceed 100%. Current total: ${calculateBehaviouralTotalWeight(items).toFixed(2)}%`,
      },
      { status: 400 }
    );
  }

  const sectionWeight =
    body.behavioural_section_weight ?? BEHAVIOURAL_SECTION_WEIGHT_DEFAULT;
  const overallRating = calculateBehaviouralOverallRating(items);
  const sectionActual = calculateBehaviouralSectionActual(
    overallRating,
    sectionWeight
  );

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("kpi_templates")
      .select("id")
      .eq("id", TEMPLATE_ID)
      .maybeSingle();

    const payload = {
      behavioural_section_weight: sectionWeight,
      behavioural_items: items,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await admin.from("kpi_templates").update(payload).eq("id", TEMPLATE_ID)
      : await admin.from("kpi_templates").insert({ id: TEMPLATE_ID, ...payload });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      behavioural_overall_rating: overallRating,
      behavioural_section_actual: sectionActual,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save behavioural template. Run supabase/migrations/004_behavioural_assessment.sql",
      },
      { status: 500 }
    );
  }
}

function getDefaultTemplate() {
  return {
    behavioural_section_weight: BEHAVIOURAL_SECTION_WEIGHT_DEFAULT,
    behavioural_items: createDefaultBehaviouralRows(1),
  };
}

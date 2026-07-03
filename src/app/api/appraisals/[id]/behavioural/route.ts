import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { canManageAppraisal } from "@/lib/auth/hr-access";
import {
  BEHAVIOURAL_SECTION_WEIGHT_DEFAULT,
  calculateBehaviouralOverallRating,
  calculateBehaviouralSectionActual,
  calculateBehaviouralTotalWeight,
  isBehaviouralWeightOverLimit,
  type BehaviouralRow,
} from "@/lib/behavioural/calculations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: appraisal } = await supabase
    .from("appraisals")
    .select(
      "id, employee_id, reviewer_id, behavioural_section_weight, behavioural_overall_rating, behavioural_section_actual"
    )
    .eq("id", id)
    .single();

  if (!appraisal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = appraisal.employee_id === session.profile.id;
  const isManager = canManageAppraisal(session.profile, appraisal);

  if (!isOwner && !isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: items, error } = await supabase
    .from("appraisal_behavioural_items")
    .select("*")
    .eq("appraisal_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appraisal, items: items ?? [] });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createClient();

  const { data: appraisal } = await supabase
    .from("appraisals")
    .select("employee_id, status, reviewer_id, kpi_section_actual")
    .eq("id", id)
    .single();

  if (!appraisal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = appraisal.employee_id === session.profile.id;
  const isManager = canManageAppraisal(session.profile, appraisal);

  if (!isManager && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items: BehaviouralRow[] = body.behavioural_items ?? [];

  if (isManager) {
    if (isBehaviouralWeightOverLimit(items)) {
      return NextResponse.json(
        {
          error: `Total behavioural weight cannot exceed 100%. Current total: ${calculateBehaviouralTotalWeight(items).toFixed(2)}%`,
        },
        { status: 400 }
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 behavioural items allowed." },
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
    const kpiSectionActual = Number(appraisal.kpi_section_actual) || 0;
    const combinedScore = kpiSectionActual + sectionActual;

    await supabase
      .from("appraisal_behavioural_items")
      .delete()
      .eq("appraisal_id", id);

    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from("appraisal_behavioural_items")
        .insert(
          items.map((item, index) => ({
            appraisal_id: id,
            sort_order: index + 1,
            key_measurement: item.key_measurement,
            weight: item.weight,
            rating: item.rating,
            comments: item.comments,
          }))
        );

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    const { error: updateError } = await supabase
      .from("appraisals")
      .update({
        behavioural_section_weight: sectionWeight,
        behavioural_overall_rating: overallRating,
        behavioural_section_actual: sectionActual,
        overall_score: combinedScore,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    for (const item of items) {
      if (!item.id) continue;
      await supabase
        .from("appraisal_behavioural_items")
        .update({ comments: item.comments })
        .eq("id", item.id)
        .eq("appraisal_id", id);
    }
  }

  const { data: savedItems } = await supabase
    .from("appraisal_behavioural_items")
    .select("*")
    .eq("appraisal_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ok: true, items: savedItems });
}

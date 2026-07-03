import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { canManageAppraisal } from "@/lib/auth/hr-access";
import {
  calculateKpiOverallRating,
  calculateKpiSectionActual,
  calculateTotalWeight,
  isWeightOverLimit,
  type KpiRow,
} from "@/lib/kpi/calculations";

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
      "id, employee_id, reviewer_id, appraiser_name, time_in_present_position, kpi_section_weight, kpi_overall_rating, kpi_section_actual, department, job_title, review_period"
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

  const { data: kpis, error } = await supabase
    .from("appraisal_kpis")
    .select("*")
    .eq("appraisal_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appraisal, kpis: kpis ?? [] });
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
    .select("employee_id, status, reviewer_id, behavioural_section_actual")
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

  const kpis: KpiRow[] = body.kpis ?? [];

  if (isManager) {
    if (isWeightOverLimit(kpis)) {
      return NextResponse.json(
        {
          error: `Total KPI weight cannot exceed 100%. Current total: ${calculateTotalWeight(kpis).toFixed(2)}%`,
        },
        { status: 400 }
      );
    }

    if (kpis.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 KPIs allowed." },
        { status: 400 }
      );
    }

    const sectionWeight = body.kpi_section_weight ?? 80;
    const overallRating = calculateKpiOverallRating(kpis);
    const sectionActual = calculateKpiSectionActual(overallRating, sectionWeight);
    const behaviouralSectionActual =
      Number(appraisal.behavioural_section_actual) || 0;

    await supabase.from("appraisal_kpis").delete().eq("appraisal_id", id);

    if (kpis.length > 0) {
      const { error: insertError } = await supabase.from("appraisal_kpis").insert(
        kpis.map((kpi, index) => ({
          appraisal_id: id,
          sort_order: index + 1,
          task: kpi.task,
          weight: kpi.weight,
          rating: kpi.rating,
          measurement_area: kpi.measurement_area,
        }))
      );

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    const { error: updateError } = await supabase
      .from("appraisals")
      .update({
        appraiser_name: body.appraiser_name,
        time_in_present_position: body.time_in_present_position,
        department: body.department,
        job_title: body.job_title,
        review_period: body.review_period,
        kpi_section_weight: sectionWeight,
        kpi_overall_rating: overallRating,
        kpi_section_actual: sectionActual,
        overall_score: sectionActual + behaviouralSectionActual,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    for (const kpi of kpis) {
      if (!kpi.id) continue;
      await supabase
        .from("appraisal_kpis")
        .update({ measurement_area: kpi.measurement_area })
        .eq("id", kpi.id)
        .eq("appraisal_id", id);
    }
  }

  const { data: savedKpis } = await supabase
    .from("appraisal_kpis")
    .select("*")
    .eq("appraisal_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ok: true, kpis: savedKpis });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessManager } from "@/lib/auth/roles";
import {
  calculateKpiOverallRating,
  calculateKpiSectionActual,
  calculateTotalWeight,
  createDefaultKpiRows,
  isWeightOverLimit,
  type KpiRow,
} from "@/lib/kpi/calculations";

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
      .select("*")
      .eq("id", TEMPLATE_ID)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ template: getDefaultTemplate() });
    }

    return NextResponse.json({
      template: {
        appraisee_name: data.appraisee_name ?? "",
        appraiser_name: data.appraiser_name ?? "",
        department: data.department ?? "",
        job_title: data.job_title ?? "",
        review_period: data.review_period ?? "",
        time_in_present_position: data.time_in_present_position ?? "",
        kpi_section_weight: Number(data.kpi_section_weight) || 80,
        kpis: (data.kpis as KpiRow[])?.length
          ? (data.kpis as KpiRow[])
          : createDefaultKpiRows(1),
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
  const kpis: KpiRow[] = body.kpis ?? [];

  if (isWeightOverLimit(kpis)) {
    return NextResponse.json(
      {
        error: `Total KPI weight cannot exceed 100%. Current total: ${calculateTotalWeight(kpis).toFixed(2)}%`,
      },
      { status: 400 }
    );
  }

  const sectionWeight = body.kpi_section_weight ?? 80;
  const overallRating = calculateKpiOverallRating(kpis);
  const sectionActual = calculateKpiSectionActual(overallRating, sectionWeight);

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("kpi_templates").upsert({
      id: TEMPLATE_ID,
      appraisee_name: body.appraisee_name ?? "",
      appraiser_name: body.appraiser_name ?? "",
      department: body.department ?? "",
      job_title: body.job_title ?? "",
      review_period: body.review_period ?? "",
      time_in_present_position: body.time_in_present_position ?? "",
      kpi_section_weight: sectionWeight,
      kpis,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      kpi_overall_rating: overallRating,
      kpi_section_actual: sectionActual,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not save template. Run supabase/migrations/003_kpi_template.sql" },
      { status: 500 }
    );
  }
}

function getDefaultTemplate() {
  return {
    appraisee_name: "",
    appraiser_name: "",
    department: "",
    job_title: "",
    review_period: "",
    time_in_present_position: "",
    kpi_section_weight: 80,
    kpis: createDefaultKpiRows(1),
  };
}

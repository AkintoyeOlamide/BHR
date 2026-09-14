import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { canManageAppraisal, canEditManagerRating, isFullHrSession } from "@/lib/auth/hr-access";
import {
  calculateKpiOverallRating,
  calculateKpiSectionActual,
  calculateTotalWeight,
  isValidOptionalRating,
  isWeightOverLimit,
  parseRatingValue,
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
  const isManager = canManageAppraisal(
    session.profile,
    appraisal,
    session.user.id
  );

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
    .select(
      "employee_id, status, reviewer_id, behavioural_section_actual, kpi_section_weight"
    )
    .eq("id", id)
    .single();

  if (!appraisal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = appraisal.employee_id === session.profile.id;
  const isManager = canManageAppraisal(
    session.profile,
    appraisal,
    session.user.id
  );

  if (!isManager && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    isOwner &&
    !isManager &&
    (appraisal.status === "submitted" || appraisal.status === "completed")
  ) {
    return NextResponse.json(
      {
        error:
          "Your ratings are locked while with your manager or after submit to HR. You can still view manager ratings.",
      },
      { status: 400 }
    );
  }

  const kpis: KpiRow[] = body.kpis ?? [];
  const mayEditManagerRating = canEditManagerRating(
    session.profile,
    appraisal,
    session.user.id
  );
  const fullHr = isFullHrSession(session);

  // Assigned line manager: update manager_rating only (never wipe staff rows).
  if (isManager && mayEditManagerRating && !fullHr) {
    const admin = createAdminClient();

    for (const kpi of kpis) {
      if (!kpi.id) continue;
      const managerRating = parseRatingValue(kpi.manager_rating);
      if (!isValidOptionalRating(managerRating)) {
        return NextResponse.json(
          { error: "Manager rating must be between 1 and 5." },
          { status: 400 }
        );
      }
      const { error: ratingError } = await admin
        .from("appraisal_kpis")
        .update({ manager_rating: managerRating })
        .eq("id", kpi.id)
        .eq("appraisal_id", id);

      if (ratingError) {
        return NextResponse.json(
          { error: ratingError.message },
          { status: 500 }
        );
      }
    }

    const { data: savedForScore } = await admin
      .from("appraisal_kpis")
      .select("*")
      .eq("appraisal_id", id)
      .order("sort_order", { ascending: true });

    const scoredRows: KpiRow[] = (savedForScore ?? []).map((row) => ({
      id: row.id,
      sort_order: row.sort_order,
      task: row.task,
      weight: Number(row.weight) || 0,
      rating: row.rating == null ? null : Number(row.rating),
      manager_rating:
        row.manager_rating == null ? null : Number(row.manager_rating),
      measurement_area: row.measurement_area ?? "",
    }));

    const sectionWeight = Number(appraisal.kpi_section_weight) || 80;
    const overallRating = calculateKpiOverallRating(scoredRows);
    const sectionActual = calculateKpiSectionActual(
      overallRating,
      sectionWeight
    );
    const behaviouralSectionActual =
      Number(appraisal.behavioural_section_actual) || 0;

    const { error: updateError } = await admin
      .from("appraisals")
      .update({
        kpi_overall_rating: overallRating,
        kpi_section_actual: sectionActual,
        overall_score: sectionActual + behaviouralSectionActual,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, kpis: savedForScore ?? [] });
  }

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

    for (const kpi of kpis) {
      const staffRating = parseRatingValue(kpi.rating);
      const managerRating = parseRatingValue(kpi.manager_rating);
      if (
        !isValidOptionalRating(staffRating) ||
        !isValidOptionalRating(managerRating)
      ) {
        return NextResponse.json(
          { error: "Ratings must be between 1 and 5." },
          { status: 400 }
        );
      }
    }

    const mayEditManagerRating = canEditManagerRating(
      session.profile,
      appraisal,
      session.user.id
    );

    const admin = createAdminClient();
    const { data: existingKpis } = await admin
      .from("appraisal_kpis")
      .select("id, manager_rating")
      .eq("appraisal_id", id);

    const existingManagerRatingById = new Map(
      (existingKpis ?? []).map((row) => [
        row.id as string,
        row.manager_rating == null ? null : Number(row.manager_rating),
      ])
    );

    const rowsToSave: KpiRow[] = kpis.map((kpi, index) => {
      const staffRating = parseRatingValue(kpi.rating);
      let managerRating = parseRatingValue(kpi.manager_rating);
      if (!mayEditManagerRating) {
        managerRating =
          kpi.id && existingManagerRatingById.has(kpi.id)
            ? existingManagerRatingById.get(kpi.id) ?? null
            : null;
      }
      return {
        id: kpi.id,
        sort_order: index + 1,
        task: kpi.task,
        weight: kpi.weight,
        rating: staffRating,
        manager_rating: managerRating,
        measurement_area: kpi.measurement_area,
      };
    });

    const sectionWeight = body.kpi_section_weight ?? 80;
    const overallRating = calculateKpiOverallRating(rowsToSave);
    const sectionActual = calculateKpiSectionActual(overallRating, sectionWeight);
    const behaviouralSectionActual =
      Number(appraisal.behavioural_section_actual) || 0;

    await admin.from("appraisal_kpis").delete().eq("appraisal_id", id);

    if (rowsToSave.length > 0) {
      const { error: insertError } = await admin.from("appraisal_kpis").insert(
        rowsToSave.map((kpi) => ({
          appraisal_id: id,
          sort_order: kpi.sort_order,
          task: kpi.task,
          weight: kpi.weight,
          rating: kpi.rating,
          manager_rating: kpi.manager_rating,
          measurement_area: kpi.measurement_area,
        }))
      );

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    const { error: updateError } = await admin
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
    // Employee: only rating can be changed. Use admin client so RLS cannot block.
    const admin = createAdminClient();

    for (const kpi of kpis) {
      if (!kpi.id) continue;
      const rating = parseRatingValue(kpi.rating);
      if (!isValidOptionalRating(rating)) {
        return NextResponse.json(
          { error: "Staff rating must be between 1 and 5." },
          { status: 400 }
        );
      }
      const { error: ratingError } = await admin
        .from("appraisal_kpis")
        .update({ rating })
        .eq("id", kpi.id)
        .eq("appraisal_id", id);

      if (ratingError) {
        return NextResponse.json(
          { error: ratingError.message },
          { status: 500 }
        );
      }
    }

    const { data: savedForScore } = await admin
      .from("appraisal_kpis")
      .select("*")
      .eq("appraisal_id", id)
      .order("sort_order", { ascending: true });

    const scoredRows: KpiRow[] = (savedForScore ?? []).map((row) => ({
      id: row.id,
      sort_order: row.sort_order,
      task: row.task,
      weight: Number(row.weight) || 0,
      rating: row.rating == null ? null : Number(row.rating),
      manager_rating:
        row.manager_rating == null ? null : Number(row.manager_rating),
      measurement_area: row.measurement_area ?? "",
    }));

    const sectionWeight = Number(appraisal.kpi_section_weight) || 80;
    const overallRating = calculateKpiOverallRating(scoredRows);
    const sectionActual = calculateKpiSectionActual(
      overallRating,
      sectionWeight
    );
    const behaviouralSectionActual =
      Number(appraisal.behavioural_section_actual) || 0;

    const { error: updateError } = await admin
      .from("appraisals")
      .update({
        kpi_overall_rating: overallRating,
        kpi_section_actual: sectionActual,
        overall_score: sectionActual + behaviouralSectionActual,
        status:
          appraisal.status === "not_started" ? "in_progress" : appraisal.status,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const { data: savedKpis } = await supabase
    .from("appraisal_kpis")
    .select("*")
    .eq("appraisal_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ok: true, kpis: savedKpis });
}

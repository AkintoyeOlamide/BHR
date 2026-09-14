import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { canManageAppraisal, canEditManagerRating, isFullHrSession } from "@/lib/auth/hr-access";
import {
  BEHAVIOURAL_SECTION_WEIGHT_DEFAULT,
  calculateBehaviouralOverallRating,
  calculateBehaviouralSectionActual,
  calculateBehaviouralTotalWeight,
  isBehaviouralWeightOverLimit,
  isValidOptionalBehaviouralRating,
  parseBehaviouralRatingValue,
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
  const isManager = canManageAppraisal(
    session.profile,
    appraisal,
    session.user.id
  );

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
    .select(
      "employee_id, status, reviewer_id, kpi_section_actual, behavioural_section_weight"
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

  const items: BehaviouralRow[] = body.behavioural_items ?? [];
  const mayEditManagerRating = canEditManagerRating(
    session.profile,
    appraisal,
    session.user.id
  );
  const fullHr = isFullHrSession(session);

  // Assigned line manager: update manager_rating only.
  if (isManager && mayEditManagerRating && !fullHr) {
    const admin = createAdminClient();

    for (const item of items) {
      if (!item.id) continue;
      const managerRating = parseBehaviouralRatingValue(item.manager_rating);
      if (!isValidOptionalBehaviouralRating(managerRating)) {
        return NextResponse.json(
          { error: "Manager rating must be between 1 and 5." },
          { status: 400 }
        );
      }
      const { error: ratingError } = await admin
        .from("appraisal_behavioural_items")
        .update({ manager_rating: managerRating })
        .eq("id", item.id)
        .eq("appraisal_id", id);

      if (ratingError) {
        return NextResponse.json(
          { error: ratingError.message },
          { status: 500 }
        );
      }
    }

    const { data: savedForScore } = await admin
      .from("appraisal_behavioural_items")
      .select("*")
      .eq("appraisal_id", id)
      .order("sort_order", { ascending: true });

    const scoredRows: BehaviouralRow[] = (savedForScore ?? []).map((row) => ({
      id: row.id,
      sort_order: row.sort_order,
      key_measurement: row.key_measurement,
      weight: Number(row.weight) || 0,
      rating: row.rating == null ? null : Number(row.rating),
      manager_rating:
        row.manager_rating == null ? null : Number(row.manager_rating),
      comments: row.comments ?? "",
    }));

    const sectionWeight =
      Number(appraisal.behavioural_section_weight) ||
      BEHAVIOURAL_SECTION_WEIGHT_DEFAULT;
    const overallRating = calculateBehaviouralOverallRating(scoredRows);
    const sectionActual = calculateBehaviouralSectionActual(
      overallRating,
      sectionWeight
    );
    const kpiSectionActual = Number(appraisal.kpi_section_actual) || 0;

    const { error: updateError } = await admin
      .from("appraisals")
      .update({
        behavioural_overall_rating: overallRating,
        behavioural_section_actual: sectionActual,
        overall_score: kpiSectionActual + sectionActual,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: savedForScore ?? [] });
  }

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

    for (const item of items) {
      const staffRating = parseBehaviouralRatingValue(item.rating);
      const managerRating = parseBehaviouralRatingValue(item.manager_rating);
      if (
        !isValidOptionalBehaviouralRating(staffRating) ||
        !isValidOptionalBehaviouralRating(managerRating)
      ) {
        return NextResponse.json(
          { error: "Ratings must be between 1 and 5." },
          { status: 400 }
        );
      }
    }

    const mayEditManagerRatingOnStructure = canEditManagerRating(
      session.profile,
      appraisal,
      session.user.id
    );

    const admin = createAdminClient();
    const { data: existingItems } = await admin
      .from("appraisal_behavioural_items")
      .select("id, manager_rating")
      .eq("appraisal_id", id);

    const existingManagerRatingById = new Map(
      (existingItems ?? []).map((row) => [
        row.id as string,
        row.manager_rating == null ? null : Number(row.manager_rating),
      ])
    );

    const rowsToSave: BehaviouralRow[] = items.map((item, index) => {
      const staffRating = parseBehaviouralRatingValue(item.rating);
      let managerRating = parseBehaviouralRatingValue(item.manager_rating);
      if (!mayEditManagerRatingOnStructure) {
        managerRating =
          item.id && existingManagerRatingById.has(item.id)
            ? existingManagerRatingById.get(item.id) ?? null
            : null;
      }
      return {
        id: item.id,
        sort_order: index + 1,
        key_measurement: item.key_measurement,
        weight: item.weight,
        rating: staffRating,
        manager_rating: managerRating,
        comments: item.comments,
      };
    });

    const sectionWeight =
      body.behavioural_section_weight ?? BEHAVIOURAL_SECTION_WEIGHT_DEFAULT;
    const overallRating = calculateBehaviouralOverallRating(rowsToSave);
    const sectionActual = calculateBehaviouralSectionActual(
      overallRating,
      sectionWeight
    );
    const kpiSectionActual = Number(appraisal.kpi_section_actual) || 0;
    const combinedScore = kpiSectionActual + sectionActual;

    await admin
      .from("appraisal_behavioural_items")
      .delete()
      .eq("appraisal_id", id);

    if (rowsToSave.length > 0) {
      const { error: insertError } = await admin
        .from("appraisal_behavioural_items")
        .insert(
          rowsToSave.map((item) => ({
            appraisal_id: id,
            sort_order: item.sort_order,
            key_measurement: item.key_measurement,
            weight: item.weight,
            rating: item.rating,
            manager_rating: item.manager_rating,
            comments: item.comments,
          }))
        );

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    const { error: updateError } = await admin
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
    // Employee: only rating can be changed. Use admin client so RLS cannot block.
    const admin = createAdminClient();

    for (const item of items) {
      if (!item.id) continue;
      const rating = parseBehaviouralRatingValue(item.rating);
      if (!isValidOptionalBehaviouralRating(rating)) {
        return NextResponse.json(
          { error: "Staff rating must be between 1 and 5." },
          { status: 400 }
        );
      }
      const { error: ratingError } = await admin
        .from("appraisal_behavioural_items")
        .update({ rating })
        .eq("id", item.id)
        .eq("appraisal_id", id);

      if (ratingError) {
        return NextResponse.json(
          { error: ratingError.message },
          { status: 500 }
        );
      }
    }

    const { data: savedForScore } = await admin
      .from("appraisal_behavioural_items")
      .select("*")
      .eq("appraisal_id", id)
      .order("sort_order", { ascending: true });

    const scoredRows: BehaviouralRow[] = (savedForScore ?? []).map((row) => ({
      id: row.id,
      sort_order: row.sort_order,
      key_measurement: row.key_measurement,
      weight: Number(row.weight) || 0,
      rating: row.rating == null ? null : Number(row.rating),
      manager_rating:
        row.manager_rating == null ? null : Number(row.manager_rating),
      comments: row.comments ?? "",
    }));

    const sectionWeight =
      Number(appraisal.behavioural_section_weight) ||
      BEHAVIOURAL_SECTION_WEIGHT_DEFAULT;
    const overallRating = calculateBehaviouralOverallRating(scoredRows);
    const sectionActual = calculateBehaviouralSectionActual(
      overallRating,
      sectionWeight
    );
    const kpiSectionActual = Number(appraisal.kpi_section_actual) || 0;

    const { error: updateError } = await admin
      .from("appraisals")
      .update({
        behavioural_overall_rating: overallRating,
        behavioural_section_actual: sectionActual,
        overall_score: kpiSectionActual + sectionActual,
        status:
          appraisal.status === "not_started" ? "in_progress" : appraisal.status,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const { data: savedItems } = await supabase
    .from("appraisal_behavioural_items")
    .select("*")
    .eq("appraisal_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ ok: true, items: savedItems });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { canManageAppraisal, isFullHrSession } from "@/lib/auth/hr-access";
import { resolveLineManagerReviewer } from "@/lib/auth/resolve-line-manager";
import { notifyHrAppraisalComplete } from "@/lib/email/notify-hr-appraisal-complete";
import { notifyManagerStaffReady } from "@/lib/email/notify-manager-staff-ready";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appraisals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  let appraisal = data;
  if (error || !appraisal) {
    try {
      const admin = createAdminClient();
      const { data: adminRow } = await admin
        .from("appraisals")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      appraisal = adminRow;
    } catch {
      appraisal = null;
    }
  }

  if (!appraisal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = appraisal.employee_id === session.user.id;
  const isManager = canManageAppraisal(
    session.profile,
    appraisal,
    session.user.id
  );

  if (!isOwner && !isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ appraisal });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createClient();

  let existing = (
    await supabase
      .from("appraisals")
      .select(
        "employee_id, status, reviewer_id, review_period, cycle_id, appraiser_name, rating_label, overall_score, manager_comments"
      )
      .eq("id", id)
      .maybeSingle()
  ).data;

  if (!existing) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("appraisals")
        .select(
          "employee_id, status, reviewer_id, review_period, cycle_id, appraiser_name, rating_label, overall_score, manager_comments"
        )
        .eq("id", id)
        .maybeSingle();
      existing = data;
    } catch {
      existing = null;
    }
  }

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = existing.employee_id === session.user.id;
  const isManager = canManageAppraisal(
    session.profile,
    existing,
    session.user.id
  );

  if (!isOwner && !isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isOwner && existing.status === "completed") {
    return NextResponse.json(
      { error: "This appraisal has already been submitted to HR." },
      { status: 400 }
    );
  }

  if (
    isOwner &&
    body.status &&
    body.status !== "submitted" &&
    body.status !== "completed"
  ) {
    return NextResponse.json(
      {
        error:
          "Employees can assign to their manager, or submit to HR after manager ratings.",
      },
      { status: 400 }
    );
  }

  if (
    isOwner &&
    body.status === "submitted" &&
    existing.status !== "not_started" &&
    existing.status !== "in_progress" &&
    existing.status !== "submitted"
  ) {
    return NextResponse.json(
      { error: "This appraisal cannot be assigned from its current status." },
      { status: 400 }
    );
  }

  if (isManager && body.status === "completed") {
    return NextResponse.json(
      {
        error:
          "Save your manager ratings only. The employee reviews them and submits to HR.",
      },
      { status: 400 }
    );
  }

  const employeeFields = [
    "goals",
    "achievements",
    "strengths",
    "areas_for_improvement",
    "development_plan",
    "employee_self_review",
    "status",
  ] as const;

  const managerFields = [
    "manager_comments",
    "overall_score",
    "rating_label",
    "status",
    "review_period",
    "job_title",
    "department",
  ] as const;

  const staffOnlyDevPlanFields = [
    "goals",
    "achievements",
    "strengths",
    "areas_for_improvement",
    "development_plan",
    "employee_self_review",
  ] as const;

  // Dev plan is staff-owned — managers/HR cannot change it after staff saves.
  if (!isOwner) {
    for (const key of staffOnlyDevPlanFields) {
      if (key in body) {
        return NextResponse.json(
          {
            error:
              "Only the employee can edit the development plan. After they save it, it is locked for everyone else including HR.",
          },
          { status: 403 }
        );
      }
    }
  }

  if (
    isOwner &&
    staffOnlyDevPlanFields.some((key) => key in body) &&
    (existing.status === "submitted" || existing.status === "completed")
  ) {
    return NextResponse.json(
      {
        error:
          "Your development plan is locked after assignment to your manager.",
      },
      { status: 400 }
    );
  }

  const allowed = isManager ? managerFields : employeeFields;
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  let managerForNotify: {
    id: string;
    full_name: string;
    email: string;
  } | null = null;
  let managerChanged = false;
  const isFirstAssignToManager =
    isOwner &&
    body.status === "submitted" &&
    existing.status !== "submitted" &&
    existing.status !== "completed";

  if (body.status === "submitted" && isOwner) {
    if (existing.status === "completed") {
      return NextResponse.json(
        {
          error:
            "This appraisal was already submitted to HR. The manager can no longer be changed.",
        },
        { status: 400 }
      );
    }

    updates.status = "submitted";
    if (isFirstAssignToManager) {
      updates.submitted_at = new Date().toISOString();
    }

    try {
      const admin = createAdminClient();
      const requestedManagerId =
        typeof body.manager_id === "string" && body.manager_id.trim()
          ? body.manager_id.trim()
          : typeof body.reviewer_id === "string" && body.reviewer_id.trim()
            ? body.reviewer_id.trim()
            : null;

      let reviewerId = requestedManagerId;

      if (!reviewerId) {
        reviewerId = existing.reviewer_id as string | null;
      }

      if (!reviewerId) {
        const { data: employeeProfile } = await admin
          .from("profiles")
          .select("manager_id")
          .eq("id", existing.employee_id)
          .maybeSingle();
        reviewerId = (employeeProfile?.manager_id as string | null) ?? null;
      }

      if (!reviewerId) {
        return NextResponse.json(
          {
            error: "Select your manager before assigning the appraisal.",
          },
          { status: 400 }
        );
      }

      if (reviewerId === existing.employee_id) {
        return NextResponse.json(
          { error: "You cannot assign the appraisal to yourself." },
          { status: 400 }
        );
      }

      const resolved = await resolveLineManagerReviewer(reviewerId);
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: 400 });
      }

      const manager = resolved.manager;
      reviewerId = manager.id;

      if (reviewerId === existing.employee_id) {
        return NextResponse.json(
          { error: "You cannot assign the appraisal to yourself." },
          { status: 400 }
        );
      }

      const previousReviewerId = (existing.reviewer_id as string | null) ?? null;
      managerChanged =
        !previousReviewerId || previousReviewerId !== reviewerId;

      if (
        existing.status === "submitted" &&
        previousReviewerId &&
        !managerChanged
      ) {
        return NextResponse.json(
          {
            error: "This appraisal is already assigned to that manager.",
            managerName: manager.full_name,
          },
          { status: 400 }
        );
      }

      updates.reviewer_id = reviewerId;
      updates.appraiser_name = manager.full_name || existing.appraiser_name;

      // Remember the choice for future appraisals.
      await admin
        .from("profiles")
        .update({ manager_id: reviewerId })
        .eq("id", existing.employee_id);

      managerForNotify = {
        id: reviewerId,
        full_name: manager.full_name || "Manager",
        email: manager.email,
      };
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Could not resolve your manager for assignment.",
        },
        { status: 500 }
      );
    }
  }

  const isFirstSubmitToHr =
    isOwner &&
    body.status === "completed" &&
    existing.status === "submitted";

  if (body.status === "completed" && isOwner) {
    if (existing.status !== "submitted") {
      return NextResponse.json(
        {
          error:
            "Assign this appraisal to your manager and wait for their ratings before submitting to HR.",
        },
        { status: 400 }
      );
    }

    try {
      const admin = createAdminClient();
      const [{ data: kpis }, { data: behavioural }] = await Promise.all([
        admin
          .from("appraisal_kpis")
          .select("manager_rating")
          .eq("appraisal_id", id),
        admin
          .from("appraisal_behavioural_items")
          .select("manager_rating")
          .eq("appraisal_id", id),
      ]);

      const kpiRows = kpis ?? [];
      const behaviouralRows = behavioural ?? [];
      const kpiDone =
        kpiRows.length === 0 ||
        kpiRows.every((row) => row.manager_rating != null);
      const behaviouralDone =
        behaviouralRows.length === 0 ||
        behaviouralRows.every((row) => row.manager_rating != null);

      if (!kpiDone || !behaviouralDone) {
        return NextResponse.json(
          {
            error:
              "Your manager has not finished rating every Technical and Behavioural row yet.",
          },
          { status: 400 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Could not verify manager ratings.",
        },
        { status: 500 }
      );
    }

    updates.status = "completed";
    updates.completed_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update." },
      { status: 400 }
    );
  }

  let data = null;
  let error = null;

  // Prefer admin update for staff→manager assign so reviewer_id writes reliably.
  const preferAdmin =
    isFirstAssignToManager || Boolean(updates.reviewer_id);

  if (!preferAdmin) {
    const sessionUpdate = await supabase
      .from("appraisals")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    data = sessionUpdate.data;
    error = sessionUpdate.error;
  }

  if (preferAdmin || error || !data) {
    try {
      const admin = createAdminClient();
      const adminUpdate = await admin
        .from("appraisals")
        .update(updates)
        .eq("id", id)
        .select()
        .maybeSingle();
      data = adminUpdate.data;
      error = adminUpdate.error;
    } catch (err) {
      error = { message: err instanceof Error ? err.message : "Update failed" };
    }
  }

  if (error || !data) {
    const raw = error?.message ?? "Could not update appraisal.";
    const friendly = raw.includes("appraisals_reviewer_id_fkey")
      ? "Could not assign that manager because their account is incomplete. Ask HR to open Staff → Make manager again for them, then retry."
      : raw;
    return NextResponse.json({ error: friendly }, { status: 500 });
  }

  let managerNotified = false;
  let hrNotified = false;
  if ((isFirstAssignToManager || managerChanged) && managerForNotify) {
    try {
      const admin = createAdminClient();
      const [{ data: employeeProfile }, { data: cycle }] = await Promise.all([
        admin
          .from("profiles")
          .select("full_name")
          .eq("id", existing.employee_id)
          .maybeSingle(),
        existing.cycle_id
          ? admin
              .from("appraisal_cycles")
              .select("title")
              .eq("id", existing.cycle_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const emailResult = await notifyManagerStaffReady({
        managerEmail: managerForNotify.email,
        managerName: managerForNotify.full_name,
        employeeName:
          employeeProfile?.full_name ||
          session.profile.full_name ||
          "An employee",
        cycleTitle: cycle?.title ?? null,
        reviewPeriod: existing.review_period,
        appraisalId: id,
      });
      managerNotified = emailResult.ok === true;
    } catch {
      managerNotified = false;
    }
  }

  if (isFirstSubmitToHr) {
    try {
      const admin = createAdminClient();
      const reviewerId = (data.reviewer_id as string | null) || existing.reviewer_id;
      const [{ data: employeeProfile }, { data: managerProfile }, { data: cycle }] =
        await Promise.all([
          admin
            .from("profiles")
            .select("full_name")
            .eq("id", existing.employee_id)
            .maybeSingle(),
          reviewerId
            ? admin
                .from("profiles")
                .select("full_name")
                .eq("id", reviewerId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          existing.cycle_id
            ? admin
                .from("appraisal_cycles")
                .select("title")
                .eq("id", existing.cycle_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

      const hrResult = await notifyHrAppraisalComplete({
        employeeName:
          employeeProfile?.full_name ||
          session.profile.full_name ||
          "Employee",
        managerName:
          managerProfile?.full_name ||
          (existing.appraiser_name as string | null) ||
          "Manager",
        cycleTitle: cycle?.title ?? null,
        reviewPeriod: existing.review_period,
        overallScore:
          data.overall_score != null
            ? Number(data.overall_score)
            : existing.overall_score != null
              ? Number(existing.overall_score)
              : null,
        ratingLabel:
          (data.rating_label as string | null) ||
          (existing.rating_label as string | null),
        appraisalId: id,
      });
      hrNotified = hrResult.ok === true;
    } catch {
      hrNotified = false;
    }
  }

  return NextResponse.json({
    appraisal: data,
    managerNotified,
    managerName: managerForNotify?.full_name ?? null,
    hrNotified,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFullHrSession(session)) {
    return NextResponse.json(
      { error: "Only HR/admin can delete appraisals." },
      { status: 403 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("appraisals")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await admin.from("appraisals").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not delete appraisal.",
      },
      { status: 500 }
    );
  }
}

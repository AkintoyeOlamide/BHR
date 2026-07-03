import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { canManageAppraisal } from "@/lib/auth/hr-access";

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
    .select(
      `
      *,
      employee:profiles!appraisals_employee_id_fkey(full_name, email),
      cycle:appraisal_cycles(title, status, start_date, end_date)
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = data.employee_id === session.profile.id;
  const isManager = canManageAppraisal(session.profile, data);

  if (!isOwner && !isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ appraisal: data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("appraisals")
    .select("employee_id, status, reviewer_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = existing.employee_id === session.profile.id;
  const isManager = canManageAppraisal(session.profile, existing);

  if (!isOwner && !isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    "goals",
    "achievements",
    "strengths",
    "areas_for_improvement",
    "development_plan",
    "review_period",
    "job_title",
    "department",
  ] as const;

  const allowed = isManager ? managerFields : employeeFields;
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (body.status === "submitted" && isOwner) {
    updates.submitted_at = new Date().toISOString();
  }

  if (body.status === "completed" && isManager) {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("appraisals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appraisal: data });
}

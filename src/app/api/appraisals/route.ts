import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessManager } from "@/lib/auth/roles";
import { canManageAppraisal, isFullHrSession } from "@/lib/auth/hr-access";
import { copyTemplateToAppraisal } from "@/lib/kpi/template";
import { notifyManagerOfAssignment } from "@/lib/email/notify-manager-assignment";

export async function GET() {
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const isManager = canAccessManager(session.profile.role);
  const fullHr = isFullHrSession(session);

  let query = supabase
    .from("appraisals")
    .select(
      `
      *,
      employee:profiles!appraisals_employee_id_fkey(full_name, email),
      cycle:appraisal_cycles(title, status)
    `
    )
    .order("updated_at", { ascending: false });

  if (!isManager) {
    query = query.eq("employee_id", session.profile.id);
  } else if (!fullHr) {
    query = query.eq("reviewer_id", session.profile.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ appraisals: data });
}

export async function POST(request: Request) {
  const session = await requireProfile();
  if (!session || !canAccessManager(session.profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isFullHrSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const supabase = await createClient();
  const employeeId = body.employee_id?.trim() || null;
  const reviewerId = body.reviewer_id?.trim() || null;

  if (!employeeId && !reviewerId) {
    return NextResponse.json(
      { error: "Select a manager, an employee, or both." },
      { status: 400 }
    );
  }

  if (reviewerId && !employeeId) {
    const { data: reviewer } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", reviewerId)
      .single();

    if (!reviewer) {
      return NextResponse.json(
        { error: "Selected manager was not found." },
        { status: 400 }
      );
    }

    const emailResult = await notifyManagerOfAssignment({
      managerEmail: reviewer.email,
      managerName: reviewer.full_name,
      hrName: session.profile.full_name || session.user.email || "HR",
      employeeName: "an employee (to be confirmed)",
      cycleTitle: null,
      reviewPeriod: body.review_period ?? null,
      appraisalId: "",
      managerOnly: true,
    });

    return NextResponse.json({
      ok: true,
      managerOnly: true,
      email: emailResult.ok
        ? { sent: true, id: emailResult.id }
        : {
            sent: false,
            skipped: "skipped" in emailResult ? emailResult.skipped : false,
            error: "error" in emailResult ? emailResult.error : undefined,
          },
    });
  }

  let cycleId = body.cycle_id?.trim() || null;
  if (!cycleId) {
    const { data: defaultCycle } = await supabase
      .from("appraisal_cycles")
      .select("id")
      .in("status", ["active", "draft"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    cycleId = defaultCycle?.id ?? null;
  }

  if (!cycleId) {
    return NextResponse.json(
      { error: "Create a review cycle first, or select one when assigning an employee." },
      { status: 400 }
    );
  }

  const { data: employee } = await supabase
    .from("profiles")
    .select("id, full_name, department, job_title")
    .eq("id", employeeId)
    .single();

  if (!employee) {
    return NextResponse.json(
      { error: "Selected employee was not found." },
      { status: 400 }
    );
  }

  const { data: cycle } = await supabase
    .from("appraisal_cycles")
    .select("title")
    .eq("id", cycleId)
    .maybeSingle();

  let reviewer: { id: string; full_name: string; email: string } | null = null;
  if (reviewerId) {
    const { data: reviewerProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email, job_title, department")
      .eq("id", reviewerId)
      .single();

    if (!reviewerProfile) {
      return NextResponse.json(
        { error: "Selected manager was not found." },
        { status: 400 }
      );
    }
    reviewer = reviewerProfile;
  }

  const { data, error } = await supabase
    .from("appraisals")
    .insert({
      cycle_id: cycleId,
      employee_id: employeeId,
      reviewer_id: reviewer?.id ?? null,
      status: "not_started",
      job_title: employee.job_title,
      department: employee.department,
      review_period: body.review_period ?? null,
      goals: body.goals ?? null,
      appraiser_name: reviewer?.full_name ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await copyTemplateToAppraisal(data.id);
  } catch {
    // Template copy is optional if migration not run yet
  }

  const emailResult = reviewer
    ? await notifyManagerOfAssignment({
        managerEmail: reviewer.email,
        managerName: reviewer.full_name,
        hrName: session.profile.full_name || session.user.email || "HR",
        employeeName: employee.full_name,
        cycleTitle: cycle?.title ?? null,
        reviewPeriod: body.review_period ?? null,
        appraisalId: data.id,
      })
    : { ok: false as const, skipped: true, error: "No manager selected." };

  return NextResponse.json({
    appraisal: data,
    email: emailResult.ok
      ? { sent: true, id: emailResult.id }
      : {
          sent: false,
          skipped: "skipped" in emailResult ? emailResult.skipped : false,
          error: "error" in emailResult ? emailResult.error : undefined,
        },
  });
}

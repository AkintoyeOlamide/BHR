import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessManager } from "@/lib/auth/roles";
import { isFullHrSession } from "@/lib/auth/hr-access";
import { ensureUserCredentials } from "@/lib/auth/ensure-user-credentials";
import { copyTemplateToAppraisal } from "@/lib/kpi/template";
import { notifyEmployeeOfAssignment } from "@/lib/email/notify-employee-assignment";
import { notifyManagerOfAssignment } from "@/lib/email/notify-manager-assignment";
import type { SendEmailResult } from "@/lib/email/send";

function formatEmailResult(result: SendEmailResult) {
  return result.ok
    ? { sent: true, id: result.id }
    : {
        sent: false,
        skipped: "skipped" in result ? result.skipped : false,
        error: "error" in result ? result.error : undefined,
      };
}

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
      .select("id, full_name, email, role, department, job_title")
      .eq("id", reviewerId)
      .single();

    if (!reviewer) {
      return NextResponse.json(
        { error: "Selected manager was not found." },
        { status: 400 }
      );
    }

    let credentials;
    try {
      credentials = await ensureUserCredentials({
        email: reviewer.email,
        full_name: reviewer.full_name,
        role: reviewer.role,
        department: reviewer.department,
        job_title: reviewer.job_title,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Could not prepare manager login.",
        },
        { status: 500 }
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
      credentials,
    });

    return NextResponse.json({
      ok: true,
      managerOnly: true,
      email: formatEmailResult(emailResult),
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
    .select("id, full_name, email, role, department, job_title")
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

  let reviewer: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    department: string | null;
    job_title: string | null;
  } | null = null;
  if (reviewerId) {
    const { data: reviewerProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, job_title, department")
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

  const hrName = session.profile.full_name || session.user.email || "HR";
  const reviewPeriod = body.review_period ?? null;
  let managerEmail = null;
  let employeeEmail = null;

  try {
    const employeeCredentials = await ensureUserCredentials({
      email: employee.email,
      full_name: employee.full_name,
      role: employee.role,
      department: employee.department,
      job_title: employee.job_title,
    });

    employeeEmail = await notifyEmployeeOfAssignment({
      employeeEmail: employee.email,
      employeeName: employee.full_name,
      hrName,
      cycleTitle: cycle?.title ?? null,
      reviewPeriod,
      credentials: employeeCredentials,
    });

    if (reviewer) {
      const managerCredentials = await ensureUserCredentials({
        email: reviewer.email,
        full_name: reviewer.full_name,
        role: reviewer.role,
        department: reviewer.department,
        job_title: reviewer.job_title,
      });

      managerEmail = await notifyManagerOfAssignment({
        managerEmail: reviewer.email,
        managerName: reviewer.full_name,
        hrName,
        employeeName: employee.full_name,
        cycleTitle: cycle?.title ?? null,
        reviewPeriod,
        appraisalId: data.id,
        credentials: managerCredentials,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        appraisal: data,
        error:
          error instanceof Error
            ? error.message
            : "Appraisal created but login email could not be prepared.",
        email: managerEmail ? formatEmailResult(managerEmail) : null,
        employeeEmail: employeeEmail ? formatEmailResult(employeeEmail) : null,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    appraisal: data,
    email: reviewer && managerEmail ? formatEmailResult(managerEmail) : null,
    employeeEmail: employeeEmail ? formatEmailResult(employeeEmail) : null,
  });
}

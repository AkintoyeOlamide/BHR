import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth/profile";
import { ROLES, canAccessManager } from "@/lib/auth/roles";
import { isFullHrSession } from "@/lib/auth/hr-access";
import { ensureUserCredentials } from "@/lib/auth/ensure-user-credentials";
import { copyTemplateToAppraisal } from "@/lib/kpi/template";
import { notifyEmployeeOfAssignment } from "@/lib/email/notify-employee-assignment";
import { notifyManagerOfAssignment } from "@/lib/email/notify-manager-assignment";
import type { SendEmailResult } from "@/lib/email/send";
import type { AssessmentType } from "@/lib/types/appraisal";

function formatEmailResult(result: SendEmailResult) {
  return result.ok
    ? { sent: true, id: result.id }
    : {
        sent: false,
        skipped: "skipped" in result ? result.skipped : false,
        error: "error" in result ? result.error : undefined,
      };
}

function isAssessmentType(value: string): value is AssessmentType {
  return value === "both" || value === "technical" || value === "behavioural";
}

function isMissingColumnError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("column") && lower.includes("does not exist");
}

type AssignmentProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  job_title: string | null;
};

type SelectedEmployeePayload = {
  id?: string;
  email?: string;
  full_name?: string;
};

async function loadProfileForAssignment(
  admin: ReturnType<typeof createAdminClient>,
  id: string
): Promise<{ profile: AssignmentProfile | null; error?: string }> {
  const attempts = [
    "id, full_name, email, role, department, job_title",
    "id, full_name, role, department, job_title",
    "id, full_name, email, department, job_title",
    "id, full_name, department, job_title",
  ] as const;

  let base: Record<string, unknown> | null = null;
  let lastError: string | undefined;

  for (const select of attempts) {
    const { data, error } = await admin
      .from("profiles")
      .select(select)
      .eq("id", id)
      .maybeSingle();

    if (!error) {
      base = (data as Record<string, unknown> | null) ?? null;
      break;
    }

    lastError = error.message;
    if (!isMissingColumnError(error.message)) {
      return { profile: null, error: error.message };
    }
  }

  if (!base) {
    return { profile: null, error: lastError ?? "Profile not found." };
  }

  const authRes = await admin.auth.admin.getUserById(id);
  const authUser = authRes.data?.user;
  const meta = (authUser?.user_metadata ?? {}) as {
    full_name?: string;
    role?: string;
  };

  const emailFromProfile =
    typeof base.email === "string" ? base.email : undefined;
  const roleFromProfile =
    typeof base.role === "string" ? base.role : undefined;
  const fullNameFromProfile =
    typeof base.full_name === "string" ? base.full_name : undefined;

  const profile: AssignmentProfile = {
    id,
    full_name:
      fullNameFromProfile?.trim() ||
      meta.full_name ||
      authUser?.email?.split("@")[0] ||
      "Unknown",
    email: emailFromProfile?.trim() || authUser?.email || "",
    role: (roleFromProfile ?? meta.role ?? ROLES.EMPLOYEE).toLowerCase(),
    department:
      typeof base.department === "string" ? base.department : null,
    job_title: typeof base.job_title === "string" ? base.job_title : null,
  };

  return { profile };
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

function parseEmployeeIds(body: {
  employee_id?: string | null;
  employee_ids?: string[] | null;
  selected_employees?: SelectedEmployeePayload[] | null;
}) {
  const fromArray = Array.isArray(body.employee_ids)
    ? body.employee_ids.map((id) => String(id).trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) {
    return [...new Set(fromArray)];
  }
  const single = body.employee_id?.trim();
  if (single) return [single];
  if (Array.isArray(body.selected_employees)) {
    const fromSelected = body.selected_employees
      .map((employee) => String(employee.id ?? "").trim())
      .filter(Boolean);
    if (fromSelected.length > 0) {
      return [...new Set(fromSelected)];
    }
  }
  return [];
}

async function buildAuthUsersByEmail(admin: ReturnType<typeof createAdminClient>) {
  const usersByEmail = new Map<
    string,
    { id: string; full_name: string; role: string }
  >();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) break;
    for (const user of data.users ?? []) {
      if (!user.email) continue;
      const meta = (user.user_metadata ?? {}) as { full_name?: string; role?: string };
      usersByEmail.set(user.email.toLowerCase(), {
        id: user.id,
        full_name: meta.full_name ?? "",
        role: (meta.role ?? ROLES.EMPLOYEE).toLowerCase(),
      });
    }
    if ((data.users ?? []).length < perPage) break;
    page += 1;
  }
  return usersByEmail;
}

async function ensureSelectedEmployeeProfiles(
  admin: ReturnType<typeof createAdminClient>,
  selected: SelectedEmployeePayload[] | undefined
) {
  if (!selected || selected.length === 0) return [];
  const authByEmail = await buildAuthUsersByEmail(admin);
  const ensuredIds: string[] = [];

  for (const item of selected) {
    const email = String(item.email ?? "").trim().toLowerCase();
    if (!email) continue;
    const auth = authByEmail.get(email);
    if (!auth) continue;

    const fullName = String(item.full_name ?? "").trim() || auth.full_name || email.split("@")[0];
    await admin.from("profiles").upsert(
      {
        id: auth.id,
        full_name: fullName,
      },
      { onConflict: "id" }
    );
    ensuredIds.push(auth.id);
  }

  return [...new Set(ensuredIds)];
}

async function assignAppraisalForEmployee(
  admin: ReturnType<typeof createAdminClient>,
  session: NonNullable<Awaited<ReturnType<typeof requireProfile>>>,
  input: {
    employeeId: string;
    reviewerId: string | null;
    cycleId: string;
    reviewPeriod: string | null;
    assessmentType: AssessmentType;
    goals?: string | null;
  }
) {
  const employeeRes = await loadProfileForAssignment(admin, input.employeeId);
  const employee = employeeRes.profile;
  if (!employee) {
    return { ok: false as const, error: "Selected employee was not found." };
  }
  if (!employee.email) {
    return {
      ok: false as const,
      error: "Selected employee has no email address in Auth.",
    };
  }

  const { data: cycle } = await admin
    .from("appraisal_cycles")
    .select("title")
    .eq("id", input.cycleId)
    .maybeSingle();

  let reviewer: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    department: string | null;
    job_title: string | null;
  } | null = null;

  if (input.reviewerId) {
    const reviewerRes = await loadProfileForAssignment(admin, input.reviewerId);
    const reviewerProfile = reviewerRes.profile;
    if (!reviewerProfile) {
      return { ok: false as const, error: "Selected manager was not found." };
    }
    if (!reviewerProfile.email) {
      return {
        ok: false as const,
        error: "Selected manager has no email address in Auth.",
      };
    }
    reviewer = reviewerProfile;
  }

  const baseAssignment = {
    reviewer_id: reviewer?.id ?? null,
    assessment_type: input.assessmentType,
    job_title: employee.job_title,
    department: employee.department,
    review_period: input.reviewPeriod,
    goals: input.goals ?? null,
    appraiser_name: reviewer?.full_name ?? null,
  };

  // One appraisal per (cycle, employee): update existing instead of duplicating.
  const { data: existing } = await admin
    .from("appraisals")
    .select("id, status")
    .eq("cycle_id", input.cycleId)
    .eq("employee_id", input.employeeId)
    .maybeSingle();

  let data:
    | {
        id: string;
      }
    | null = null;

  if (existing) {
    const shouldResetStatus =
      existing.status === "not_started" || existing.status === "in_progress";
    const { data: updated, error: updateError } = await admin
      .from("appraisals")
      .update({
        ...baseAssignment,
        ...(shouldResetStatus ? { status: "not_started" } : {}),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      return { ok: false as const, error: updateError.message };
    }
    data = updated;
  } else {
    const { data: inserted, error: insertError } = await admin
      .from("appraisals")
      .insert({
        cycle_id: input.cycleId,
        employee_id: input.employeeId,
        status: "not_started",
        ...baseAssignment,
      })
      .select()
      .single();

    if (insertError) {
      return { ok: false as const, error: insertError.message };
    }
    data = inserted;
  }

  if (!data) {
    return { ok: false as const, error: "Could not save appraisal." };
  }

  try {
    await copyTemplateToAppraisal(data.id);
  } catch {
    // Template copy is optional if migration not run yet
  }

  const hrName = session.profile.full_name || session.user.email || "HR";
  let managerEmail: SendEmailResult | null = null;
  let employeeEmail: SendEmailResult | null = null;

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
    reviewPeriod: input.reviewPeriod,
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
      reviewPeriod: input.reviewPeriod,
      appraisalId: data.id,
      credentials: managerCredentials,
    });
  }

  return {
    ok: true as const,
    appraisal: data,
    managerEmail,
    employeeEmail,
  };
}

export async function POST(request: Request) {
  const session = await requireProfile();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Assigning appraisals is an HR-only action.
  // Use full-HR check directly (email or role) to avoid false 403s when
  // legacy profiles have mismatched role values.
  if (!isFullHrSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const admin = createAdminClient();
  const selectedEmployees = Array.isArray(body.selected_employees)
    ? (body.selected_employees as SelectedEmployeePayload[])
    : undefined;
  const employeeIds = parseEmployeeIds(body);
  const ensuredEmployeeIds = await ensureSelectedEmployeeProfiles(
    admin,
    selectedEmployees
  );
  const effectiveEmployeeIds = [...new Set([...employeeIds, ...ensuredEmployeeIds])];
  const reviewerId = body.reviewer_id?.trim() || null;
  const assessmentTypeRaw = String(body.assessment_type ?? "both").trim().toLowerCase();
  const assessmentType: AssessmentType = isAssessmentType(assessmentTypeRaw)
    ? assessmentTypeRaw
    : "both";

  if (effectiveEmployeeIds.length === 0 && !reviewerId) {
    return NextResponse.json(
      { error: "Select a manager, one or more employees, or both." },
      { status: 400 }
    );
  }

  if (reviewerId && effectiveEmployeeIds.length === 0) {
    const reviewerRes = await loadProfileForAssignment(admin, reviewerId);
    const reviewer = reviewerRes.profile;
    if (!reviewer) {
      return NextResponse.json(
        { error: "Selected manager was not found." },
        { status: 400 }
      );
    }
    if (!reviewer.email) {
      return NextResponse.json(
        { error: "Selected manager has no email address in Auth." },
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
    const { data: defaultCycle } = await admin
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
      { error: "Create a review cycle first, or select one when assigning employees." },
      { status: 400 }
    );
  }

  const reviewPeriod = body.review_period ?? null;
  const appraisals = [];
  const errors: string[] = [];
  let emailsSent = 0;
  let emailsSkipped = false;

  for (const employeeId of effectiveEmployeeIds) {
    try {
      let resolvedReviewerId = reviewerId;
      if (!resolvedReviewerId) {
        const { data: employeeProfile } = await admin
          .from("profiles")
          .select("manager_id")
          .eq("id", employeeId)
          .maybeSingle();
        resolvedReviewerId =
          (employeeProfile?.manager_id as string | null) ?? null;
      }

      const result = await assignAppraisalForEmployee(admin, session, {
        employeeId,
        reviewerId: resolvedReviewerId,
        cycleId,
        reviewPeriod,
        assessmentType,
        goals: body.goals ?? null,
      });
      const resultWithFallback = result;
      if (!resultWithFallback.ok) {
        errors.push(resultWithFallback.error);
        continue;
      }

      appraisals.push(resultWithFallback.appraisal);
      if (resultWithFallback.employeeEmail?.ok) emailsSent += 1;
      if (resultWithFallback.managerEmail?.ok) emailsSent += 1;
      if (
        (resultWithFallback.employeeEmail &&
          !resultWithFallback.employeeEmail.ok &&
          "skipped" in resultWithFallback.employeeEmail &&
          resultWithFallback.employeeEmail.skipped) ||
        (resultWithFallback.managerEmail &&
          !resultWithFallback.managerEmail.ok &&
          "skipped" in resultWithFallback.managerEmail &&
          resultWithFallback.managerEmail.skipped)
      ) {
        emailsSkipped = true;
      }
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Could not assign appraisal."
      );
    }
  }

  if (appraisals.length === 0) {
    return NextResponse.json(
      { error: errors[0] ?? "Could not assign appraisals." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    appraisals,
    assigned: appraisals.length,
    emailsSent,
    emailsSkipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}

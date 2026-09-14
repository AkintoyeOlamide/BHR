import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ManagerAppraisalDetail = {
  id: string;
  cycle_id: string;
  employee_id: string;
  reviewer_id: string | null;
  status: string;
  job_title: string | null;
  department: string | null;
  review_period: string | null;
  goals: string | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  development_plan: string | null;
  manager_comments: string | null;
  overall_score: number | null;
  rating_label: string | null;
  appraiser_name: string | null;
  time_in_present_position: string | null;
  kpi_section_weight: number | null;
  kpi_overall_rating: number | null;
  kpi_section_actual: number | null;
  behavioural_section_weight: number | null;
  behavioural_overall_rating: number | null;
  behavioural_section_actual: number | null;
  employee_name: string;
  employee_email: string;
  reviewer_name: string;
  cycle_title: string;
  cycle_start_date: string | null;
  cycle_end_date: string | null;
};

function asNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function asText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function loadRelatedNames(input: {
  employeeId: string;
  reviewerId: string | null;
  cycleId: string;
  reviewPeriod: string | null;
}): Promise<{
  employee_name: string;
  employee_email: string;
  reviewer_name: string;
  cycle_title: string;
  cycle_start_date: string | null;
  cycle_end_date: string | null;
}> {
  let employee_name = "Employee";
  let employee_email = "";
  let reviewer_name = "—";
  let cycle_title = input.reviewPeriod?.trim() || "Review";
  let cycle_start_date: string | null = null;
  let cycle_end_date: string | null = null;

  try {
    const admin = createAdminClient();
    const profileIds = [input.employeeId, input.reviewerId].filter(
      Boolean
    ) as string[];

    const [{ data: profiles }, { data: cycle }, authUsers] = await Promise.all([
      admin.from("profiles").select("id, full_name, email").in("id", profileIds),
      admin
        .from("appraisal_cycles")
        .select("id, title, start_date, end_date")
        .eq("id", input.cycleId)
        .maybeSingle(),
      admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const authById = new Map(
      (authUsers.data?.users ?? []).map((u) => [u.id, u])
    );

    const employeeProfile = profileById.get(input.employeeId);
    const employeeAuth = authById.get(input.employeeId);
    employee_name =
      employeeProfile?.full_name?.trim() ||
      (employeeAuth?.user_metadata?.full_name as string | undefined) ||
      employeeAuth?.email?.split("@")[0] ||
      "Employee";
    employee_email =
      employeeProfile?.email?.trim() || employeeAuth?.email || "";

    if (input.reviewerId) {
      const reviewerProfile = profileById.get(input.reviewerId);
      const reviewerAuth = authById.get(input.reviewerId);
      reviewer_name =
        reviewerProfile?.full_name?.trim() ||
        (reviewerAuth?.user_metadata?.full_name as string | undefined) ||
        reviewerAuth?.email?.split("@")[0] ||
        "—";
    }

    if (cycle) {
      cycle_title = cycle.title;
      cycle_start_date = cycle.start_date;
      cycle_end_date = cycle.end_date;
    }
  } catch {
    // Fallbacks already set.
  }

  return {
    employee_name,
    employee_email,
    reviewer_name,
    cycle_title,
    cycle_start_date,
    cycle_end_date,
  };
}

function mapAppraisalRow(
  row: Record<string, unknown>,
  related: Awaited<ReturnType<typeof loadRelatedNames>>
): ManagerAppraisalDetail {
  return {
    id: String(row.id),
    cycle_id: String(row.cycle_id),
    employee_id: String(row.employee_id),
    reviewer_id: asText(row.reviewer_id),
    status: String(row.status),
    job_title: asText(row.job_title),
    department: asText(row.department),
    review_period: asText(row.review_period),
    goals: asText(row.goals),
    strengths: asText(row.strengths),
    areas_for_improvement: asText(row.areas_for_improvement),
    development_plan: asText(row.development_plan),
    manager_comments: asText(row.manager_comments),
    overall_score: asNumber(row.overall_score),
    rating_label: asText(row.rating_label),
    appraiser_name: asText(row.appraiser_name),
    time_in_present_position: asText(row.time_in_present_position),
    kpi_section_weight: asNumber(row.kpi_section_weight),
    kpi_overall_rating: asNumber(row.kpi_overall_rating),
    kpi_section_actual: asNumber(row.kpi_section_actual),
    behavioural_section_weight: asNumber(row.behavioural_section_weight),
    behavioural_overall_rating: asNumber(row.behavioural_overall_rating),
    behavioural_section_actual: asNumber(row.behavioural_section_actual),
    ...related,
  };
}

export async function getManagerAppraisalDetail(
  appraisalId: string
): Promise<ManagerAppraisalDetail | null> {
  const supabase = await createClient();

  const { data: sessionRow, error: sessionError } = await supabase
    .from("appraisals")
    .select("*")
    .eq("id", appraisalId)
    .maybeSingle();

  let row: Record<string, unknown> | null =
    sessionRow && !sessionError
      ? (sessionRow as Record<string, unknown>)
      : null;

  if (!row) {
    try {
      const admin = createAdminClient();
      const { data: adminRow } = await admin
        .from("appraisals")
        .select("*")
        .eq("id", appraisalId)
        .maybeSingle();
      row = (adminRow as Record<string, unknown> | null) ?? null;
    } catch {
      return null;
    }
  }

  if (!row) return null;

  const related = await loadRelatedNames({
    employeeId: String(row.employee_id),
    reviewerId: asText(row.reviewer_id),
    cycleId: String(row.cycle_id),
    reviewPeriod: asText(row.review_period),
  });

  return mapAppraisalRow(row, related);
}

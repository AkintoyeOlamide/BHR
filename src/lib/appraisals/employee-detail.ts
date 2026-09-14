import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type EmployeeAppraisalDetail = {
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
  cycle_title: string;
  cycle_start_date: string | null;
  cycle_end_date: string | null;
  manager_name: string | null;
  has_manager: boolean;
  manager_id: string | null;
};

async function loadCycleTitle(
  cycleId: string,
  reviewPeriod: string | null
): Promise<{
  title: string;
  start_date: string | null;
  end_date: string | null;
}> {
  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("appraisal_cycles")
    .select("title, start_date, end_date")
    .eq("id", cycleId)
    .maybeSingle();

  if (cycle) {
    return {
      title: cycle.title,
      start_date: cycle.start_date,
      end_date: cycle.end_date,
    };
  }

  try {
    const admin = createAdminClient();
    const { data: adminCycle } = await admin
      .from("appraisal_cycles")
      .select("title, start_date, end_date")
      .eq("id", cycleId)
      .maybeSingle();

    if (adminCycle) {
      return {
        title: adminCycle.title,
        start_date: adminCycle.start_date,
        end_date: adminCycle.end_date,
      };
    }
  } catch {
    // Admin client unavailable — use fallback title below.
  }

  return {
    title: reviewPeriod?.trim() || "Your performance review",
    start_date: null,
    end_date: null,
  };
}

function mapAppraisalRow(
  row: Record<string, unknown>,
  cycle: { title: string; start_date: string | null; end_date: string | null },
  manager: { id: string | null; name: string | null; hasManager: boolean }
): EmployeeAppraisalDetail {
  return {
    id: String(row.id),
    cycle_id: String(row.cycle_id),
    employee_id: String(row.employee_id),
    reviewer_id: (row.reviewer_id as string | null) ?? null,
    status: String(row.status),
    job_title: (row.job_title as string | null) ?? null,
    department: (row.department as string | null) ?? null,
    review_period: (row.review_period as string | null) ?? null,
    goals: (row.goals as string | null) ?? null,
    strengths: (row.strengths as string | null) ?? null,
    areas_for_improvement: (row.areas_for_improvement as string | null) ?? null,
    development_plan: (row.development_plan as string | null) ?? null,
    manager_comments: (row.manager_comments as string | null) ?? null,
    overall_score: row.overall_score != null ? Number(row.overall_score) : null,
    rating_label: (row.rating_label as string | null) ?? null,
    appraiser_name: (row.appraiser_name as string | null) ?? null,
    time_in_present_position:
      (row.time_in_present_position as string | null) ?? null,
    kpi_section_weight:
      row.kpi_section_weight != null ? Number(row.kpi_section_weight) : null,
    kpi_overall_rating:
      row.kpi_overall_rating != null ? Number(row.kpi_overall_rating) : null,
    kpi_section_actual:
      row.kpi_section_actual != null ? Number(row.kpi_section_actual) : null,
    behavioural_section_weight:
      row.behavioural_section_weight != null
        ? Number(row.behavioural_section_weight)
        : null,
    behavioural_overall_rating:
      row.behavioural_overall_rating != null
        ? Number(row.behavioural_overall_rating)
        : null,
    behavioural_section_actual:
      row.behavioural_section_actual != null
        ? Number(row.behavioural_section_actual)
        : null,
    cycle_title: cycle.title,
    cycle_start_date: cycle.start_date,
    cycle_end_date: cycle.end_date,
    manager_name: manager.name,
    has_manager: manager.hasManager,
    manager_id: manager.id,
  };
}

async function resolveManagerInfo(
  employeeId: string,
  reviewerId: string | null,
  appraiserName: string | null
): Promise<{ id: string | null; name: string | null; hasManager: boolean }> {
  if (reviewerId) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", reviewerId)
        .maybeSingle();
      return {
        id: reviewerId,
        name: data?.full_name?.trim() || appraiserName,
        hasManager: true,
      };
    } catch {
      return { id: reviewerId, name: appraiserName, hasManager: true };
    }
  }

  try {
    const admin = createAdminClient();
    const { data: employee } = await admin
      .from("profiles")
      .select("manager_id")
      .eq("id", employeeId)
      .maybeSingle();

    const managerId = (employee?.manager_id as string | null) ?? null;
    if (!managerId) {
      return { id: null, name: null, hasManager: false };
    }

    const { data: manager } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", managerId)
      .maybeSingle();

    return {
      id: managerId,
      name: manager?.full_name?.trim() || null,
      hasManager: true,
    };
  } catch {
    return { id: null, name: null, hasManager: false };
  }
}

export async function getEmployeeAppraisalDetail(
  appraisalId: string,
  employeeId: string
): Promise<EmployeeAppraisalDetail | null> {
  const supabase = await createClient();

  const { data: sessionRow, error: sessionError } = await supabase
    .from("appraisals")
    .select("*")
    .eq("id", appraisalId)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (sessionRow && !sessionError) {
    const cycle = await loadCycleTitle(
      sessionRow.cycle_id,
      sessionRow.review_period
    );
    const manager = await resolveManagerInfo(
      employeeId,
      sessionRow.reviewer_id,
      sessionRow.appraiser_name
    );
    return mapAppraisalRow(sessionRow, cycle, manager);
  }

  try {
    const admin = createAdminClient();
    const { data: adminRow } = await admin
      .from("appraisals")
      .select("*")
      .eq("id", appraisalId)
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (!adminRow) return null;

    const cycle = await loadCycleTitle(
      adminRow.cycle_id,
      adminRow.review_period
    );
    const manager = await resolveManagerInfo(
      employeeId,
      adminRow.reviewer_id,
      adminRow.appraiser_name
    );
    return mapAppraisalRow(adminRow, cycle, manager);
  } catch {
    return null;
  }
}

import { createAdminClient } from "@/lib/supabase/admin";

export type AppraisalResultRow = {
  id: string;
  status: string;
  assessment_type: string;
  employee_name: string;
  employee_email: string;
  department: string;
  job_title: string;
  reviewer_name: string;
  cycle_title: string;
  review_period: string;
  kpi_overall_rating: number | null;
  kpi_section_actual: number | null;
  behavioural_overall_rating: number | null;
  behavioural_section_actual: number | null;
  overall_score: number | null;
  rating_label: string;
  goals: string;
  strengths: string;
  areas_for_improvement: string;
  development_plan: string;
  manager_comments: string;
  updated_at: string;
};

function asText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim() || fallback;
}

function asNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function mapRow(
  row: Record<string, unknown>,
  names: {
    employee_name: string;
    employee_email: string;
    reviewer_name: string;
    cycle_title: string;
  }
): AppraisalResultRow {
  return {
    id: String(row.id),
    status: asText(row.status, "not_started"),
    assessment_type: asText(row.assessment_type, "both"),
    employee_name: names.employee_name,
    employee_email: names.employee_email,
    department: asText(row.department),
    job_title: asText(row.job_title),
    reviewer_name: names.reviewer_name,
    cycle_title: names.cycle_title,
    review_period: asText(row.review_period),
    kpi_overall_rating: asNumber(row.kpi_overall_rating),
    kpi_section_actual: asNumber(row.kpi_section_actual),
    behavioural_overall_rating: asNumber(row.behavioural_overall_rating),
    behavioural_section_actual: asNumber(row.behavioural_section_actual),
    overall_score: asNumber(row.overall_score),
    rating_label: asText(row.rating_label),
    goals: asText(row.goals),
    strengths: asText(row.strengths),
    areas_for_improvement: asText(row.areas_for_improvement),
    development_plan: asText(row.development_plan),
    manager_comments: asText(row.manager_comments),
    updated_at: asText(row.updated_at),
  };
}

export async function fetchAppraisalResults(): Promise<AppraisalResultRow[]> {
  const admin = createAdminClient();

  const selectWithJoins = `
    id, status, assessment_type, overall_score, kpi_overall_rating, kpi_section_actual,
    behavioural_overall_rating, behavioural_section_actual, rating_label,
    review_period, department, job_title, goals, strengths, areas_for_improvement,
    development_plan, manager_comments, updated_at, employee_id, reviewer_id, cycle_id,
    employee:profiles!appraisals_employee_id_fkey(full_name, email),
    reviewer:profiles!appraisals_reviewer_id_fkey(full_name),
    cycle:appraisal_cycles(title)
  `;

  const { data: joined, error } = await admin
    .from("appraisals")
    .select(selectWithJoins)
    .order("updated_at", { ascending: false });

  if (!error && joined?.length) {
    return joined.map((row) => {
      const employee = row.employee as {
        full_name?: string;
        email?: string;
      } | null;
      const reviewer = row.reviewer as { full_name?: string } | null;
      const cycle = row.cycle as { title?: string } | null;

      return mapRow(row as Record<string, unknown>, {
        employee_name: employee?.full_name?.trim() || "Employee",
        employee_email: employee?.email?.trim() || "",
        reviewer_name: reviewer?.full_name?.trim() || "—",
        cycle_title: cycle?.title?.trim() || "Review",
      });
    });
  }

  const { data: rows } = await admin
    .from("appraisals")
    .select(
      `id, status, assessment_type, overall_score, kpi_overall_rating, kpi_section_actual,
       behavioural_overall_rating, behavioural_section_actual, rating_label,
       review_period, department, job_title, goals, strengths, areas_for_improvement,
       development_plan, manager_comments, updated_at, employee_id, reviewer_id, cycle_id`
    )
    .order("updated_at", { ascending: false });

  if (!rows?.length) return [];

  const profileIds = [
    ...new Set(
      rows.flatMap((row) => [row.employee_id, row.reviewer_id].filter(Boolean))
    ),
  ] as string[];
  const cycleIds = [...new Set(rows.map((row) => row.cycle_id))];

  const [{ data: profiles }, { data: cycles }] = await Promise.all([
    admin.from("profiles").select("id, full_name, email").in("id", profileIds),
    admin.from("appraisal_cycles").select("id, title").in("id", cycleIds),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const cycleById = new Map((cycles ?? []).map((c) => [c.id, c]));

  return rows.map((row) => {
    const employee = profileById.get(row.employee_id);
    const reviewer = row.reviewer_id
      ? profileById.get(row.reviewer_id)
      : undefined;
    const cycle = cycleById.get(row.cycle_id);

    return mapRow(row as Record<string, unknown>, {
      employee_name: employee?.full_name?.trim() || "Employee",
      employee_email: employee?.email?.trim() || "",
      reviewer_name: reviewer?.full_name?.trim() || "—",
      cycle_title: cycle?.title?.trim() || "Review",
    });
  });
}

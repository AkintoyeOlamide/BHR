import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAppraisalListItem = {
  id: string;
  status: string;
  assessment_type: string;
  overall_score: number | null;
  kpi_overall_rating: number | null;
  rating_label: string | null;
  review_period: string | null;
  updated_at: string;
  employee_name: string;
  employee_email: string;
  reviewer_name: string;
  cycle_title: string;
};

export async function fetchAdminAppraisalList(
  limit?: number
): Promise<AdminAppraisalListItem[]> {
  const admin = createAdminClient();

  let query = admin
    .from("appraisals")
    .select(
      `
      id, status, assessment_type, overall_score, kpi_overall_rating,
      rating_label, review_period, updated_at, employee_id, reviewer_id, cycle_id,
      employee:profiles!appraisals_employee_id_fkey(full_name, email),
      reviewer:profiles!appraisals_reviewer_id_fkey(full_name),
      cycle:appraisal_cycles(title)
    `
    )
    .order("updated_at", { ascending: false });

  if (limit != null) {
    query = query.limit(limit);
  }

  const { data: appraisals, error } = await query;

  if (error || !appraisals?.length) {
    const { data: fallbackRows } = await admin
      .from("appraisals")
      .select(
        "id, status, assessment_type, overall_score, kpi_overall_rating, rating_label, review_period, updated_at, employee_id, reviewer_id, cycle_id"
      )
      .order("updated_at", { ascending: false })
      .limit(limit ?? 100);

    if (!fallbackRows?.length) return [];

    const profileIds = [
      ...new Set(
        fallbackRows.flatMap((row) =>
          [row.employee_id, row.reviewer_id].filter(Boolean)
        )
      ),
    ] as string[];
    const cycleIds = [...new Set(fallbackRows.map((row) => row.cycle_id))];

    const [{ data: profiles }, { data: cycles }] = await Promise.all([
      admin.from("profiles").select("id, full_name, email").in("id", profileIds),
      admin.from("appraisal_cycles").select("id, title").in("id", cycleIds),
    ]);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const cycleById = new Map((cycles ?? []).map((c) => [c.id, c]));

    return fallbackRows.map((row) => {
      const employee = profileById.get(row.employee_id);
      const reviewer = row.reviewer_id
        ? profileById.get(row.reviewer_id)
        : undefined;
      const cycle = cycleById.get(row.cycle_id);

      return {
        id: row.id,
        status: row.status,
        assessment_type: row.assessment_type ?? "both",
        overall_score: row.overall_score,
        kpi_overall_rating: row.kpi_overall_rating,
        rating_label: row.rating_label,
        review_period: row.review_period,
        updated_at: row.updated_at,
        employee_name: employee?.full_name ?? "Employee",
        employee_email: employee?.email ?? "",
        reviewer_name: reviewer?.full_name ?? "—",
        cycle_title: cycle?.title ?? "Review",
      };
    });
  }

  return appraisals.map((row) => {
    const employee = row.employee as { full_name?: string; email?: string } | null;
    const reviewer = row.reviewer as { full_name?: string } | null;
    const cycle = row.cycle as { title?: string } | null;

    return {
      id: row.id,
      status: row.status,
      assessment_type: row.assessment_type ?? "both",
      overall_score: row.overall_score,
      kpi_overall_rating: row.kpi_overall_rating,
      rating_label: row.rating_label,
      review_period: row.review_period,
      updated_at: row.updated_at,
      employee_name: employee?.full_name ?? "Employee",
      employee_email: employee?.email ?? "",
      reviewer_name: reviewer?.full_name ?? "—",
      cycle_title: cycle?.title ?? "Review",
    };
  });
}

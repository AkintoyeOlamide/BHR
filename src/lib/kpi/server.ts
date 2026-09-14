import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { KpiRow } from "@/lib/kpi/calculations";
import { createDefaultKpiRows } from "@/lib/kpi/calculations";

function mapKpiRows(data: Record<string, unknown>[]): KpiRow[] {
  return data.map((kpi) => ({
    id: String(kpi.id),
    sort_order: Number(kpi.sort_order) || 0,
    task: String(kpi.task ?? ""),
    weight: Number(kpi.weight) || 0,
    rating: kpi.rating == null ? null : Number(kpi.rating),
    manager_rating:
      kpi.manager_rating == null ? null : Number(kpi.manager_rating),
    measurement_area: String(kpi.measurement_area ?? ""),
  }));
}

export async function getAppraisalKpis(appraisalId: string): Promise<KpiRow[]> {
  // Prefer admin so assigned managers always see staff rows even if RLS is lagging.
  try {
    const admin = createAdminClient();
    const { data: adminData } = await admin
      .from("appraisal_kpis")
      .select("*")
      .eq("appraisal_id", appraisalId)
      .order("sort_order", { ascending: true });

    if (adminData && adminData.length > 0) {
      return mapKpiRows(adminData as Record<string, unknown>[]);
    }
  } catch {
    // Fall through to session client.
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appraisal_kpis")
    .select("*")
    .eq("appraisal_id", appraisalId)
    .order("sort_order", { ascending: true });

  if (!error && data && data.length > 0) {
    return mapKpiRows(data as Record<string, unknown>[]);
  }

  return createDefaultKpiRows(1);
}

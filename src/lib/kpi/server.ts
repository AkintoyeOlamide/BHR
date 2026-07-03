import { createClient } from "@/lib/supabase/server";
import type { KpiRow } from "@/lib/kpi/calculations";
import { createDefaultKpiRows } from "@/lib/kpi/calculations";

export async function getAppraisalKpis(appraisalId: string): Promise<KpiRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appraisal_kpis")
    .select("*")
    .eq("appraisal_id", appraisalId)
    .order("sort_order", { ascending: true });

  if (!data || data.length === 0) {
    return createDefaultKpiRows(1);
  }

  return data.map((kpi) => ({
    id: kpi.id,
    sort_order: kpi.sort_order,
    task: kpi.task,
    weight: Number(kpi.weight),
    rating: kpi.rating,
    measurement_area: kpi.measurement_area ?? "",
  }));
}

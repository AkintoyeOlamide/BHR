import { createClient } from "@/lib/supabase/server";
import {
  createDefaultBehaviouralRows,
  type BehaviouralRow,
} from "@/lib/behavioural/calculations";

export async function getAppraisalBehaviouralItems(
  appraisalId: string
): Promise<BehaviouralRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appraisal_behavioural_items")
    .select("*")
    .eq("appraisal_id", appraisalId)
    .order("sort_order", { ascending: true });

  if (!data || data.length === 0) {
    return createDefaultBehaviouralRows(1);
  }

  return data.map((item) => ({
    id: item.id,
    sort_order: item.sort_order,
    key_measurement: item.key_measurement,
    weight: Number(item.weight),
    rating: item.rating,
    comments: item.comments ?? "",
  }));
}

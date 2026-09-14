import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createDefaultBehaviouralRows,
  type BehaviouralRow,
} from "@/lib/behavioural/calculations";

function mapBehaviouralRows(data: Record<string, unknown>[]): BehaviouralRow[] {
  return data.map((item) => ({
    id: String(item.id),
    sort_order: Number(item.sort_order) || 0,
    key_measurement: String(item.key_measurement ?? ""),
    weight: Number(item.weight) || 0,
    rating: item.rating == null ? null : Number(item.rating),
    manager_rating:
      item.manager_rating == null ? null : Number(item.manager_rating),
    comments: String(item.comments ?? ""),
  }));
}

export async function getAppraisalBehaviouralItems(
  appraisalId: string
): Promise<BehaviouralRow[]> {
  try {
    const admin = createAdminClient();
    const { data: adminData } = await admin
      .from("appraisal_behavioural_items")
      .select("*")
      .eq("appraisal_id", appraisalId)
      .order("sort_order", { ascending: true });

    if (adminData && adminData.length > 0) {
      return mapBehaviouralRows(adminData as Record<string, unknown>[]);
    }
  } catch {
    // Fall through to session client.
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appraisal_behavioural_items")
    .select("*")
    .eq("appraisal_id", appraisalId)
    .order("sort_order", { ascending: true });

  if (!error && data && data.length > 0) {
    return mapBehaviouralRows(data as Record<string, unknown>[]);
  }

  return createDefaultBehaviouralRows(1);
}

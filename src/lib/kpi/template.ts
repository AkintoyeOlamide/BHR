import { createAdminClient } from "@/lib/supabase/admin";
import {
  BEHAVIOURAL_SECTION_WEIGHT_DEFAULT,
  createDefaultBehaviouralRows,
  type BehaviouralRow,
} from "@/lib/behavioural/calculations";
import {
  createDefaultKpiRows,
  KPI_SECTION_WEIGHT_DEFAULT,
  type KpiRow,
} from "@/lib/kpi/calculations";

export type KpiTemplate = {
  appraisee_name: string;
  appraiser_name: string;
  department: string;
  job_title: string;
  review_period: string;
  time_in_present_position: string;
  kpi_section_weight: number;
  kpis: KpiRow[];
  behavioural_section_weight: number;
  behavioural_items: BehaviouralRow[];
  goals: string;
  strengths: string;
  areas_for_improvement: string;
  development_plan: string;
};

export async function getKpiTemplate(): Promise<KpiTemplate> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("kpi_templates")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (!data) {
      return getDefaultKpiTemplate();
    }

    return {
      appraisee_name: data.appraisee_name ?? "",
      appraiser_name: data.appraiser_name ?? "",
      department: data.department ?? "",
      job_title: data.job_title ?? "",
      review_period: data.review_period ?? "",
      time_in_present_position: data.time_in_present_position ?? "",
      kpi_section_weight: Number(data.kpi_section_weight) || KPI_SECTION_WEIGHT_DEFAULT,
      kpis: (data.kpis as KpiRow[])?.length
        ? (data.kpis as KpiRow[])
        : createDefaultKpiRows(1),
      behavioural_section_weight:
        Number(data.behavioural_section_weight) || BEHAVIOURAL_SECTION_WEIGHT_DEFAULT,
      behavioural_items: (data.behavioural_items as BehaviouralRow[])?.length
        ? (data.behavioural_items as BehaviouralRow[])
        : createDefaultBehaviouralRows(1),
      goals: data.goals ?? "",
      strengths: data.strengths ?? "",
      areas_for_improvement: data.areas_for_improvement ?? "",
      development_plan: data.development_plan ?? "",
    };
  } catch {
    return getDefaultKpiTemplate();
  }
}

export function getDefaultKpiTemplate(): KpiTemplate {
  return {
    appraisee_name: "",
    appraiser_name: "",
    department: "",
    job_title: "",
    review_period: "",
    time_in_present_position: "",
    kpi_section_weight: KPI_SECTION_WEIGHT_DEFAULT,
    kpis: createDefaultKpiRows(1),
    behavioural_section_weight: BEHAVIOURAL_SECTION_WEIGHT_DEFAULT,
    behavioural_items: createDefaultBehaviouralRows(1),
    goals: "",
    strengths: "",
    areas_for_improvement: "",
    development_plan: "",
  };
}

export async function copyTemplateToAppraisal(appraisalId: string) {
  const template = await getKpiTemplate();
  const admin = createAdminClient();

  await admin.from("appraisal_kpis").delete().eq("appraisal_id", appraisalId);

  if (template.kpis.length > 0) {
    await admin.from("appraisal_kpis").insert(
      template.kpis.map((kpi, index) => ({
        appraisal_id: appraisalId,
        sort_order: index + 1,
        task: kpi.task,
        weight: kpi.weight,
        rating: null,
        measurement_area: kpi.measurement_area,
      }))
    );
  }

  await admin
    .from("appraisal_behavioural_items")
    .delete()
    .eq("appraisal_id", appraisalId);

  if (template.behavioural_items.length > 0) {
    await admin.from("appraisal_behavioural_items").insert(
      template.behavioural_items.map((item, index) => ({
        appraisal_id: appraisalId,
        sort_order: index + 1,
        key_measurement: item.key_measurement,
        weight: item.weight,
        rating: null,
        comments: item.comments,
      }))
    );
  }

  await admin
    .from("appraisals")
    .update({
      review_period: template.review_period || null,
      time_in_present_position: template.time_in_present_position || null,
      kpi_section_weight: template.kpi_section_weight,
      behavioural_section_weight: template.behavioural_section_weight,
      goals: template.goals || null,
      strengths: template.strengths || null,
      areas_for_improvement: template.areas_for_improvement || null,
      development_plan: template.development_plan || null,
    })
    .eq("id", appraisalId);
}

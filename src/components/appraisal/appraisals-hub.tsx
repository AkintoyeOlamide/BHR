import Link from "next/link";
import { AppraisalWorkspace } from "@/components/appraisal/appraisal-workspace";
import { BehaviouralAssessmentForm } from "@/components/appraisal/behavioural-assessment-form";
import { DevPlanPanel } from "@/components/appraisal/dev-plan-panel";
import { OverallRatingPanel } from "@/components/appraisal/overall-rating-panel";
import { TechnicalAssessmentForm } from "@/components/appraisal/technical-assessment-form";
import { createClient } from "@/lib/supabase/server";
import { isFullHrUser } from "@/lib/auth/hr-access";
import { getAppraisalDetailPath } from "@/lib/navigation/portal-nav";
import { getKpiTemplate } from "@/lib/kpi/template";
import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";

type AppraisalsHubProps = {
  role: string;
  userId: string;
  userEmail: string;
};

export async function AppraisalsHub({ role, userId, userEmail }: AppraisalsHubProps) {
  const supabase = await createClient();
  const template = await getKpiTemplate();
  const fullHr = isFullHrUser({ role, email: userEmail });

  const appraisalsQuery = supabase
    .from("appraisals")
    .select(
      `
          id, status, overall_score, kpi_overall_rating, kpi_section_actual,
          rating_label, review_period, updated_at,
          employee:profiles!appraisals_employee_id_fkey(full_name, email),
          reviewer:profiles!appraisals_reviewer_id_fkey(full_name, email),
          cycle:appraisal_cycles(title)
        `
    )
    .order("updated_at", { ascending: false });

  const { data: appraisals } = fullHr
    ? await appraisalsQuery
    : await appraisalsQuery.eq("reviewer_id", userId);

  if (fullHr) {
    return (
      <section className="portal-surface">
        <AppraisalWorkspace
          tabs={[
            {
              id: "technical",
              label: "Technical",
              description:
                "Set up KPI tasks and weights for the 80% technical section.",
              content: (
                <TechnicalAssessmentForm
                  mode="template"
                  showAssign
                  header={{
                    appraisee_name: template.appraisee_name,
                    department: template.department,
                    review_period: template.review_period,
                    appraiser_name: template.appraiser_name,
                    job_title: template.job_title,
                    time_in_present_position: template.time_in_present_position,
                    kpi_section_weight: template.kpi_section_weight,
                  }}
                  initialKpis={template.kpis}
                />
              ),
            },
            {
              id: "behavioural",
              label: "Behavioural",
              description:
                "Define competencies and behaviours for the 20% section.",
              content: (
                <BehaviouralAssessmentForm
                  mode="template"
                  sectionWeight={template.behavioural_section_weight}
                  initialItems={template.behavioural_items}
                />
              ),
            },
            {
              id: "overall",
              label: "Overall rating",
              description:
                "Review how technical and behavioural scores combine.",
              content: (
                <OverallRatingPanel
                  mode="template"
                  kpiSectionWeight={template.kpi_section_weight}
                  behaviouralSectionWeight={template.behavioural_section_weight}
                />
              ),
            },
            {
              id: "dev-plan",
              label: "Dev plan",
              description:
                "Template for goals, strengths, and development actions.",
              content: (
                <DevPlanPanel
                  mode="template"
                  initial={{
                    goals: template.goals,
                    strengths: template.strengths,
                    areas_for_improvement: template.areas_for_improvement,
                    development_plan: template.development_plan,
                  }}
                />
              ),
            },
          ]}
        />
      </section>
    );
  }

  return (
    <section className="portal-surface">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Your assigned reviews
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Appraisals assigned to you by HR. Open each one to complete ratings
          and comments.
        </p>
      </div>

      <div className="space-y-3">
        {(appraisals ?? []).length === 0 ? (
          <p className="portal-surface py-6 text-sm text-stone-500">
            No reviews assigned to you yet. HR will assign appraisals here.
          </p>
        ) : (
          appraisals?.map((appraisal) => {
            const detailHref = getAppraisalDetailPath(role, appraisal.id);
            const kpiScore =
              appraisal.kpi_overall_rating ?? appraisal.overall_score;

            return (
              <Link
                key={appraisal.id}
                href={detailHref}
                className="portal-list-item group !block !items-stretch"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {(appraisal.employee as { full_name?: string })?.full_name}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {(appraisal.cycle as { title?: string })?.title}
                      {appraisal.review_period
                        ? ` · ${appraisal.review_period}`
                        : ""}
                    </p>
                  </div>
                  <span className={appraisalStatusBadgeClass(appraisal.status)}>
                    {
                      APPRAISAL_STATUS_LABELS[
                        appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS
                      ]
                    }
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-stone-600">
                    Overall score:{" "}
                    <span className="font-semibold text-stone-900">
                      {kpiScore != null ? Number(kpiScore).toFixed(2) : "—"}
                    </span>
                  </p>
                  <span className="portal-link">
                    Complete review →
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

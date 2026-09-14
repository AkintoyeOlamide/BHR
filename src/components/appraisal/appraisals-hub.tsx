import Link from "next/link";
import { AppraisalWorkspace } from "@/components/appraisal/appraisal-workspace";
import { AssignedAppraisalsList } from "@/components/appraisal/assigned-appraisals-list";
import { BehaviouralAssessmentForm } from "@/components/appraisal/behavioural-assessment-form";
import { DevPlanPanel } from "@/components/appraisal/dev-plan-panel";
import { OverallRatingPanel } from "@/components/appraisal/overall-rating-panel";
import { TechnicalAssessmentForm } from "@/components/appraisal/technical-assessment-form";
import { fetchAdminAppraisalList } from "@/lib/appraisals/admin-list";
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
    const assignedAppraisals = await fetchAdminAppraisalList();

    return (
      <div className="space-y-8">
        <section className="portal-surface">
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
              Staff reviews
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Assigned appraisals
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              When staff clicks <strong>Submit to HR</strong> after the manager
              has saved ratings, status becomes{" "}
              <strong>Submitted to HR</strong> and the full review is ready here
              and under Results.
            </p>
          </div>
          <div className="mt-5">
            <AssignedAppraisalsList appraisals={assignedAppraisals} />
          </div>
        </section>

        <details className="portal-surface group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Setup only
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Appraisal form template
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Edit the blank form used when assigning new appraisals. This is
                  not an employee&apos;s live review.
                </p>
              </div>
              <span className="mt-1 shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 group-open:bg-violet-100 group-open:text-violet-700">
                <span className="group-open:hidden">Show template</span>
                <span className="hidden group-open:inline">Hide template</span>
              </span>
            </div>
          </summary>

          <div className="mt-6 border-t border-slate-100 pt-6">
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
                        time_in_present_position:
                          template.time_in_present_position,
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
                    "Template only — open an assigned appraisal above to see real scores.",
                  content: (
                    <OverallRatingPanel
                      mode="template"
                      kpiSectionWeight={template.kpi_section_weight}
                      behaviouralSectionWeight={
                        template.behavioural_section_weight
                      }
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
          </div>
        </details>
      </div>
    );
  }

  return (
    <section className="portal-surface">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          People to appraise
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Staff who finished their self-ratings and assigned the review to you.
          Open each one, enter manager ratings, and save. Staff then submits to
          HR.
        </p>
      </div>

      {(() => {
        const rows = appraisals ?? [];
        const needsRating = rows.filter((a) => a.status === "submitted");
        const others = rows.filter((a) => a.status !== "submitted");

        if (rows.length === 0) {
          return (
            <p className="portal-surface py-6 text-sm text-stone-500">
              Nobody has assigned an appraisal to you yet. When a team member
              completes Technical and Behavioural and clicks Assign to manager,
              they appear here.
            </p>
          );
        }

        function renderRow(
          appraisal: (typeof rows)[number],
          highlight: boolean
        ) {
          const detailHref = getAppraisalDetailPath(role, appraisal.id);
          const kpiScore =
            appraisal.kpi_overall_rating ?? appraisal.overall_score;

          return (
            <Link
              key={appraisal.id}
              href={detailHref}
              className={`portal-list-item group !block !items-stretch ${
                highlight ? "ring-1 ring-amber-200 bg-amber-50/40" : ""
              }`}
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
                  {highlight ? "Enter manager ratings →" : "View appraisal →"}
                </span>
              </div>
            </Link>
          );
        }

        return (
          <div className="space-y-6">
            {needsRating.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Needs your rating ({needsRating.length})
                </p>
                {needsRating.map((appraisal) => renderRow(appraisal, true))}
              </div>
            )}
            {others.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Other reviews
                </p>
                {others.map((appraisal) => renderRow(appraisal, false))}
              </div>
            )}
          </div>
        );
      })()}
    </section>
  );
}

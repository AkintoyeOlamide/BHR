import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { AssignToManagerCard } from "@/components/appraisal/assign-to-manager-card";
import { AppraisalWorkspace } from "@/components/appraisal/appraisal-workspace";
import { BehaviouralAssessmentForm } from "@/components/appraisal/behavioural-assessment-form";
import { DevPlanPanel } from "@/components/appraisal/dev-plan-panel";
import { OverallRatingPanel } from "@/components/appraisal/overall-rating-panel";
import { TechnicalAssessmentForm } from "@/components/appraisal/technical-assessment-form";
import { SignOutButton } from "@/components/sign-out-button";
import { requireProfile } from "@/lib/auth/profile";
import { getEmployeeAppraisalDetail } from "@/lib/appraisals/employee-detail";
import { getAppraisalBehaviouralItems } from "@/lib/behavioural/server";
import { getAppraisalKpis } from "@/lib/kpi/server";
import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";
import { BEHAVIOURAL_SECTION_WEIGHT_DEFAULT } from "@/lib/behavioural/calculations";
import {
  calculateBehaviouralOverallRating,
  calculateBehaviouralSectionActual,
} from "@/lib/behavioural/calculations";
import {
  KPI_SECTION_WEIGHT_DEFAULT,
  calculateKpiOverallRating,
  calculateKpiSectionActual,
} from "@/lib/kpi/calculations";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EmployeeAppraisalPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireProfile();
  if (!session) redirect("/login");

  const appraisal = await getEmployeeAppraisalDetail(id, session.user.id);
  if (!appraisal) notFound();

  const kpis = await getAppraisalKpis(appraisal.id);
  const behaviouralItems = await getAppraisalBehaviouralItems(appraisal.id);

  const kpiSectionWeight =
    Number(appraisal.kpi_section_weight) || KPI_SECTION_WEIGHT_DEFAULT;
  const behaviouralSectionWeight =
    Number(appraisal.behavioural_section_weight) ||
    BEHAVIOURAL_SECTION_WEIGHT_DEFAULT;

  const liveKpiOverall = calculateKpiOverallRating(kpis);
  const liveKpiSectionActual = calculateKpiSectionActual(
    liveKpiOverall,
    kpiSectionWeight
  );
  const liveBehaviouralOverall =
    calculateBehaviouralOverallRating(behaviouralItems);
  const liveBehaviouralSectionActual = calculateBehaviouralSectionActual(
    liveBehaviouralOverall,
    behaviouralSectionWeight
  );

  // Prefer live scores from rated rows so Overall updates after staff save.
  const kpiOverall =
    liveKpiOverall > 0
      ? liveKpiOverall
      : appraisal.kpi_overall_rating != null
        ? Number(appraisal.kpi_overall_rating)
        : liveKpiOverall;
  const kpiSectionActual =
    liveKpiOverall > 0
      ? liveKpiSectionActual
      : appraisal.kpi_section_actual != null
        ? Number(appraisal.kpi_section_actual)
        : liveKpiSectionActual;
  const behaviouralOverall =
    liveBehaviouralOverall > 0
      ? liveBehaviouralOverall
      : appraisal.behavioural_overall_rating != null
        ? Number(appraisal.behavioural_overall_rating)
        : liveBehaviouralOverall;
  const behaviouralSectionActual =
    liveBehaviouralOverall > 0
      ? liveBehaviouralSectionActual
      : appraisal.behavioural_section_actual != null
        ? Number(appraisal.behavioural_section_actual)
        : liveBehaviouralSectionActual;
  const overallScore = kpiSectionActual + behaviouralSectionActual;

  const technicalRated = kpis.filter((k) => k.rating != null).length;
  const behaviouralRated = behaviouralItems.filter(
    (item) => item.rating != null
  ).length;
  const technicalManagerRated = kpis.filter(
    (k) => k.manager_rating != null
  ).length;
  const behaviouralManagerRated = behaviouralItems.filter(
    (item) => item.manager_rating != null
  ).length;
  const locked =
    appraisal.status === "submitted" || appraisal.status === "completed";
  const assignedToManager = appraisal.status === "submitted";

  const statusLabel =
    APPRAISAL_STATUS_LABELS[
      appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS
    ];

  return (
    <div className="portal-light portal-page min-h-screen text-slate-900">
      <header className="portal-header sticky top-0 z-40">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="sm:hidden">
            <div className="flex h-11 items-center justify-between">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M10 3L5 8l5 5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Dashboard
              </Link>
              <SignOutButton />
            </div>
            <div className="border-t border-slate-200/70 pb-3 pt-2.5">
              <h1 className="text-lg font-semibold leading-snug tracking-tight text-slate-900">
                {appraisal.cycle_title}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={appraisalStatusBadgeClass(appraisal.status)}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="hidden h-16 items-center justify-between sm:flex">
            <Logo size="sm" theme="light" />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-3 hidden sm:block sm:mb-6">
          <Link href="/dashboard" className="portal-link text-sm">
            ← Back to dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">
            {appraisal.cycle_title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={appraisalStatusBadgeClass(appraisal.status)}>
              {statusLabel}
            </span>
            <span className="text-sm text-slate-500">
              {appraisal.status === "completed"
                ? "Submitted to HR."
                : assignedToManager
                  ? "Your manager is adding ratings. They appear on Technical and Behavioural — then submit to HR on Overall."
                  : "Complete Technical and Behavioural, save, then assign to your manager."}
            </span>
          </div>
        </div>

        <div className="sm:mt-2">
          <AppraisalWorkspace
            tabs={[
              {
                id: "technical",
                label: "Technical",
                description: assignedToManager
                  ? "Your ratings and your manager’s ratings."
                  : appraisal.status === "completed"
                    ? "Final technical ratings."
                    : "Rate each KPI, then save.",
                content: (
                  <TechnicalAssessmentForm
                    appraisalId={appraisal.id}
                    mode="employee"
                    locked={locked}
                    header={{
                      appraisee_name: session.profile.full_name,
                      department:
                        appraisal.department ?? session.profile.department ?? "",
                      review_period: appraisal.review_period ?? "",
                      appraiser_name: appraisal.appraiser_name ?? "",
                      job_title:
                        appraisal.job_title ?? session.profile.job_title ?? "",
                      time_in_present_position:
                        appraisal.time_in_present_position ?? "",
                      kpi_section_weight:
                        Number(appraisal.kpi_section_weight) ||
                        KPI_SECTION_WEIGHT_DEFAULT,
                    }}
                    initialKpis={kpis}
                  />
                ),
              },
              {
                id: "behavioural",
                label: "Behavioural",
                description: assignedToManager
                  ? "Your ratings and your manager’s ratings."
                  : appraisal.status === "completed"
                    ? "Final behavioural ratings."
                    : "Rate each behaviour, then save.",
                content: (
                  <BehaviouralAssessmentForm
                    appraisalId={appraisal.id}
                    mode="employee"
                    locked={locked}
                    sectionWeight={
                      Number(appraisal.behavioural_section_weight) ||
                      BEHAVIOURAL_SECTION_WEIGHT_DEFAULT
                    }
                    initialItems={behaviouralItems}
                  />
                ),
              },
              {
                id: "overall",
                label: "Overall rating",
                description: assignedToManager
                  ? "Review manager ratings, then submit to HR."
                  : "See your combined Technical and Behavioural score.",
                content: (
                  <OverallRatingPanel
                    mode="employee"
                    appraisalId={appraisal.id}
                    appraisalStatus={appraisal.status}
                    kpiSectionWeight={kpiSectionWeight}
                    behaviouralSectionWeight={behaviouralSectionWeight}
                    kpiOverall={kpiOverall}
                    kpiSectionActual={kpiSectionActual}
                    behaviouralOverall={behaviouralOverall}
                    behaviouralSectionActual={behaviouralSectionActual}
                    overallScore={overallScore}
                    ratingLabel={appraisal.rating_label}
                    managerComments={appraisal.manager_comments}
                    technicalManagerRated={technicalManagerRated}
                    technicalTotal={kpis.length}
                    behaviouralManagerRated={behaviouralManagerRated}
                    behaviouralTotal={behaviouralItems.length}
                    canSubmitToHr
                  />
                ),
              },
              {
                id: "dev-plan",
                label: "Dev plan",
                description: locked
                  ? "Your development plan (already sent to your manager)."
                  : "Goals, strengths, growth areas, and development actions.",
                content: (
                  <DevPlanPanel
                    mode="employee"
                    appraisalId={appraisal.id}
                    appraisalStatus={appraisal.status}
                    technicalRated={technicalRated}
                    technicalTotal={kpis.length}
                    behaviouralRated={behaviouralRated}
                    behaviouralTotal={behaviouralItems.length}
                    managerName={appraisal.manager_name}
                    hasManager={appraisal.has_manager}
                    showAssignCard={false}
                    initial={{
                      goals: appraisal.goals,
                      strengths: appraisal.strengths,
                      areas_for_improvement: appraisal.areas_for_improvement,
                      development_plan: appraisal.development_plan,
                    }}
                  />
                ),
              },
            ]}
          />
        </div>

        <div className="mt-6">
          <AssignToManagerCard
            appraisalId={appraisal.id}
            status={appraisal.status}
            technicalRated={technicalRated}
            technicalTotal={kpis.length}
            behaviouralRated={behaviouralRated}
            behaviouralTotal={behaviouralItems.length}
            managerName={appraisal.manager_name}
            initialManagerId={
              appraisal.reviewer_id ?? appraisal.manager_id
            }
          />
        </div>
      </main>
    </div>
  );
}

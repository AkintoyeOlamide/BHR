import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PortalShell } from "@/components/layouts/portal-shell";
import { AppraisalWorkspace } from "@/components/appraisal/appraisal-workspace";
import { BehaviouralAssessmentForm } from "@/components/appraisal/behavioural-assessment-form";
import { DevPlanPanel } from "@/components/appraisal/dev-plan-panel";
import { OverallRatingPanel } from "@/components/appraisal/overall-rating-panel";
import { TechnicalAssessmentForm } from "@/components/appraisal/technical-assessment-form";
import { DeleteAppraisalButton } from "@/components/appraisal/delete-appraisal-button";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessManager, ROLES } from "@/lib/auth/roles";
import { isFullHrSession, isFullHrUser, canEditManagerRating } from "@/lib/auth/hr-access";
import { getManagerAppraisalDetail } from "@/lib/appraisals/manager-detail";
import { getPortalNav } from "@/lib/navigation/portal-nav";
import { getAppraisalBehaviouralItems } from "@/lib/behavioural/server";
import { getAppraisalKpis } from "@/lib/kpi/server";
import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";
import {
  BEHAVIOURAL_SECTION_WEIGHT_DEFAULT,
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

export default async function ManagerAppraisalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireProfile();
  if (!session) redirect("/login");

  const fullHr = isFullHrSession(session);
  const canOpen =
    fullHr ||
    canAccessManager(session.profile.role) ||
    isFullHrUser({
      role: session.profile.role,
      email: session.profile.email || session.user.email || "",
    });

  if (!canOpen) redirect("/dashboard");

  const appraisal = await getManagerAppraisalDetail(id);
  if (!appraisal) notFound();

  if (!fullHr && appraisal.reviewer_id !== session.profile.id && appraisal.reviewer_id !== session.user.id) {
    notFound();
  }

  const kpis = await getAppraisalKpis(appraisal.id);
  const behaviouralItems = await getAppraisalBehaviouralItems(appraisal.id);

  const appraisalsHref = fullHr ? "/admin/appraisals" : "/manager/appraisals";
  const statusLabel =
    APPRAISAL_STATUS_LABELS[
      appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS
    ];

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
  const mayEditManagerRating = canEditManagerRating(
    session.profile,
    { reviewer_id: appraisal.reviewer_id },
    session.user.id
  );
  const canEditStructure = fullHr && !mayEditManagerRating;
  const technicalManagerRated = kpis.filter(
    (k) => k.manager_rating != null
  ).length;
  const behaviouralManagerRated = behaviouralItems.filter(
    (item) => item.manager_rating != null
  ).length;

  return (
    <PortalShell
      compact
      backHref={appraisalsHref}
      backLabel="Appraisals"
      title={appraisal.employee_name}
      subtitle={appraisal.cycle_title}
      statusLabel={statusLabel}
      statusClassName={appraisalStatusBadgeClass(appraisal.status)}
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <AppraisalWorkspace
        tabs={[
          {
            id: "technical",
            label: "Technical",
            description:
              "Enter manager ratings for the 80% technical section, then save.",
            content: (
              <TechnicalAssessmentForm
                appraisalId={appraisal.id}
                mode="manager"
                canEditManagerRating={mayEditManagerRating}
                canEditStructure={canEditStructure}
                header={{
                  appraisee_name: appraisal.employee_name,
                  department: appraisal.department ?? "",
                  review_period: appraisal.review_period ?? "",
                  appraiser_name:
                    appraisal.appraiser_name ??
                    appraisal.reviewer_name ??
                    session.profile.full_name,
                  job_title: appraisal.job_title ?? "",
                  time_in_present_position:
                    appraisal.time_in_present_position ?? "",
                  kpi_section_weight: kpiSectionWeight,
                }}
                initialKpis={kpis}
              />
            ),
          },
          {
            id: "behavioural",
            label: "Behavioural",
            description:
              "Enter manager ratings for the 20% behavioural section, then save.",
            content: (
              <BehaviouralAssessmentForm
                appraisalId={appraisal.id}
                mode="manager"
                canEditManagerRating={mayEditManagerRating}
                canEditStructure={canEditStructure}
                sectionWeight={behaviouralSectionWeight}
                initialItems={behaviouralItems}
              />
            ),
          },
          {
            id: "overall",
            label: "Overall rating",
            description:
              "Save the rating band and comments. Staff submits the review to HR.",
            content: (
              <OverallRatingPanel
                mode="manager"
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
              />
            ),
          },
          {
            id: "dev-plan",
            label: "Dev plan",
            description: "Staff development plan — view only.",
            content: (
              <DevPlanPanel
                mode="manager"
                appraisalId={appraisal.id}
                appraisalStatus={appraisal.status}
                readOnly
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

      {fullHr && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-red-900">Delete appraisal</p>
            <p className="text-xs text-red-700">
              Permanently remove this review and all related ratings.
            </p>
          </div>
          <DeleteAppraisalButton
            appraisalId={appraisal.id}
            employeeName={appraisal.employee_name}
            redirectTo="/admin/results"
          />
        </div>
      )}

      {session.profile.role === ROLES.SUPER_ADMIN && (
        <p className="mt-6">
          <Link href="/admin/appraisals" className="text-sm text-violet-600 hover:text-violet-500">
            View in Super Admin →
          </Link>
        </p>
      )}
    </PortalShell>
  );
}

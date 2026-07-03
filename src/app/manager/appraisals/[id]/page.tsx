import { redirect, notFound } from "next/navigation";

import Link from "next/link";

import { PortalShell } from "@/components/layouts/portal-shell";

import { AppraisalWorkspace } from "@/components/appraisal/appraisal-workspace";

import { BehaviouralAssessmentForm } from "@/components/appraisal/behavioural-assessment-form";

import { DevPlanPanel } from "@/components/appraisal/dev-plan-panel";

import { OverallRatingPanel } from "@/components/appraisal/overall-rating-panel";

import { TechnicalAssessmentForm } from "@/components/appraisal/technical-assessment-form";

import { requireProfile } from "@/lib/auth/profile";

import { canAccessManager, ROLES } from "@/lib/auth/roles";
import { isFullHrUser } from "@/lib/auth/hr-access";

import { getPortalNav } from "@/lib/navigation/portal-nav";

import { createClient } from "@/lib/supabase/server";

import { getAppraisalBehaviouralItems } from "@/lib/behavioural/server";

import { getAppraisalKpis } from "@/lib/kpi/server";

import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";

import { BEHAVIOURAL_SECTION_WEIGHT_DEFAULT } from "@/lib/behavioural/calculations";

import { KPI_SECTION_WEIGHT_DEFAULT } from "@/lib/kpi/calculations";



type PageProps = { params: Promise<{ id: string }> };



export default async function ManagerAppraisalDetailPage({ params }: PageProps) {

  const { id } = await params;

  const session = await requireProfile();

  if (!session) redirect("/login");

  if (!canAccessManager(session.profile.role)) redirect("/dashboard");



  const supabase = await createClient();

  const { data: appraisal } = await supabase

    .from("appraisals")

    .select(

      `

      *,

      employee:profiles!appraisals_employee_id_fkey(full_name, email),

      reviewer:profiles!appraisals_reviewer_id_fkey(full_name),

      cycle:appraisal_cycles(title, start_date, end_date)

    `

    )

    .eq("id", id)

    .single();



  if (!appraisal) notFound();

  const fullHr = isFullHrUser({
    role: session.profile.role,
    email: session.profile.email,
  });

  if (!fullHr && appraisal.reviewer_id !== session.profile.id) {
    notFound();
  }



  const kpis = await getAppraisalKpis(appraisal.id);

  const behaviouralItems = await getAppraisalBehaviouralItems(appraisal.id);

  const employee = appraisal.employee as { full_name?: string; email?: string };

  const reviewer = appraisal.reviewer as { full_name?: string } | null;

  const cycle = appraisal.cycle as { title?: string; start_date?: string; end_date?: string };

  const appraisalsHref = fullHr ? "/admin/appraisals" : "/manager/appraisals";

  const statusLabel =
    APPRAISAL_STATUS_LABELS[appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS];

  return (
    <PortalShell
      compact
      backHref={appraisalsHref}
      backLabel="Appraisals"
      title={employee.full_name ?? "Employee appraisal"}
      subtitle={cycle.title ?? "Review"}
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
            description: "Rate KPIs and complete the 80% technical section.",

            content: (

              <TechnicalAssessmentForm

                appraisalId={appraisal.id}

                mode="manager"

                header={{

                  appraisee_name: employee.full_name ?? "",

                  department: appraisal.department ?? "",

                  review_period: appraisal.review_period ?? "",

                  appraiser_name:

                    appraisal.appraiser_name ??

                    reviewer?.full_name ??

                    session.profile.full_name,

                  job_title: appraisal.job_title ?? "",

                  time_in_present_position: appraisal.time_in_present_position ?? "",

                  kpi_section_weight:

                    Number(appraisal.kpi_section_weight) || KPI_SECTION_WEIGHT_DEFAULT,

                }}

                initialKpis={kpis}

              />

            ),

          },

          {

            id: "behavioural",

            label: "Behavioural",
            description: "Rate behaviours and add comments for the 20% section.",

            content: (

              <BehaviouralAssessmentForm

                appraisalId={appraisal.id}

                mode="manager"

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
            description: "Review the combined score and set the final rating band.",

            content: (

              <OverallRatingPanel

                mode="manager"

                appraisalId={appraisal.id}

                kpiSectionWeight={

                  Number(appraisal.kpi_section_weight) || KPI_SECTION_WEIGHT_DEFAULT

                }

                behaviouralSectionWeight={

                  Number(appraisal.behavioural_section_weight) ||

                  BEHAVIOURAL_SECTION_WEIGHT_DEFAULT

                }

                kpiOverall={appraisal.kpi_overall_rating}

                kpiSectionActual={appraisal.kpi_section_actual}

                behaviouralOverall={appraisal.behavioural_overall_rating}

                behaviouralSectionActual={appraisal.behavioural_section_actual}

                overallScore={appraisal.overall_score}

                ratingLabel={appraisal.rating_label}

                managerComments={appraisal.manager_comments}

              />

            ),

          },

          {

            id: "dev-plan",

            label: "Dev plan",
            description: "Document strengths, gaps, and agreed development actions.",

            content: (

              <DevPlanPanel

                mode="manager"

                appraisalId={appraisal.id}

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


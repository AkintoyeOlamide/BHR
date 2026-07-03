import Link from "next/link";

import { redirect, notFound } from "next/navigation";

import { Logo } from "@/components/logo";

import { AppraisalWorkspace } from "@/components/appraisal/appraisal-workspace";

import { BehaviouralAssessmentForm } from "@/components/appraisal/behavioural-assessment-form";

import { DevPlanPanel } from "@/components/appraisal/dev-plan-panel";

import { OverallRatingPanel } from "@/components/appraisal/overall-rating-panel";

import { TechnicalAssessmentForm } from "@/components/appraisal/technical-assessment-form";

import { SignOutButton } from "@/components/sign-out-button";

import { requireProfile } from "@/lib/auth/profile";

import { createClient } from "@/lib/supabase/server";

import { getAppraisalBehaviouralItems } from "@/lib/behavioural/server";

import { getAppraisalKpis } from "@/lib/kpi/server";

import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";

import { BEHAVIOURAL_SECTION_WEIGHT_DEFAULT } from "@/lib/behavioural/calculations";

import { KPI_SECTION_WEIGHT_DEFAULT } from "@/lib/kpi/calculations";



type PageProps = { params: Promise<{ id: string }> };



export default async function EmployeeAppraisalPage({ params }: PageProps) {

  const { id } = await params;

  const session = await requireProfile();

  if (!session) redirect("/login");



  const supabase = await createClient();

  const { data: appraisal } = await supabase

    .from("appraisals")

    .select(

      `

      *,

      reviewer:profiles!appraisals_reviewer_id_fkey(full_name),

      cycle:appraisal_cycles(title, start_date, end_date)

    `

    )

    .eq("id", id)

    .eq("employee_id", session.profile.id)

    .single();



  if (!appraisal) notFound();



  const kpis = await getAppraisalKpis(appraisal.id);

  const behaviouralItems = await getAppraisalBehaviouralItems(appraisal.id);

  const reviewer = appraisal.reviewer as { full_name?: string } | null;

  const cycle = appraisal.cycle as { title?: string };



  const statusLabel =
    APPRAISAL_STATUS_LABELS[appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS];

  return (
    <div className="portal-light portal-page min-h-screen text-slate-900">
      <header className="portal-header sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Mobile */}
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
                {cycle.title ?? "Your performance review"}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={appraisalStatusBadgeClass(appraisal.status)}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
          {/* Desktop */}
          <div className="hidden h-16 items-center justify-between sm:flex">
            <Logo size="sm" theme="light" />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-8">
        <div className="mb-3 hidden sm:block sm:mb-6">
          <Link href="/dashboard" className="portal-link text-sm">
            ← Back to dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            {cycle.title ?? "Your performance review"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={appraisalStatusBadgeClass(appraisal.status)}>
              {statusLabel}
            </span>
            <span className="text-sm text-slate-500">
              Use the tabs to complete each section of your review.
            </span>
          </div>
        </div>

        <div className="sm:mt-2">

          <AppraisalWorkspace

            tabs={[

              {

                id: "technical",

                label: "Technical",
                description: "Fill in measurement areas for your KPI tasks.",

                content: (

                  <TechnicalAssessmentForm

                    appraisalId={appraisal.id}

                    mode="employee"

                    header={{

                      appraisee_name: session.profile.full_name,

                      department: appraisal.department ?? session.profile.department ?? "",

                      review_period: appraisal.review_period ?? "",

                      appraiser_name: appraisal.appraiser_name ?? reviewer?.full_name ?? "",

                      job_title: appraisal.job_title ?? session.profile.job_title ?? "",

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
                description: "Add comments on your behavioural competencies.",

                content: (

                  <BehaviouralAssessmentForm

                    appraisalId={appraisal.id}

                    mode="employee"

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
                description: "See your combined score once your manager completes the review.",

                content: (

                  <OverallRatingPanel

                    mode="employee"

                    appraisalId={appraisal.id}

                    appraisalStatus={appraisal.status}

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
                description: "Share your goals, strengths, and development priorities.",

                content: (

                  <DevPlanPanel

                    mode="employee"

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

        </div>

      </main>

    </div>

  );

}


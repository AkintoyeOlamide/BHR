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



  return (

    <div className="portal-light portal-page min-h-screen text-slate-900">

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">

          <Logo size="sm" />

          <SignOutButton />

        </div>

      </header>



      <main className="mx-auto max-w-6xl px-6 py-10">

        <Link href="/dashboard" className="text-sm text-teal-600 hover:text-teal-500">

          ← Back to dashboard

        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-slate-900">

          {cycle.title ?? "Your performance review"}

        </h1>

        <p className="mt-1 text-sm text-slate-600">

          Status:{" "}

          {APPRAISAL_STATUS_LABELS[appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS]}

          {" · "}

          Use the tabs to complete each section of your review.

        </p>



        <div className="mt-8">

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


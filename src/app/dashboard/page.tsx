import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin, canAccessManager } from "@/lib/auth/roles";
import { SignOutButton } from "@/components/sign-out-button";
import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";
import { VMO_EMPLOYEE_DIRECTORY } from "@/lib/setup/vmo-employee-directory";

export const dynamic = "force-dynamic";

function firstName(fullName: string) {
  const part = fullName.trim().split(/\s+/)[0];
  return part || fullName;
}

function directoryForEmail(email: string | null | undefined) {
  if (!email) return null;
  const key = email.trim().toLowerCase();
  return (
    VMO_EMPLOYEE_DIRECTORY.find(
      (entry) => entry.email.trim().toLowerCase() === key
    ) ?? null
  );
}

export default async function DashboardPage() {
  if (!getSupabaseEnv()) {
    redirect("/login");
  }

  const session = await requireProfile();
  if (!session) redirect("/login");

  const { user, profile } = session;

  if (canAccessAdmin(profile.role, profile.email)) redirect("/admin");
  if (canAccessManager(profile.role)) redirect("/manager");

  const supabase = await createClient();
  const { data: appraisals } = await supabase
    .from("appraisals")
    .select(
      `
      id, status, review_period, updated_at, submitted_at,
      cycle:appraisal_cycles(title)
    `
    )
    .eq("employee_id", user.id)
    .order("updated_at", { ascending: false });

  const rows = appraisals ?? [];
  const openCount = rows.filter(
    (a) => a.status === "not_started" || a.status === "in_progress"
  ).length;
  const withManagerCount = rows.filter((a) => a.status === "submitted").length;
  const doneCount = rows.filter((a) => a.status === "completed").length;
  const nextOpen = rows.find(
    (a) => a.status === "not_started" || a.status === "in_progress"
  );

  const directory = directoryForEmail(user.email ?? profile.email);
  const department =
    profile.department?.trim() || directory?.department || null;
  const jobTitle = profile.job_title?.trim() || directory?.job_title || null;

  return (
    <div className="portal-light portal-page min-h-screen text-slate-900">
      <header className="portal-header sticky top-0 z-40 border-b border-slate-200/70 bg-[#f4f6fb]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
          <Logo size="sm" theme="dark" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 sm:text-xs">
                Staff workspace
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Hello, {firstName(profile.full_name)}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Complete your Technical and Behavioural ratings, save your
                development plan, then assign the review to your manager.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/onboarding"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-white px-5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                Staff onboarding
              </Link>
              {nextOpen ? (
                <Link
                  href={`/dashboard/appraisals/${nextOpen.id}`}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Continue appraisal
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="portal-stat-grid mt-6 sm:mt-8">
          <div className="portal-stat-tile portal-stat-tile--amber">
            <p className="portal-stat-value">{openCount}</p>
            <p className="portal-stat-label">Open for you</p>
          </div>
          <div className="portal-stat-tile portal-stat-tile--violet">
            <p className="portal-stat-value">{withManagerCount}</p>
            <p className="portal-stat-label">With manager</p>
          </div>
          <div className="portal-stat-tile portal-stat-tile--emerald">
            <p className="portal-stat-value">{doneCount}</p>
            <p className="portal-stat-label">Submitted to HR</p>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.9fr)] lg:gap-8">
          <section className="min-w-0">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                  Your appraisals
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Open a review to rate yourself and send it to your manager.
                </p>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-800">
                  No appraisal assigned yet
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  When HR assigns a review cycle, it will show up here.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {rows.map((appraisal) => {
                  const title =
                    (appraisal.cycle as { title?: string } | null)?.title ??
                    "Performance review";
                  const status = appraisal.status as string;
                  const needsAction =
                    status === "not_started" || status === "in_progress";
                  const actionLabel =
                    status === "completed"
                      ? "View result"
                      : status === "submitted"
                        ? "View progress"
                        : status === "in_progress"
                          ? "Continue"
                          : "Start";

                  return (
                    <li key={appraisal.id}>
                      <Link
                        href={`/dashboard/appraisals/${appraisal.id}`}
                        className={`block rounded-2xl border bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-5 ${
                          needsAction
                            ? "border-indigo-100 ring-1 ring-indigo-50"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-base font-semibold text-slate-900">
                                {title}
                              </h3>
                              <span
                                className={appraisalStatusBadgeClass(status)}
                              >
                                {
                                  APPRAISAL_STATUS_LABELS[
                                    status as keyof typeof APPRAISAL_STATUS_LABELS
                                  ]
                                }
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-slate-500">
                              {appraisal.review_period
                                ? `Period: ${appraisal.review_period}`
                                : "Open to complete your self-review"}
                            </p>
                            {needsAction && (
                              <p className="mt-2 text-xs font-medium text-indigo-700">
                                Next: Technical → Behavioural → Dev plan →
                                Assign to manager
                              </p>
                            )}
                          </div>
                          <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white sm:mt-0.5">
                            {actionLabel}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside className="space-y-4 lg:pt-10">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Your profile
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Name
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {profile.full_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Work email
                  </dt>
                  <dd className="mt-1 break-all font-medium text-slate-900">
                    {user.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Department
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {department ?? "Not set"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Job title
                  </dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {jobTitle ?? "Not set"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                How it works
              </h2>
              <ol className="mt-3 space-y-2.5 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600">1.</span>
                  Rate Technical KPIs and Behavioural items, then save.
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600">2.</span>
                  Fill your Development plan.
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600">3.</span>
                  Choose your manager and assign the appraisal.
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

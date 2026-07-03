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
      id, status, review_period, updated_at,
      cycle:appraisal_cycles(title)
    `
    )
    .eq("employee_id", profile.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="portal-light portal-page min-h-screen text-slate-900">
      <header className="portal-header">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Logo size="sm" theme="dark" />
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Signed in
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Hello, {profile.full_name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            This is your personal Bitachon HR page. Open any review below to fill in your
            goals, achievements, and self-review.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="portal-section-title">Your appraisals</h2>
          <p className="mt-1 text-sm text-stone-500">
            Tap a review to open it and save your details.
          </p>

          <div className="mt-4">
            {(appraisals ?? []).length === 0 ? (
              <p className="text-sm text-stone-500">
                No review assigned yet. HR will assign your appraisal when the
                next cycle opens.
              </p>
            ) : (
              appraisals?.map((appraisal) => (
                <Link
                  key={appraisal.id}
                  href={`/dashboard/appraisals/${appraisal.id}`}
                  className="portal-list-item !items-start"
                >
                  <div className="flex w-full flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-stone-900">
                        {(appraisal.cycle as { title?: string })?.title ?? "Review"}
                      </h3>
                      {appraisal.review_period && (
                        <p className="text-sm text-stone-500">{appraisal.review_period}</p>
                      )}
                    </div>
                    <span className={appraisalStatusBadgeClass(appraisal.status)}>
                      {APPRAISAL_STATUS_LABELS[appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS]}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="portal-surface mt-12">
          <h2 className="portal-section-title">Your account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-stone-500">Work email</dt>
              <dd className="font-medium text-stone-900">{user.email}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-stone-500">Department</dt>
              <dd className="font-medium text-stone-900">
                {profile.department ?? "Not set"}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}

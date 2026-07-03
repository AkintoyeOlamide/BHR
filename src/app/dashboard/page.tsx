import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin, canAccessManager } from "@/lib/auth/roles";
import { SignOutButton } from "@/components/sign-out-button";
import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";

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
  const { data: appraisals } = await       supabase
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
    <div className="portal-light min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Logo size="sm" />
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <p className="text-sm font-medium text-teal-800">You are signed in</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Hello, {profile.full_name}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            This is your personal BHR page. Open any review below to fill in your
            goals, achievements, and self-review.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Your appraisals</h2>
          <p className="mt-1 text-sm text-slate-600">
            Tap a review to open it and save your details.
          </p>

          <div className="mt-4 space-y-3">
            {(appraisals ?? []).length === 0 ? (
              <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                No review assigned yet. HR will assign your appraisal when the
                next cycle opens.
              </article>
            ) : (
              appraisals?.map((appraisal) => (
                <Link
                  key={appraisal.id}
                  href={`/dashboard/appraisals/${appraisal.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {(appraisal.cycle as { title?: string })?.title ?? "Review"}
                      </h3>
                      {appraisal.review_period && (
                        <p className="text-sm text-slate-500">{appraisal.review_period}</p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        appraisal.status === "not_started" || appraisal.status === "in_progress"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-teal-100 text-teal-800"
                      }`}
                    >
                      {APPRAISAL_STATUS_LABELS[appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS]}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Your account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-slate-500">Work email</dt>
              <dd className="font-medium text-slate-900">{user.email}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-slate-500">Department</dt>
              <dd className="font-medium text-slate-900">
                {profile.department ?? "Not set"}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}

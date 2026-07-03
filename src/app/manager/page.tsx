import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalShell } from "@/components/layouts/portal-shell";
import { requireProfile } from "@/lib/auth/profile";
import { isFullHrSession } from "@/lib/auth/hr-access";
import { canAccessManager } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export default async function ManagerPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessManager(session.profile.role)) redirect("/dashboard");
  if (isFullHrSession(session)) redirect("/admin");

  const supabase = await createClient();
  const [{ count: pending }, { count: completed }, { data: appraisals }] =
    await Promise.all([
      supabase
        .from("appraisals")
        .select("*", { count: "exact", head: true })
        .in("status", ["not_started", "in_progress", "submitted"]),
      supabase
        .from("appraisals")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("appraisals")
        .select(
          "id, status, employee:profiles!appraisals_employee_id_fkey(full_name), cycle:appraisal_cycles(title)"
        )
        .order("updated_at", { ascending: false })
        .limit(6),
    ]);

  return (
    <PortalShell
      title="HR Manager"
      subtitle="Assign reviews, track employee progress, and complete manager appraisals."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-amber-800">Open appraisals</p>
          <p className="mt-2 text-3xl font-semibold text-amber-900">{pending ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <p className="text-sm text-teal-800">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-teal-900">{completed ?? 0}</p>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Team appraisals</h2>
          <Link
            href="/manager/appraisals"
            className="text-sm font-medium text-teal-600 hover:text-teal-500"
          >
            Manage all →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {(appraisals ?? []).length === 0 ? (
            <p className="text-sm text-slate-600">
              No appraisals yet. Go to Appraisals to assign the first one.
            </p>
          ) : (
            appraisals?.map((appraisal) => (
              <Link
                key={appraisal.id}
                href={`/manager/appraisals/${appraisal.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {(appraisal.employee as { full_name?: string })?.full_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {(appraisal.cycle as { title?: string })?.title}
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  {APPRAISAL_STATUS_LABELS[appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS]}
                </span>
              </Link>
            ))
          )}
        </div>
      </section>
    </PortalShell>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalShell } from "@/components/layouts/portal-shell";
import { requireProfile } from "@/lib/auth/profile";
import { isFullHrSession } from "@/lib/auth/hr-access";
import { canAccessManager } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";
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
      <div className="portal-stat-grid sm:max-w-lg">
        <div className="portal-stat-tile portal-stat-tile--amber">
          <p className="portal-stat-value">{pending ?? 0}</p>
          <p className="portal-stat-label">Open appraisals</p>
        </div>
        <div className="portal-stat-tile portal-stat-tile--emerald">
          <p className="portal-stat-value">{completed ?? 0}</p>
          <p className="portal-stat-label">Completed</p>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="portal-section-title">Team appraisals</h2>
          <Link href="/manager/appraisals" className="portal-link">
            Manage all →
          </Link>
        </div>
        <div className="mt-4">
          {(appraisals ?? []).length === 0 ? (
            <p className="text-sm text-stone-500">
              No appraisals yet. Go to Appraisals to assign the first one.
            </p>
          ) : (
            appraisals?.map((appraisal) => (
              <Link
                key={appraisal.id}
                href={`/manager/appraisals/${appraisal.id}`}
                className="portal-list-item"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {(appraisal.employee as { full_name?: string })?.full_name}
                  </p>
                  <p className="text-sm text-stone-500">
                    {(appraisal.cycle as { title?: string })?.title}
                  </p>
                </div>
                <span className={appraisalStatusBadgeClass(appraisal.status)}>
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

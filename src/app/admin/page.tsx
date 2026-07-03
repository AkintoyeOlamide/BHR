import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layouts/portal-shell";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export default async function AdminPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessAdmin(session.profile.role, session.profile.email)) redirect("/dashboard");

  const supabase = await createClient();

  const [{ count: employeeCount }, { count: cycleCount }, { count: appraisalCount }, { data: recentAppraisals }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("appraisal_cycles").select("*", { count: "exact", head: true }),
      supabase.from("appraisals").select("*", { count: "exact", head: true }),
      supabase
        .from("appraisals")
        .select("id, status, updated_at, employee:profiles!appraisals_employee_id_fkey(full_name)")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

  const stats = [
    { label: "Employees", value: employeeCount ?? 0, tone: "portal-stat-tile--blue" },
    { label: "Review cycles", value: cycleCount ?? 0, tone: "portal-stat-tile--violet" },
    { label: "Appraisals", value: appraisalCount ?? 0, tone: "portal-stat-tile--teal" },
  ] as const;

  return (
    <PortalShell
      title="Admin"
      subtitle="Manage the full Bitachon HR system — staff, review cycles, and all appraisals."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <div className="portal-stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`portal-stat-tile ${stat.tone}`}>
            <p className="portal-stat-value">{stat.value}</p>
            <p className="portal-stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="portal-surface mt-12">
        <h2 className="portal-section-title">Default admin accounts</h2>
        <ul className="mt-4 space-y-2 text-sm text-stone-600">
          <li>
            <strong className="font-medium text-stone-900">Super Admin:</strong> admin@bhr.com / bhradmin
          </li>
          <li>
            <strong className="font-medium text-stone-900">HR Manager:</strong> hr@bhr.com / bhradmin
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="portal-section-title">Recent appraisals</h2>
          <Link href="/admin/appraisals" className="portal-link">
            View all →
          </Link>
        </div>
        <div className="mt-4">
          {(recentAppraisals ?? []).length === 0 ? (
            <p className="text-sm text-stone-500">
              No appraisals yet. HR can assign them from the manager area.
            </p>
          ) : (
            recentAppraisals?.map((item) => (
              <Link
                key={item.id}
                href={`/manager/appraisals/${item.id}`}
                className="portal-list-item"
              >
                <span className="font-medium text-stone-900">
                  {(item.employee as { full_name?: string })?.full_name ?? "Employee"}
                </span>
                <span className={appraisalStatusBadgeClass(item.status)}>
                  {APPRAISAL_STATUS_LABELS[item.status as keyof typeof APPRAISAL_STATUS_LABELS]}
                </span>
              </Link>
            ))
          )}
        </div>
      </section>
    </PortalShell>
  );
}

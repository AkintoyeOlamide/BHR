import Link from "next/link";
import { redirect } from "next/navigation";
import { AssignedAppraisalsList } from "@/components/appraisal/assigned-appraisals-list";
import { PortalShell } from "@/components/layouts/portal-shell";
import { fetchAdminAppraisalList } from "@/lib/appraisals/admin-list";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";
import { getPortalNav } from "@/lib/navigation/portal-nav";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessAdmin(session.profile.role, session.profile.email)) redirect("/dashboard");

  const admin = createAdminClient();

  const [
    { count: employeeCount },
    { count: cycleCount },
    { count: appraisalCount },
    recentAppraisals,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("appraisal_cycles").select("*", { count: "exact", head: true }),
    admin.from("appraisals").select("*", { count: "exact", head: true }),
    fetchAdminAppraisalList(5),
  ]);

  const stats = [
    {
      label: "Employees",
      value: employeeCount ?? 0,
      tone: "portal-stat-tile--blue",
      href: "/admin/employees",
    },
    {
      label: "Review cycles",
      value: cycleCount ?? 0,
      tone: "portal-stat-tile--violet",
      href: "/admin/cycles",
    },
    {
      label: "Appraisals",
      value: appraisalCount ?? 0,
      tone: "portal-stat-tile--teal",
      href: "/admin/appraisals",
    },
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
          <Link
            key={stat.label}
            href={stat.href}
            className={`portal-stat-tile portal-stat-tile--link ${stat.tone}`}
          >
            <p className="portal-stat-value">{stat.value}</p>
            <p className="portal-stat-label">{stat.label}</p>
          </Link>
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
          <li>
            <strong className="font-medium text-stone-900">Facility Manager:</strong> facility@bhr.com / bhradmin
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="portal-section-title">Assigned appraisals</h2>
          <Link href="/admin/results" className="portal-link">
            View all results →
          </Link>
        </div>
        <div className="mt-4">
          <AssignedAppraisalsList appraisals={recentAppraisals} />
        </div>
      </section>
    </PortalShell>
  );
}

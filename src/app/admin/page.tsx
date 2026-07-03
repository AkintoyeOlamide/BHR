import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalShell } from "@/components/layouts/portal-shell";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
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

  return (
    <PortalShell
      title="Admin"
      subtitle="Manage the full BHR system — staff, review cycles, and all appraisals."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Employees", value: employeeCount ?? 0 },
          { label: "Review cycles", value: cycleCount ?? 0 },
          { label: "Appraisals", value: appraisalCount ?? 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-6">
        <h2 className="font-semibold text-violet-900">Default admin accounts</h2>
        <ul className="mt-3 space-y-2 text-sm text-violet-800">
          <li>
            <strong>Super Admin:</strong> admin@bhr.com / bhradmin
          </li>
          <li>
            <strong>HR Manager:</strong> hr@bhr.com / bhradmin
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent appraisals</h2>
          <Link
            href="/admin/appraisals"
            className="text-sm font-medium text-violet-600 hover:text-violet-500"
          >
            View all appraisals →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {(recentAppraisals ?? []).length === 0 ? (
            <p className="text-sm text-slate-600">No appraisals yet. HR can assign them from the manager area.</p>
          ) : (
            recentAppraisals?.map((item) => (
              <Link
                key={item.id}
                href={`/manager/appraisals/${item.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-200"
              >
                <span className="font-medium text-slate-900">
                  {(item.employee as { full_name?: string })?.full_name ?? "Employee"}
                </span>
                <span className="text-sm text-slate-500">
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

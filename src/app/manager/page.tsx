import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalShell } from "@/components/layouts/portal-shell";
import { requireProfile } from "@/lib/auth/profile";
import { isFullHrSession } from "@/lib/auth/hr-access";
import { canAccessManager } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { APPRAISAL_STATUS_LABELS } from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export const dynamic = "force-dynamic";

type ManagerListRow = {
  id: string;
  status: string;
  employee_name: string;
  cycle_title: string | null;
};

type AppraisalRow = {
  id: string;
  status: string;
  employee_id: string;
  cycle_id: string;
  submitted_at: string | null;
  updated_at: string | null;
};

async function loadReviewerAppraisals(reviewerIds: string[]) {
  const admin = createAdminClient();
  const ids = [...new Set(reviewerIds.filter(Boolean))];

  const { data, error } = await admin
    .from("appraisals")
    .select("id, status, employee_id, cycle_id, submitted_at, updated_at")
    .in("reviewer_id", ids)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as AppraisalRow[];
  if (rows.length === 0) {
    return [] as ManagerListRow[];
  }

  const employeeIds = [...new Set(rows.map((row) => row.employee_id))];
  const cycleIds = [...new Set(rows.map((row) => row.cycle_id))];

  const [{ data: profiles }, { data: cycles }] = await Promise.all([
    admin.from("profiles").select("id, full_name").in("id", employeeIds),
    admin.from("appraisal_cycles").select("id, title").in("id", cycleIds),
  ]);

  const nameById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id as string,
      (profile.full_name as string | null)?.trim() || "Staff",
    ])
  );
  const cycleById = new Map(
    (cycles ?? []).map((cycle) => [
      cycle.id as string,
      (cycle.title as string | null) ?? null,
    ])
  );

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    employee_name: nameById.get(row.employee_id) ?? "Staff",
    cycle_title: cycleById.get(row.cycle_id) ?? null,
    submitted_at: row.submitted_at,
    updated_at: row.updated_at,
  }));
}

export default async function ManagerPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessManager(session.profile.role)) redirect("/dashboard");
  if (isFullHrSession(session)) redirect("/admin");

  const reviewerIds = [session.profile.id, session.user.id].filter(Boolean);

  let allRows: Array<
    ManagerListRow & { submitted_at?: string | null; updated_at?: string | null }
  > = [];

  try {
    allRows = await loadReviewerAppraisals(reviewerIds);
  } catch {
    allRows = [];
  }

  const needsRating = allRows
    .filter((row) => row.status === "submitted")
    .sort((a, b) => {
      const aTime = a.submitted_at || a.updated_at || "";
      const bTime = b.submitted_at || b.updated_at || "";
      return bTime.localeCompare(aTime);
    })
    .slice(0, 12)
    .map(({ id, status, employee_name, cycle_title }) => ({
      id,
      status,
      employee_name,
      cycle_title,
    }));

  const recent = allRows.slice(0, 8).map(({ id, status, employee_name, cycle_title }) => ({
    id,
    status,
    employee_name,
    cycle_title,
  }));

  const needsCount = allRows.filter((row) => row.status === "submitted").length;
  const completedCount = allRows.filter((row) => row.status === "completed").length;

  return (
    <PortalShell
      title="Manager"
      subtitle="People who sent you their appraisal appear here for your manager ratings."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <div className="portal-stat-grid sm:max-w-lg">
        <div className="portal-stat-tile portal-stat-tile--amber">
          <p className="portal-stat-value">{needsCount}</p>
          <p className="portal-stat-label">Needs your rating</p>
        </div>
        <div className="portal-stat-tile portal-stat-tile--emerald">
          <p className="portal-stat-value">{completedCount}</p>
          <p className="portal-stat-label">Completed</p>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="portal-section-title">Needs your appraisal</h2>
          <Link href="/manager/appraisals" className="portal-link">
            View all →
          </Link>
        </div>
        <div className="mt-4">
          {needsRating.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-stone-500">
              No staff have assigned an appraisal to you yet. When they finish
              their self-ratings and click Assign to manager, they show up here.
            </p>
          ) : (
            needsRating.map((appraisal) => (
              <Link
                key={appraisal.id}
                href={`/manager/appraisals/${appraisal.id}`}
                className="portal-list-item"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {appraisal.employee_name}
                  </p>
                  <p className="text-sm text-stone-500">
                    {appraisal.cycle_title ?? "Performance review"}
                  </p>
                </div>
                <span className={appraisalStatusBadgeClass(appraisal.status)}>
                  {
                    APPRAISAL_STATUS_LABELS[
                      appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS
                    ]
                  }
                </span>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="portal-section-title">Recent team appraisals</h2>
        <div className="mt-4">
          {recent.length === 0 ? (
            <p className="text-sm text-stone-500">No appraisals yet.</p>
          ) : (
            recent.map((appraisal) => (
              <Link
                key={appraisal.id}
                href={`/manager/appraisals/${appraisal.id}`}
                className="portal-list-item"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {appraisal.employee_name}
                  </p>
                  <p className="text-sm text-stone-500">
                    {appraisal.cycle_title ?? "Performance review"}
                  </p>
                </div>
                <span className={appraisalStatusBadgeClass(appraisal.status)}>
                  {
                    APPRAISAL_STATUS_LABELS[
                      appraisal.status as keyof typeof APPRAISAL_STATUS_LABELS
                    ]
                  }
                </span>
              </Link>
            ))
          )}
        </div>
      </section>
    </PortalShell>
  );
}

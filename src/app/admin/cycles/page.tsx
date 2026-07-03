import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layouts/portal-shell";
import { CreateCycleForm } from "@/components/cycles/create-cycle-form";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { CYCLE_STATUS_LABELS } from "@/lib/types/appraisal";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export default async function AdminCyclesPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessAdmin(session.profile.role, session.profile.email)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: cycles } = await supabase
    .from("appraisal_cycles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <PortalShell
      title="Review cycles"
      subtitle="Create and manage company-wide appraisal periods."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <CreateCycleForm />
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">All cycles</h3>
          {(cycles ?? []).length === 0 ? (
            <p className="text-sm text-slate-600">No cycles yet.</p>
          ) : (
            cycles?.map((cycle) => (
              <article
                key={cycle.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-medium text-slate-900">{cycle.title}</h4>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {
                      CYCLE_STATUS_LABELS[
                        cycle.status as keyof typeof CYCLE_STATUS_LABELS
                      ]
                    }
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{cycle.description}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {cycle.start_date} → {cycle.end_date}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </PortalShell>
  );
}

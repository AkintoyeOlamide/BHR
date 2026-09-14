import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layouts/portal-shell";
import {
  ManagersTeamPanel,
  type TeamMember,
} from "@/components/admin/managers-team-panel";
import { requireProfile } from "@/lib/auth/profile";
import { ROLES, canAccessAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export const dynamic = "force-dynamic";

export default async function AdminManagersPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessAdmin(session.profile.role, session.profile.email)) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role, manager_id, department, job_title")
    .order("full_name");

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? "Unknown"])
  );

  const initialStaff: TeamMember[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    full_name: profile.full_name ?? "Unknown",
    email: "",
    role: (profile.role as string | null)?.trim() || ROLES.EMPLOYEE,
    department: (profile.department as string | null) ?? null,
    job_title: (profile.job_title as string | null) ?? null,
    manager_id: (profile.manager_id as string | null) ?? null,
    manager_name: profile.manager_id
      ? nameById.get(profile.manager_id) ?? null
      : null,
  }));

  return (
    <PortalShell
      title="Managers"
      subtitle="Promote staff to manager and assign who reports to whom. Only the assigned manager can enter manager ratings."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <ManagersTeamPanel initialStaff={initialStaff} />
    </PortalShell>
  );
}

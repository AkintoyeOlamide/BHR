import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layouts/portal-shell";
import { StaffDirectory } from "@/components/admin/staff-directory";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export default async function AdminEmployeesPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessAdmin(session.profile.role, session.profile.email)) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: employees } = await admin
    .from("profiles")
    .select("id, email, full_name, role, department, job_title")
    .order("full_name");

  return (
    <PortalShell
      title="Staff"
      subtitle="View all employees and managers. Promote staff to manager so they can complete assigned appraisals."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <StaffDirectory staff={employees ?? []} canPromoteToAdmin />
    </PortalShell>
  );
}

import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layouts/portal-shell";
import {
  StaffDirectory,
  type StaffMember,
} from "@/components/admin/staff-directory";
import { requireProfile } from "@/lib/auth/profile";
import { ROLES, canAccessAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export const dynamic = "force-dynamic";

export default async function AdminEmployeesPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessAdmin(session.profile.role, session.profile.email)) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: employees } = await admin
    .from("profiles")
    .select("id, full_name")
    .order("full_name");

  const initialStaff: StaffMember[] = (employees ?? []).map((employee) => ({
    id: employee.id,
    full_name: employee.full_name ?? "Unknown",
    email: "",
    role: ROLES.EMPLOYEE,
    department: null,
    job_title: null,
  }));

  return (
    <PortalShell
      title="Staff"
      subtitle="View all employees. Use the Managers tab to promote people and assign who reports to whom."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <StaffDirectory staff={initialStaff} canPromoteToAdmin />
    </PortalShell>
  );
}

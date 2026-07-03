import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layouts/portal-shell";
import { AppraisalsHub } from "@/components/appraisal/appraisals-hub";
import { requireProfile } from "@/lib/auth/profile";
import { isFullHrSession } from "@/lib/auth/hr-access";
import { canAccessManager } from "@/lib/auth/roles";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export default async function ManagerAppraisalsPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessManager(session.profile.role)) redirect("/dashboard");
  if (isFullHrSession(session)) redirect("/admin/appraisals");

  return (
    <PortalShell
      title="Appraisals"
      subtitle="Build the appraisal form, assign employees, and delegate reviews to line managers."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <AppraisalsHub
        role={session.profile.role}
        userId={session.profile.id}
        userEmail={session.profile.email}
      />
    </PortalShell>
  );
}

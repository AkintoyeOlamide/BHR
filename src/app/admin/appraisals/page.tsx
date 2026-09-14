import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layouts/portal-shell";
import { AppraisalsHub } from "@/components/appraisal/appraisals-hub";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export default async function AdminAppraisalsPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessAdmin(session.profile.role, session.profile.email)) redirect("/dashboard");

  return (
    <PortalShell
      title="Appraisals"
      subtitle="Open an assigned staff appraisal to view ratings, overall score, and dev plan. The form template is for setup only."
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

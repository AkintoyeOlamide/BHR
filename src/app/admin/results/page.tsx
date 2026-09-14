import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layouts/portal-shell";
import { ResultsTable } from "@/components/admin/results-table";
import { fetchAppraisalResults } from "@/lib/appraisals/results";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessAdmin(session.profile.role, session.profile.email)) {
    redirect("/dashboard");
  }

  const results = await fetchAppraisalResults();

  return (
    <PortalShell
      title="Results"
      subtitle="Filter by “Submitted to HR” to see appraisals managers have finished. Download as CSV or PDF."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <section className="portal-surface">
        <ResultsTable results={results} />
      </section>
    </PortalShell>
  );
}

import { redirect } from "next/navigation";
import { FacilityReportsDashboard } from "@/components/facility/facility-reports-dashboard";
import { PortalShell } from "@/components/layouts/portal-shell";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessFacility, ROLES } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { FacilityReport } from "@/lib/types/facility";
import type { NavItem } from "@/lib/navigation/portal-nav";

export const dynamic = "force-dynamic";

const facilityNav: NavItem[] = [
  { label: "Reports", href: "/facility" },
  { label: "BERP", href: "/berp" },
  { label: "Public form", href: "/reporting" },
];

type PageProps = {
  searchParams: Promise<{ report?: string }>;
};

export default async function FacilityDashboardPage({ searchParams }: PageProps) {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessFacility(session.profile.role, session.profile.email)) {
    redirect("/dashboard");
  }

  const { report: highlightReportId } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("facility_reports")
    .select("*")
    .order("created_at", { ascending: false });

  const reports = (data ?? []) as FacilityReport[];
  const nav =
    session.profile.role === ROLES.SUPER_ADMIN
      ? [
          { label: "Admin", href: "/admin" },
          ...facilityNav,
        ]
      : facilityNav;

  return (
    <PortalShell
      title="Facility reports"
      subtitle="Reports from /reporting. Update status, assign fixes, and keep notes as you work."
      role={session.profile.role}
      nav={nav}
    >
      <FacilityReportsDashboard
        reports={reports}
        highlightReportId={highlightReportId ?? null}
      />
    </PortalShell>
  );
}

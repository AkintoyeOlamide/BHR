import { BerpDashboard } from "@/components/berp/berp-dashboard";
import { requireProfile } from "@/lib/auth/profile";
import {
  canAccessBerp,
  getHomeRouteForRole,
  roleLabel,
} from "@/lib/auth/roles";
import { fetchBerpOverview } from "@/lib/berp/queries";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Staff Dashboard | BERP",
};

export default async function BerpAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await requireProfile();
  if (!session) redirect("/login?next=/berp");
  if (!canAccessBerp(session.profile.role, session.profile.email)) {
    redirect(
      getHomeRouteForRole(session.profile.role, session.profile.email)
    );
  }

  const { view } = await searchParams;
  const data = await fetchBerpOverview();

  return (
    <BerpDashboard
      live={data.live}
      staff={data.staff}
      clock={data.clock}
      leave={data.leave}
      updates={data.updates}
      pushMessages={data.pushMessages}
      pushDeliveries={data.pushDeliveries}
      errors={data.errors}
      initialView={view}
      viewer={{
        full_name: session.profile.full_name,
        email: session.profile.email,
        department: session.profile.department,
        job_title: session.profile.job_title,
        roleLabel: roleLabel(session.profile.role),
        homeHref: getHomeRouteForRole(
          session.profile.role,
          session.profile.email
        ),
      }}
    />
  );
}

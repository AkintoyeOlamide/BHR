import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layouts/portal-shell";
import { OnboardingProgressTable } from "@/components/admin/onboarding-progress-table";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";
import { listOnboardingLearners } from "@/lib/onboarding/server";
import { getPortalNav } from "@/lib/navigation/portal-nav";

export const dynamic = "force-dynamic";

export default async function AdminOnboardingPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessAdmin(session.profile.role, session.profile.email)) {
    redirect("/dashboard");
  }

  let rows: Awaited<ReturnType<typeof listOnboardingLearners>> = [];
  let loadError: string | null = null;

  try {
    rows = await listOnboardingLearners();
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Could not load onboarding progress.";
  }

  return (
    <PortalShell
      title="Onboarding"
      subtitle="See who is watching BERP onboarding, where they are, and which departments they have finished."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <section className="space-y-4">
        {loadError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError.includes("onboarding_learners") ||
            loadError.toLowerCase().includes("relation")
              ? "Run migration 015_onboarding_progress.sql in Supabase, then refresh."
              : loadError}
          </div>
        ) : null}
        <OnboardingProgressTable rows={rows} />
      </section>
    </PortalShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { LaptopRequestsTable } from "@/components/admin/laptop-requests-table";
import { PortalShell } from "@/components/layouts/portal-shell";
import { requireProfile } from "@/lib/auth/profile";
import { canAccessAdmin } from "@/lib/auth/roles";
import { getPortalNav } from "@/lib/navigation/portal-nav";
import { createClient } from "@/lib/supabase/server";
import type { LaptopRequest } from "@/lib/types/laptop";

export const dynamic = "force-dynamic";

export default async function AdminLaptopsPage() {
  const session = await requireProfile();
  if (!session) redirect("/login");
  if (!canAccessAdmin(session.profile.role, session.profile.email)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("laptop_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const loadError = error?.message ?? null;
  const rows = (data ?? []) as LaptopRequest[];

  return (
    <PortalShell
      title="Laptop requests"
      subtitle="Submissions from the public /laptoprequest form. Each request is also emailed to the app inbox."
      role={session.profile.role}
      nav={getPortalNav(session.profile.role, session.profile.email)}
    >
      <section className="space-y-4">
        <p className="text-sm text-slate-500">
          Staff form:{" "}
          <Link href="/laptoprequest" className="font-medium text-indigo-600 hover:text-indigo-800">
            /laptoprequest
          </Link>
        </p>
        {loadError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadError.toLowerCase().includes("laptop_requests") ||
            loadError.toLowerCase().includes("relation")
              ? "Run migration 026_laptop_requests.sql in Supabase, then refresh."
              : loadError}
          </div>
        ) : null}
        <LaptopRequestsTable rows={rows} />
      </section>
    </PortalShell>
  );
}

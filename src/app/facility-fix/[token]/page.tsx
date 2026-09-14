import Link from "next/link";
import { AuthPageBackground } from "@/components/auth-page-background";
import { FacilityFixForm } from "@/components/facility/facility-fix-form";
import { Logo } from "@/components/logo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FacilityReport } from "@/lib/types/facility";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function FacilityFixPage({ params }: PageProps) {
  const { token } = await params;
  let report: FacilityReport | null = null;
  let loadError: string | null = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("facility_reports")
      .select("*")
      .eq("fix_token", token)
      .maybeSingle();

    if (error) {
      loadError = error.message;
    } else {
      report = (data as FacilityReport | null) ?? null;
    }
  } catch {
    loadError = "Could not load this link.";
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden text-slate-900">
      <AuthPageBackground />

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 w-full max-w-xl items-center justify-between gap-3 px-3 sm:h-14 sm:px-6">
          <Logo size="sm" theme="light" />
          <Link
            href="/"
            className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 sm:text-sm"
          >
            ← Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-xl px-3 py-6 sm:px-6 sm:py-10">
        {!report || loadError ? (
          <div className="rounded-2xl bg-white px-5 py-8 text-center shadow-sm ring-1 ring-slate-200">
            <h1 className="text-lg font-semibold text-slate-900">
              Link not available
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {loadError ??
                "This fix link is invalid or has expired. Ask Facility Manager for a new assignment email."}
            </p>
          </div>
        ) : (
          <FacilityFixForm
            token={token}
            issueTitle={report.issue_title}
            location={report.location}
            department={report.department}
            assigneeName={report.assigned_to_name}
            alreadySubmitted={Boolean(report.fix_submitted_at)}
            alreadyResolved={report.status === "resolved"}
          />
        )}
      </main>
    </div>
  );
}

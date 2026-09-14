import Link from "next/link";
import { Logo } from "@/components/logo";
import { FacilityReportForm } from "@/components/facility/facility-report-form";
import { AuthPageBackground } from "@/components/auth-page-background";

export default function ReportingPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden text-slate-900">
      <AuthPageBackground />

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-12 w-full max-w-3xl items-center justify-between gap-3 px-3 sm:h-14 sm:px-6 lg:px-8">
          <Logo size="sm" theme="light" />
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="shrink-0 touch-manipulation rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:text-sm"
            >
              Supervisor login
            </Link>
            <Link
              href="/"
              className="shrink-0 touch-manipulation rounded-lg px-2 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800 sm:text-sm"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-3 py-4 pb-8 sm:px-6 sm:py-8 sm:pb-12 lg:px-8">
        <div className="mb-4 max-w-xl sm:mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-block h-4 w-1 shrink-0 rounded-full bg-indigo-600 sm:h-5"
              aria-hidden
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-600 sm:text-[11px] sm:tracking-[0.18em]">
              Facility Reporting
            </p>
          </div>
          <h1 className="text-xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl">
            Report a facility issue
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:mt-2 sm:text-base">
            No login needed. Spotted a broken TV, AC, or anything else around the
            office? Submit a report with photos — Facility Manager gets notified
            right away.
          </p>
        </div>

        <FacilityReportForm />
      </main>
    </div>
  );
}

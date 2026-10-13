import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LaptopRequestForm } from "@/components/laptop/laptop-request-form";
import { AuthPageBackground } from "@/components/auth-page-background";

export const metadata: Metadata = {
  title: "Request a laptop | Bitachon HR",
  description:
    "Submit a laptop request. No login needed. Saved in Bitachon HR and emailed to the team.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function LaptopRequestPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden text-slate-900">
      <AuthPageBackground />

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex min-h-12 w-full max-w-3xl items-center justify-between gap-2 px-[max(0.75rem,env(safe-area-inset-left))] py-2 sm:min-h-14 sm:px-6 lg:px-8">
          <Logo size="sm" theme="light" />
          <nav className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            <Link
              href="/login"
              className="shrink-0 touch-manipulation rounded-lg px-2 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:px-3 sm:text-sm"
            >
              Login
            </Link>
            <Link
              href="/"
              className="shrink-0 touch-manipulation rounded-lg px-2 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800 sm:px-3 sm:text-sm"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 sm:pb-12 lg:px-8">
        <div className="mb-4 max-w-xl sm:mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-block h-4 w-1 shrink-0 rounded-full bg-indigo-600 sm:h-5"
              aria-hidden
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-600 sm:text-[11px] sm:tracking-[0.18em]">
              Laptop request
            </p>
          </div>
          <h1 className="text-[1.375rem] font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl">
            Request a laptop
          </h1>
          <p
            className="mt-3 rounded-xl bg-red-600 px-3 py-2.5 text-center text-sm font-bold leading-snug tracking-wide text-white shadow-sm shadow-red-600/30 sm:mt-4 sm:px-4 sm:py-3 sm:text-base"
            role="status"
          >
            This form closes on Wednesday at 10pm
          </p>
        </div>

        <LaptopRequestForm />
      </main>
    </div>
  );
}

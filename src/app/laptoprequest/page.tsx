import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { AuthPageBackground } from "@/components/auth-page-background";

export const metadata: Metadata = {
  title: "Laptop request closed | Bitachon HR",
  description: "The laptop request form is closed.",
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

      <main className="relative z-10 mx-auto w-full max-w-3xl px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] py-8 sm:px-6 sm:py-16 lg:px-8">
        <div className="rounded-2xl bg-white p-6 text-center shadow-md shadow-slate-900/5 sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-[11px]">
            Laptop request
          </p>
          <h1 className="mt-3 text-[1.375rem] font-semibold tracking-tight text-slate-900 sm:text-3xl">
            This form is closed
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Laptop requests are no longer being accepted.
          </p>
        </div>
      </main>
    </div>
  );
}

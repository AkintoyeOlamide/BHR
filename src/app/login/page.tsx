"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthPageBackground } from "@/components/auth-page-background";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

function BrandDecor({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={compact ? "login-grid-sm" : "login-grid"}
            width={compact ? "36" : "48"}
            height={compact ? "36" : "48"}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={compact ? "M 36 0 L 0 0 0 36" : "M 48 0 L 0 0 0 48"}
              fill="none"
              stroke="white"
              strokeWidth="0.4"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${compact ? "login-grid-sm" : "login-grid"})`}
        />
      </svg>

      {compact ? (
        <>
          <div className="absolute -top-16 -right-16 h-56 w-56 rotate-12 rounded-3xl bg-white/[0.06]" />
          <div className="absolute -top-10 -right-32 h-52 w-52 rotate-12 rounded-3xl bg-cyan-300/[0.10]" />
          <div className="absolute -bottom-24 -left-16 h-56 w-56 -rotate-12 rounded-3xl bg-white/[0.05]" />
          <div className="absolute top-16 right-8 h-2.5 w-2.5 rounded-full bg-cyan-300" />
          <div className="absolute bottom-10 right-24 h-1.5 w-1.5 rounded-full bg-orange-300" />
        </>
      ) : (
        <>
          <div className="absolute -top-24 -right-24 h-96 w-96 rotate-12 rounded-3xl bg-white/[0.06]" />
          <div className="absolute top-24 -right-40 h-80 w-80 rotate-12 rounded-3xl bg-cyan-300/[0.10]" />
          <div className="absolute -bottom-32 -left-24 h-96 w-96 -rotate-12 rounded-3xl bg-white/[0.05]" />
          <div className="absolute right-10 bottom-32 h-32 w-32 rounded-full border border-white/15" />
          <div className="absolute top-40 right-24 h-3 w-3 rounded-full bg-cyan-300" />
          <div className="absolute right-56 bottom-56 h-2 w-2 rounded-full bg-orange-300" />
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 flex h-1">
        <span className="flex-1 bg-cyan-400" />
        <span className="flex-1 bg-orange-400" />
        <span className="flex-1 bg-emerald-400" />
        <span className="flex-[2] bg-white/40" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden lg:flex-row">
      {/* Desktop indigo panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-indigo-700 text-white lg:flex lg:flex-col lg:justify-between">
        <BrandDecor />

        <div className="relative z-10 flex flex-col p-12">
          <Logo size="lg" theme="dark" />
        </div>

        <div className="relative z-10 max-w-md space-y-6 px-12">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-6 w-1 rounded-full bg-cyan-300" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Employee Portal
            </p>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Your reviews,
            <br />
            all in one place.
          </h1>
          <p className="text-base leading-relaxed text-indigo-100/90">
            Sign in with your work email to open assigned appraisals, track
            progress, and share feedback with your manager.
          </p>

          <ul className="grid gap-3 pt-2">
            {[
              { color: "bg-cyan-300", text: "Review forms live here" },
              { color: "bg-orange-300", text: "Progress is saved automatically" },
              { color: "bg-emerald-300", text: "Ask HR if you get stuck" },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <span className={`h-1.5 w-6 rounded-full ${item.color}`} aria-hidden />
                <span className="text-sm text-indigo-100">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center justify-between p-12">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-200/60">
            Your company HR portal
          </p>
          <p className="text-xs text-indigo-200/60">
            © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Mobile indigo hero */}
      <div className="relative overflow-hidden bg-indigo-700 pt-8 pb-24 text-white lg:hidden">
        <BrandDecor compact />

        <div className="relative z-10 px-5">
          <Logo size="sm" theme="dark" />
          <div className="mt-6 flex items-center gap-2.5">
            <span className="inline-block h-5 w-1 rounded-full bg-cyan-300" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
              Employee Portal
            </p>
          </div>
          <h1 className="mt-3 max-w-xs text-[26px] font-bold leading-[1.15] tracking-tight">
            Your reviews,
            <br />
            all in one place.
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-indigo-100/90">
            Sign in with your work email to open assigned appraisals.
          </p>
        </div>
      </div>

      {/* Sign-in card */}
      <div className="relative flex flex-1 flex-col justify-center lg:w-1/2">
        <AuthPageBackground />

        <div className="relative z-10 -mt-10 flex flex-1 flex-col px-5 pb-10 sm:px-6 lg:mt-0 lg:justify-center lg:px-16 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="auth-card-enter overflow-hidden rounded-2xl bg-white shadow-xl shadow-indigo-900/10 transition hover:shadow-2xl hover:shadow-indigo-900/15">
              <div className="auth-accent-bar h-1 w-full" />

              <div className="p-5 sm:p-8">
                <div className="auth-fade-up auth-fade-up-delay-1 mb-5 flex items-start gap-3.5 sm:mb-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                      Sign in
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 sm:text-base">
                      Staff: work email + code. Admin/HR: use Admin sign in
                      below.
                    </p>
                  </div>
                </div>
                <div className="auth-fade-up auth-fade-up-delay-2">
                  <AuthForm variant="landing" nextPath={nextPath} />
                </div>
              </div>
            </div>

            <p className="auth-fade-up auth-fade-up-delay-3 mt-6 text-center sm:mt-8">
              <Link
                href="/"
                className="text-sm font-medium text-indigo-600 transition hover:text-indigo-800"
              >
                ← Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthPageBackground } from "@/components/auth-page-background";

export function LandingSignInPanel() {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden lg:min-h-0">
      <AuthPageBackground />

      <header className="auth-fade-up relative z-10 flex h-14 shrink-0 items-center justify-between gap-3 px-4 sm:px-6 lg:h-14 lg:justify-end lg:px-8">
        <span className="text-sm font-semibold text-slate-900 lg:hidden">
          Bitachon HR
        </span>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/reporting"
            className="rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800"
          >
            Report an issue
          </Link>
          <a
            href="#how-it-works"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 lg:inline-flex"
          >
            How it works
          </a>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-2 sm:px-6 lg:py-8">
        <div className="mx-auto w-full max-w-[400px] sm:max-w-md">
          <div className="auth-card-enter overflow-hidden rounded-2xl bg-white shadow-md shadow-slate-900/5 transition hover:shadow-lg hover:shadow-indigo-900/10">
            <div className="auth-accent-bar h-1 w-full" />

            <div className="p-5 sm:p-6">
              <div className="auth-fade-up auth-fade-up-delay-1 mb-5 flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 transition group-hover:bg-indigo-600/15">
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
                  <p className="text-base font-semibold tracking-tight text-slate-900">
                    Welcome back
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Staff: work email + 4-digit code. Admin/HR: use the button
                    below for password sign-in.
                  </p>
                </div>
              </div>

              <div className="auth-fade-up auth-fade-up-delay-2">
                <AuthForm variant="landing" />
              </div>
            </div>
          </div>

          <p className="auth-fade-up auth-fade-up-delay-3 mt-5 text-center text-sm text-slate-500">
            No login?{" "}
            <Link
              href="/reporting"
              className="font-medium text-indigo-600 transition hover:text-indigo-800"
            >
              Report a facility issue
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

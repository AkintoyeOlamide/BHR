import { AuthForm } from "@/components/auth-form";

export function LandingSignInPanel() {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden lg:min-h-0">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#f1f5f9_0%,#e8eef7_45%,#f8fafc_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.08),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(6,182,212,0.06),transparent_35%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#94a3b808_1px,transparent_1px),linear-gradient(to_bottom,#94a3b808_1px,transparent_1px)] bg-[size:28px_28px]"
        aria-hidden
      />

      <header className="absolute top-0 right-0 left-0 z-10 flex h-12 items-center border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-sm lg:relative lg:h-14 lg:shrink-0 lg:justify-end lg:border-0 lg:bg-transparent lg:px-8">
        <span className="text-sm font-semibold text-slate-900 lg:hidden">
          Bitachon HR
        </span>
        <a
          href="#how-it-works"
          className="ml-auto hidden rounded-full border border-slate-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-slate-300 hover:text-slate-900 sm:text-sm lg:inline-flex"
        >
          How it works
        </a>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-5 sm:px-6 lg:py-8">
        <div className="mx-auto w-full max-w-[340px]">
          <div className="overflow-hidden rounded-xl bg-white/90 shadow-md shadow-slate-900/5 backdrop-blur-sm">
            <div className="flex h-0.5">
              <span className="flex-1 bg-cyan-400" />
              <span className="flex-1 bg-orange-400" />
              <span className="flex-1 bg-emerald-400" />
              <span className="flex-[2] bg-[#1e3a8a]" />
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1e3a8a]/10 text-[#1e3a8a]">
                  <svg
                    width="16"
                    height="16"
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
                  <p className="text-sm font-semibold tracking-tight text-slate-900">
                    Welcome back
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    Sign in with your work email.
                  </p>
                </div>
              </div>

              <AuthForm variant="landing" />
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-slate-500">
            First time here? Tap{" "}
            <span className="font-medium text-slate-700">
              &quot;Create account&quot;
            </span>{" "}
            inside the form.
          </p>
        </div>
      </div>
    </div>
  );
}

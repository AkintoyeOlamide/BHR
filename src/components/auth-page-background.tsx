/** Subtle, mature backdrop — layered geometry in muted solid colours */
export function AuthPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-slate-50" />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.35]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="auth-grid"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 64 0 L 0 0 0 64"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      <div className="auth-blob-drift absolute -top-32 -right-32 h-96 w-96 rounded-3xl bg-indigo-900/[0.06]" />
      <div className="auth-blob-drift-alt absolute -top-16 -right-52 h-96 w-96 rounded-3xl bg-slate-800/[0.04]" />

      <div className="auth-blob-drift-alt absolute -bottom-40 -left-20 h-80 w-80 rounded-3xl bg-teal-900/[0.05]" />
      <div className="auth-blob-drift absolute -bottom-24 left-24 h-64 w-64 rounded-3xl bg-slate-700/[0.04]" />

      <div className="animate-orbit-slow absolute top-[38%] right-[8%] hidden h-2 w-2 rounded-full bg-slate-400/40 sm:block" />
      <div className="animate-orbit-medium absolute top-[62%] left-[10%] hidden h-1.5 w-1.5 rounded-full bg-slate-400/40 sm:block" />
      <div className="animate-orbit-fast absolute bottom-[24%] right-[24%] hidden h-1 w-1 rounded-full bg-slate-400/40 sm:block" />

      <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-slate-200 lg:block" />
    </div>
  );
}

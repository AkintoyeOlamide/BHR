import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Sign in",
    description: "Use the work email your company gave you.",
  },
  {
    number: "2",
    title: "Do your review",
    description: "Fill in your form when review time comes.",
  },
  {
    number: "3",
    title: "Check your status",
    description: "See what is done and what is still waiting.",
  },
];

export function LandingBrandPanel() {
  return (
    <div className="relative hidden min-h-screen flex-col overflow-hidden bg-[#0b1a3d] text-white lg:flex lg:w-[44%] xl:w-[42%]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.3),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.15),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
        <Link
          href="/"
          className="self-start text-base font-semibold tracking-tight text-white"
        >
          Bitachon HR
        </Link>

        <div className="mt-8 flex flex-1 flex-col justify-center lg:mt-10">
          <div className="mb-3 flex gap-1">
            <span className="h-1 w-7 rounded-full bg-cyan-400" />
            <span className="h-1 w-7 rounded-full bg-orange-400" />
            <span className="h-1 w-7 rounded-full bg-emerald-400" />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-blue-200/70">
            For every employee
          </p>
          <h1 className="mt-2 max-w-md text-2xl font-semibold leading-snug tracking-tight sm:text-3xl lg:text-[2rem] lg:leading-tight">
            One simple place for your work reviews
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-blue-100/75">
            Sign in, complete your review, and track your progress — without
            confusing menus or HR jargon.
          </p>

          <ol className="mt-8 space-y-3.5 sm:mt-10">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold">
                  {step.number}
                </span>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-blue-100/65">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

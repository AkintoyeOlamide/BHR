import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BERP Terms of Use | Bitachon Enterprise",
  description: "Terms of use for the BERP staff mobile application.",
};

export default function BerpTermsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-12 text-stone-800">
      <article className="mx-auto max-w-2xl space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <header className="space-y-2 border-b border-stone-100 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Bitachon Enterprise
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            BERP Terms of Use
          </h1>
          <p className="text-sm text-stone-500">
            Last updated: 7 September 2026
          </p>
        </header>

        <section className="space-y-3 text-sm leading-relaxed text-stone-700">
          <p>
            BERP is an internal workplace application provided by Bitachon
            Enterprise for authorised staff. By creating an account or signing
            in, you agree to use the app only for legitimate work purposes.
          </p>
          <p>
            You must keep your login credentials confidential, provide accurate
            profile and attendance information, and follow company policies when
            clocking in, requesting leave, or posting updates.
          </p>
          <p>
            Bitachon Enterprise may suspend access if the app is misused, if
            credentials are shared, or if attendance records appear fraudulent.
            Features may change as workplace tools evolve.
          </p>
          <p>
            For questions, contact Bitachon Enterprise HR / IT through your
            usual internal channels.
          </p>
        </section>
      </article>
    </main>
  );
}

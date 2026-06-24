import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Appraisals",
    description: "Structured review cycles with clear scoring and audit trails.",
  },
  {
    title: "Team visibility",
    description: "Managers see their team. HR sees the org. Everyone sees what they need.",
  },
  {
    title: "Secure access",
    description: "Role-based sign-in powered by Supabase for ~200 employees.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link href="/login">
              <Button>Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-4 py-1 text-sm font-medium text-teal-700">
              HR platform for growing teams
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight">
              People management,{" "}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                simplified
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              BHR helps you run appraisals, track performance, and manage your
              workforce — built for teams of around 200 employees.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login">
                <Button className="min-w-[160px]">Sign in to BHR</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="min-w-[160px]">
                  Create account
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-20 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-slate-500">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} BHR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

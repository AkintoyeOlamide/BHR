import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { label: "Overview", href: "/dashboard", active: true },
  { label: "Appraisals", href: "#", active: false },
  { label: "Team", href: "#", active: false },
  { label: "Reports", href: "#", active: false },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Logo />
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                item.active
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-md">
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>
          <p className="hidden text-sm text-slate-600 lg:block">
            Signed in as{" "}
            <span className="font-medium text-slate-900">{user.email}</span>
          </p>
          <SignOutButton />
        </header>

        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
            <p className="mt-1 text-slate-600">
              Your HR workspace is ready. More modules coming soon.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Employees", value: "—", hint: "Connect Supabase" },
              { label: "Active cycles", value: "0", hint: "No cycles yet" },
              { label: "Pending reviews", value: "0", hint: "All caught up" },
              { label: "Completion rate", value: "—", hint: "Start a cycle" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              Next steps
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
              Add your Supabase project URL and anon key to{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                .env.local
              </code>
              , then we&apos;ll wire up employees, appraisal cycles, and
              calculations.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

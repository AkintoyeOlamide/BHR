"use client";

import Link from "next/link";
import {
  ACCENT_CLASSES,
  ONBOARDING_DEPARTMENTS,
} from "@/lib/onboarding/content";
import { useOnboardingTracker } from "@/components/onboarding/onboarding-tracker";

type OnboardingShellProps = {
  children: React.ReactNode;
  activeDepartmentId?: string;
  /** Compact chrome for lesson player */
  dense?: boolean;
};

export function OnboardingShell({
  children,
  activeDepartmentId,
  dense = false,
}: OnboardingShellProps) {
  const { identity, learner, clearSession, departmentStatus } =
    useOnboardingTracker();

  const completedCount = ONBOARDING_DEPARTMENTS.filter(
    (dept) => departmentStatus(dept.id) === "completed"
  ).length;
  const inProgressCount = ONBOARDING_DEPARTMENTS.filter(
    (dept) => departmentStatus(dept.id) === "in_progress"
  ).length;
  const totalCount = ONBOARDING_DEPARTMENTS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const nextOpen =
    ONBOARDING_DEPARTMENTS.find(
      (dept) => departmentStatus(dept.id) !== "completed"
    ) ?? ONBOARDING_DEPARTMENTS[0];

  return (
    <div className="onboarding-shell portal-light min-h-screen text-slate-900">
      <div className="flex min-h-screen">
        <aside className="onboarding-rail sticky top-0 hidden h-screen w-[15.5rem] shrink-0 flex-col border-r border-slate-200/80 bg-white/90 py-5 backdrop-blur-md xl:flex xl:w-[16.5rem]">
          <div className="px-4">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2.5 rounded-xl transition hover:opacity-90"
              title="Onboarding home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b1a3d] text-[11px] font-bold tracking-wide text-white shadow-sm">
                B
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold tracking-tight text-slate-900">
                  BERP
                </span>
                <span className="block text-[11px] text-slate-500">
                  Onboarding
                </span>
              </span>
            </Link>
          </div>

          <div className="mt-7 px-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Departments
            </p>
          </div>

          <nav className="mt-3 min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
            <div className="flex flex-col gap-0.5">
              {ONBOARDING_DEPARTMENTS.map((dept, index) => {
                const active = dept.id === activeDepartmentId;
                const accent = ACCENT_CLASSES[dept.accent];
                const status = departmentStatus(dept.id);
                return (
                  <Link
                    key={dept.id}
                    href={`/onboarding/${dept.id}`}
                    title={dept.name}
                    className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums ${
                        active ? "bg-white/15 text-white" : `${accent.soft}`
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold tracking-tight">
                        {dept.navLabel}
                      </span>
                      <span
                        className={`block truncate text-[11px] ${
                          active ? "text-white/55" : "text-slate-400"
                        }`}
                      >
                        {status === "completed"
                          ? "Done"
                          : status === "in_progress"
                            ? "In progress"
                            : "Not started"}
                      </span>
                    </span>
                    {status === "completed" ? (
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          active ? "bg-emerald-300" : "bg-emerald-500"
                        }`}
                      />
                    ) : active ? (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="mt-auto space-y-3 border-t border-slate-200/80 px-3 pt-3">
            <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-200/80">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Your path
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {completedCount}/{totalCount}
                </p>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-orange-400 to-emerald-400 transition-[width] duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {completedCount === totalCount
                  ? "All departments complete."
                  : inProgressCount > 0
                    ? `${inProgressCount} in progress · keep going`
                    : "Start with Welcome, then move department by department."}
              </p>
              {nextOpen ? (
                <Link
                  href={`/onboarding/${nextOpen.id}`}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#0b1a3d] px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-950"
                >
                  {completedCount === 0 ? "Begin path" : "Continue"} →
                </Link>
              ) : null}
            </div>

            <div className="rounded-2xl bg-[#07122c] p-3.5 text-white">
              <div className="mb-2 flex gap-1">
                <span className="h-1 w-5 rounded-full bg-cyan-400" />
                <span className="h-1 w-5 rounded-full bg-orange-400" />
                <span className="h-1 w-5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-xs font-semibold">Tip</p>
              <p className="mt-1 text-[11px] leading-relaxed text-blue-100/75">
                Watch the video, then walk the slides once before moving on.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md ${
              dense ? "h-14" : "h-14 sm:h-16"
            }`}
          >
            <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Link
                  href="/onboarding"
                  className="text-base font-semibold tracking-tight text-slate-900"
                >
                  BERP
                </Link>
                <span className="hidden h-4 w-px bg-slate-300 sm:block" />
                <p className="truncate text-sm font-medium text-slate-700">
                  Staff onboarding
                </p>
              </div>
              {identity ? (
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <div className="hidden min-w-0 text-right sm:block">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {learner?.full_name ?? identity.fullName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {identity.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSession}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    Switch user
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          <div className="min-w-0 flex-1">{children}</div>

          <nav
            className="onboarding-mobile-nav sticky bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md xl:hidden"
            aria-label="Departments"
          >
            <div className="flex gap-1.5 overflow-x-auto px-2 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                href="/onboarding"
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  !activeDepartmentId
                    ? "bg-[#0b1a3d] text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                Home
              </Link>
              {ONBOARDING_DEPARTMENTS.map((dept) => {
                const active = dept.id === activeDepartmentId;
                const accent = ACCENT_CLASSES[dept.accent];
                const status = departmentStatus(dept.id);
                return (
                  <Link
                    key={dept.id}
                    href={`/onboarding/${dept.id}`}
                    title={dept.name}
                    className={`max-w-[9.5rem] shrink-0 truncate rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? accent.soft
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    {dept.navLabel}
                    {status === "completed" ? " ✓" : ""}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

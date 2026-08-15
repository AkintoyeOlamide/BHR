"use client";

import Link from "next/link";
import {
  ACCENT_CLASSES,
  getFirstLessonPath,
  ONBOARDING_DEPARTMENTS,
} from "@/lib/onboarding/content";
import { useOnboardingTracker } from "@/components/onboarding/onboarding-tracker";

const BRAND = "Bitachon";

function statusLabel(status: "not_started" | "in_progress" | "completed") {
  if (status === "completed") return "Done";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

export function OnboardingWelcome() {
  const line = "Welcome to Bitachon — your work starts here.";
  const { learner, departmentStatus, progress } = useOnboardingTracker();
  const completedCount = progress.filter((p) => p.status === "completed").length;

  return (
    <div className="pb-[4.5rem] xl:pb-0">
      <section className="onboarding-hero relative flex min-h-[calc(100svh-8.5rem)] flex-col justify-center overflow-hidden sm:min-h-[min(88vh,52rem)]">
        <div className="absolute inset-0 bg-[#07122c]" aria-hidden />
        <div className="onboarding-hero-mesh pointer-events-none absolute inset-0" aria-hidden />
        <div className="onboarding-hero-aurora pointer-events-none absolute inset-0" aria-hidden />
        <div className="onboarding-hero-sweep pointer-events-none absolute inset-0" aria-hidden />
        <div className="onboarding-hero-grid pointer-events-none absolute inset-0" aria-hidden />

        <div
          className="onboarding-orb onboarding-orb--cyan pointer-events-none absolute left-[4%] top-[18%] h-28 w-28 rounded-full sm:left-[8%] sm:top-[22%] sm:h-40 sm:w-40"
          aria-hidden
        />
        <div
          className="onboarding-orb onboarding-orb--indigo pointer-events-none absolute right-[6%] top-[12%] h-36 w-36 rounded-full sm:right-[18%] sm:top-[18%] sm:h-56 sm:w-56"
          aria-hidden
        />
        <div
          className="onboarding-orb onboarding-orb--orange pointer-events-none absolute bottom-[22%] left-[28%] h-24 w-24 rounded-full sm:bottom-[18%] sm:left-[38%] sm:h-32 sm:w-32"
          aria-hidden
        />

        <div className="onboarding-particles pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className={`onboarding-particle onboarding-particle--${i + 1}`}
            />
          ))}
        </div>

        <div
          className="onboarding-hero-mark pointer-events-none absolute inset-x-0 top-[38%] select-none text-center text-[min(72vw,18rem)] font-semibold leading-none text-white sm:inset-x-auto sm:right-[-8%] sm:top-1/2 sm:text-left sm:text-[min(48vw,20rem)] lg:right-[-6%] lg:text-[min(44vw,24rem)]"
          aria-hidden
        >
          B
        </div>

        <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-5 pb-20 pt-10 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8 lg:py-24">
          <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center sm:mx-0 sm:max-w-2xl sm:items-start sm:text-left">
            <h1 className="onboarding-hero-title text-[clamp(2.6rem,12vw,5.5rem)] font-semibold tracking-[-0.04em] text-white">
              <span className="sr-only">{BRAND}</span>
              <span aria-hidden className="inline-flex justify-center sm:justify-start">
                {BRAND.split("").map((letter, index) => (
                  <span
                    key={`${letter}-${index}`}
                    className="onboarding-letter inline-block"
                    style={{ animationDelay: `${0.08 + index * 0.055}s` }}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            </h1>

            <div className="onboarding-hero-rule mt-4 h-px w-14 origin-center bg-gradient-to-r from-cyan-300 via-orange-300 to-emerald-300 sm:mt-5 sm:w-16 sm:origin-left" />

            <p className="onboarding-hero-line mt-4 max-w-[18rem] text-[0.95rem] leading-relaxed text-white/65 sm:mt-5 sm:max-w-md sm:text-lg">
              {line}
            </p>

            <div className="onboarding-hero-cta mt-8 w-full sm:mt-10 sm:w-auto">
              <Link
                href={getFirstLessonPath("welcome")}
                className="onboarding-hero-btn group relative inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0b1a3d] sm:w-auto"
              >
                <span
                  className="onboarding-btn-glow pointer-events-none absolute inset-0 rounded-full"
                  aria-hidden
                />
                Begin onboarding
                <span
                  className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0b1a3d] text-white transition duration-300 group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>

        <a
          href="#departments"
          className="onboarding-hero-scroll absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40 transition hover:text-white/70 sm:bottom-8 sm:text-[11px]"
        >
          Departments
          <span className="onboarding-scroll-line relative h-7 w-px overflow-hidden bg-white/15 sm:h-10">
            <span className="onboarding-scroll-pip absolute left-0 top-0 h-3 w-px bg-white/80" />
          </span>
        </a>
      </section>

      <section
        id="departments"
        className="onboarding-depts relative scroll-mt-20 overflow-hidden"
      >
        <div className="onboarding-depts-glow pointer-events-none absolute inset-x-0 top-0 h-64" aria-hidden />

        <div className="relative mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
          <div className="onboarding-depts-header mb-6 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Explore
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-3xl lg:text-4xl">
                Departments
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 sm:mt-3 sm:text-base">
                {learner
                  ? `${learner.full_name}, start with Welcome, then explore how each team works.`
                  : "Start with Welcome, then explore how each team works."}
              </p>
            </div>
            <p className="text-sm text-slate-400">
              {completedCount}/{ONBOARDING_DEPARTMENTS.length} complete
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 xl:gap-5">
            {ONBOARDING_DEPARTMENTS.map((dept, index) => {
              const accent = ACCENT_CLASSES[dept.accent];
              const featured = index === 0;
              const status = departmentStatus(dept.id);
              const statusText = statusLabel(status);

              if (featured) {
                const previewPoster =
                  dept.lessons[0]?.videoPoster ?? dept.lessons[0]?.videoUrl;
                return (
                  <Link
                    key={dept.id}
                    href={getFirstLessonPath(dept.id)}
                    prefetch
                    className="onboarding-dept-featured group relative col-span-full overflow-hidden rounded-[1.15rem] bg-[#07122c] text-white sm:rounded-[1.35rem]"
                    style={{ animationDelay: "0.05s" }}
                  >
                    <div className="relative flex flex-col md:grid md:min-h-[20rem] md:grid-cols-[minmax(0,1.1fr)_minmax(14rem,0.9fr)] lg:min-h-[22rem]">
                      <div className="relative order-1 aspect-[16/10] w-full overflow-hidden md:order-2 md:aspect-auto md:h-full md:min-h-full md:p-5 md:pl-0 lg:p-6 lg:pl-0">
                        {previewPoster ? (
                          <div className="relative h-full w-full overflow-hidden md:rounded-2xl md:ring-1 md:ring-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewPoster}
                              alt=""
                              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                              loading="eager"
                              decoding="async"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07122c] via-[#07122c]/25 to-transparent md:via-transparent md:from-[#07122c]/45" />
                            <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-gradient-to-r from-[#07122c]/40 to-transparent md:block" />
                          </div>
                        ) : (
                          <div className="h-full min-h-[11rem] bg-white/5 md:rounded-2xl md:ring-1 md:ring-white/10" />
                        )}
                      </div>

                      <div className="relative order-2 z-[2] flex flex-col justify-between px-5 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-5 md:order-1 md:p-8 lg:p-10">
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            {dept.tagline ? (
                              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/85">
                                {dept.tagline}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/65">
                              {statusText}
                            </span>
                          </div>

                          <p className="mt-5 text-sm font-medium text-white/30 sm:mt-7 md:mt-8">
                            01
                          </p>
                          <h3 className="mt-1.5 text-[1.65rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-3xl lg:text-4xl">
                            {dept.name}
                          </h3>
                          <p className="mt-2.5 max-w-md text-sm leading-relaxed text-blue-100/70 sm:mt-3 sm:text-[0.95rem]">
                            {dept.description}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center gap-3 sm:mt-8">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0b1a3d] transition duration-300 group-hover:translate-x-1 group-hover:bg-cyan-50 sm:h-11 sm:w-11">
                            →
                          </span>
                          <span className="text-sm font-semibold text-white/90">
                            Watch intro
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={dept.id}
                  href={getFirstLessonPath(dept.id)}
                  prefetch
                  className="onboarding-dept-card group relative overflow-hidden rounded-[1.15rem] bg-white/80 p-4 backdrop-blur-sm ring-1 ring-slate-200/70 transition duration-300 sm:rounded-[1.25rem] sm:p-6"
                  style={{ animationDelay: `${0.06 + index * 0.05}s` }}
                >
                  <div
                    className={`onboarding-dept-accent absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 transition duration-500 group-hover:scale-y-100 ${accent.bar}`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold tabular-nums text-slate-300 transition group-hover:text-slate-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        status === "completed"
                          ? "text-emerald-600"
                          : status === "in_progress"
                            ? "text-amber-600"
                            : "text-slate-400"
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>

                  {dept.tagline ? (
                    <p
                      className={`mt-5 text-xs font-semibold uppercase tracking-[0.14em] ${accent.text}`}
                    >
                      {dept.tagline}
                    </p>
                  ) : (
                    <div className="mt-5" />
                  )}
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                    {dept.name}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">
                    {dept.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${accent.text} transition duration-300 group-hover:translate-x-0.5`}
                    >
                      Open path
                    </span>
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${accent.soft} transition duration-300 group-hover:translate-x-1`}
                    >
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

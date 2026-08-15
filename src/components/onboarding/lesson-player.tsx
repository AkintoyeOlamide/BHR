"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type {
  OnboardingDepartment,
  OnboardingLesson,
} from "@/lib/onboarding/types";
import { ACCENT_CLASSES, getNextLesson } from "@/lib/onboarding/content";
import { useOnboardingTracker } from "@/components/onboarding/onboarding-tracker";

type LessonPlayerProps = {
  department: OnboardingDepartment;
  lesson: OnboardingLesson;
};

export function LessonPlayer({ department, lesson }: LessonPlayerProps) {
  const accent = ACCENT_CLASSES[department.accent];
  const [slideIndex, setSlideIndex] = useState(0);
  const [mode, setMode] = useState<"video" | "slides">("video");
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const next = getNextLesson(department.id, lesson.id);
  const slide = lesson.slides[slideIndex];
  const lessonIndex = department.lessons.findIndex((l) => l.id === lesson.id);
  const { trackView, completeLesson, isLessonComplete, departmentStatus } =
    useOnboardingTracker();
  const lessonDone = isLessonComplete(department.id, lesson.id);
  const deptDone = departmentStatus(department.id) === "completed";

  useEffect(() => {
    setSlideIndex(0);
    setMode("video");
  }, [lesson.id]);

  useEffect(() => {
    void trackView(department.id, lesson.id);
  }, [department.id, lesson.id, trackView]);

  async function markComplete() {
    setSaving(true);
    await completeLesson(department.id, lesson.id);
    setSaving(false);
  }

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-3 py-4 pb-10 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8 lg:px-8 lg:py-8 lg:pb-8 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <div className="onboarding-fade-up mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
            >
              <span aria-hidden>←</span> All departments
            </Link>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
              {department.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {lessonDone ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Lesson complete
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  In progress
                </span>
              )}
              {deptDone ? (
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  Department complete
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!lessonDone ? (
              <button
                type="button"
                onClick={() => void markComplete()}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Mark lesson done"}
              </button>
            ) : null}
            {next ? (
              <Link
                href={`/onboarding/${department.id}/${next.id}`}
                className={`shrink-0 text-sm font-semibold ${accent.text} transition hover:opacity-80`}
              >
                Next lesson →
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="shrink-0 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
              >
                Back to welcome →
              </Link>
            )}
          </div>
        </div>

        <div className="onboarding-fade-up onboarding-fade-delay-1 overflow-hidden rounded-xl bg-[#0b1a3d] shadow-[0_20px_50px_-28px_rgba(11,26,61,0.55)] sm:rounded-2xl">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
            <p className="min-w-0 truncate text-xs font-medium text-white/90 sm:text-sm">
              {lessonIndex + 1}. {lesson.title}
            </p>
            <div className="flex shrink-0 rounded-full bg-white/10 p-0.5 text-[11px] font-medium sm:text-xs">
              <button
                type="button"
                onClick={() => setMode("video")}
                className={`rounded-full px-2.5 py-1.5 transition sm:px-3 ${
                  mode === "video"
                    ? "bg-white text-slate-900"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Video
              </button>
              <button
                type="button"
                onClick={() => setMode("slides")}
                className={`rounded-full px-2.5 py-1.5 transition sm:px-3 ${
                  mode === "slides"
                    ? "bg-white text-slate-900"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Slides
              </button>
            </div>
          </div>

          {mode === "video" ? (
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                key={lesson.videoUrl + lesson.id}
                className="h-full w-full object-contain"
                controls
                playsInline
                poster={lesson.videoPoster}
                preload="auto"
                onEnded={() => {
                  if (!lessonDone) void markComplete();
                }}
              >
                <source src={lesson.videoUrl} type="video/mp4" />
              </video>
            </div>
          ) : lesson.slidesPdfUrl ? (
            <div className="relative bg-[#0b1224]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 sm:px-4">
                <p className="text-xs text-white/70 sm:text-sm">
                  Slide deck
                </p>
                <a
                  href={lesson.slidesPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  Open PDF ↗
                </a>
              </div>
              <iframe
                title={`${lesson.title} slides`}
                src={`${lesson.slidesPdfUrl}#toolbar=1&navpanes=0`}
                className="h-[min(55vh,22rem)] w-full bg-slate-100 sm:h-[min(70vh,36rem)]"
              />
            </div>
          ) : (
            <div className="relative flex min-h-[16rem] flex-col justify-between bg-gradient-to-br from-[#0b1a3d] via-indigo-950 to-slate-900 p-4 sm:aspect-video sm:min-h-0 sm:p-8 md:p-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse at 20% 20%, rgba(34,211,238,0.25), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(251,146,60,0.18), transparent 45%)",
                }}
                aria-hidden
              />
              <div className="relative">
                {slide?.eyebrow ? (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90 sm:text-xs">
                    {slide.eyebrow}
                  </p>
                ) : null}
                <h2 className="mt-2 max-w-xl text-xl font-semibold tracking-tight text-white sm:mt-3 sm:text-2xl md:text-3xl">
                  {slide?.title}
                </h2>
              </div>
              <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-blue-100/85 sm:mt-6 sm:text-base md:text-lg">
                {slide?.body}
              </p>
              <div className="relative mt-6 flex items-center justify-between gap-2 sm:mt-8 sm:gap-3">
                <button
                  type="button"
                  disabled={slideIndex === 0}
                  onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                  className="rounded-xl bg-white/10 px-2.5 py-2 text-xs font-medium text-white transition hover:bg-white/15 disabled:opacity-30 sm:px-3 sm:text-sm"
                >
                  Prev
                </button>
                <p className="text-xs text-white/60 sm:text-sm">
                  {slideIndex + 1} / {lesson.slides.length}
                </p>
                <button
                  type="button"
                  disabled={slideIndex >= lesson.slides.length - 1}
                  onClick={() =>
                    setSlideIndex((i) =>
                      Math.min(lesson.slides.length - 1, i + 1)
                    )
                  }
                  className="rounded-xl bg-white px-2.5 py-2 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-50 disabled:opacity-30 sm:px-3 sm:text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {!lesson.slidesPdfUrl ? (
        <div className="onboarding-fade-up onboarding-fade-delay-2 -mx-3 mt-4 flex gap-2 overflow-x-auto px-3 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:gap-2.5 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {lesson.slides.map((item, index) => {
            const active = mode === "slides" && index === slideIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMode("slides");
                  setSlideIndex(index);
                }}
                className={`group relative h-14 w-24 shrink-0 overflow-hidden rounded-xl border-2 text-left transition sm:h-[4.5rem] sm:w-32 ${
                  active
                    ? "border-slate-900"
                    : "border-transparent ring-1 ring-slate-200 hover:ring-slate-300"
                }`}
              >
                <span className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
                <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/70 to-transparent p-1.5 sm:p-2">
                  <span className="truncate text-[9px] font-semibold text-white sm:text-[10px]">
                    {index + 1}. {item.title}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        ) : null}

        <div className="onboarding-fade-up onboarding-fade-delay-3 mt-6 flex flex-wrap items-start justify-between gap-3 border-t border-slate-200/80 pt-5 sm:mt-8 sm:gap-4 sm:pt-6">
          <div className="max-w-2xl">
            <p className="text-sm text-slate-500">
              A module by{" "}
              <span className={`font-semibold ${accent.text}`}>
                Bitachon {department.name}
              </span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {lesson.summary}
            </p>
          </div>
          <p className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
            {lesson.durationLabel}
          </p>
        </div>

        <section className="mt-8 sm:mt-10">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            Lessons in this department
          </h2>
          <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
            {department.lessons.map((item, index) => {
              const isCurrent = item.id === lesson.id;
              return (
                <li key={item.id}>
                  <Link
                    href={`/onboarding/${department.id}/${item.id}`}
                    className={`flex gap-3 rounded-2xl p-2.5 transition sm:gap-4 sm:p-4 ${
                      isCurrent
                        ? "bg-white shadow-sm ring-1 ring-slate-200"
                        : "hover:bg-white/70"
                    }`}
                  >
                    <div
                      className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-36 ${accent.soft}`}
                    >
                      <div
                        className={`absolute left-0 top-0 h-1 w-full ${accent.bar}`}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-base font-semibold opacity-60 sm:text-lg">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 sm:text-base">
                          {index + 1}. {item.title}
                        </p>
                        <span className="text-xs text-slate-400">
                          {item.durationLabel}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 sm:text-sm">
                        {item.summary}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <aside className="onboarding-fade-up onboarding-fade-delay-2 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 lg:space-y-0 lg:pt-14">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Progress
          </p>
          <p className="mt-2 text-sm font-medium text-slate-800">
            Lesson {lessonIndex + 1} of {department.lessons.length}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${accent.bar}`}
              style={{
                width: `${((lessonIndex + 1) / department.lessons.length) * 100}%`,
              }}
            />
          </div>
          <p className="mt-3 hidden text-xs leading-relaxed text-slate-500 sm:block">
            Switch between video and slides anytime. Slide thumbnails below the
            player jump to each key point.
          </p>
        </div>

        <div className="rounded-2xl bg-[#0b1a3d] p-4 text-white shadow-sm sm:p-5">
          <div className="mb-3 flex gap-1">
            <span className="h-1 w-6 rounded-full bg-cyan-400" />
            <span className="h-1 w-6 rounded-full bg-orange-400" />
            <span className="h-1 w-6 rounded-full bg-emerald-400" />
          </div>
          <p className="text-sm font-semibold">Tip for new staff</p>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/75">
            Watch the video once, then walk the slides and note one question for
            your line manager.
          </p>
        </div>

        {next ? (
          <Link
            href={`/onboarding/${department.id}/${next.id}`}
            className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 transition hover:ring-indigo-200 sm:col-span-2 sm:p-5 lg:col-span-1"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Up next
            </p>
            <p className="mt-2 font-semibold text-slate-900">{next.title}</p>
            <p className="mt-1 text-sm text-slate-500">{next.durationLabel}</p>
          </Link>
        ) : null}
      </aside>
    </div>
  );
}

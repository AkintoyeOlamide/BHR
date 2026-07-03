"use client";

import { useState } from "react";

export type AppraisalTabId =
  | "technical"
  | "behavioural"
  | "overall"
  | "dev-plan";

export type AppraisalTab = {
  id: AppraisalTabId;
  label: string;
  description: string;
  content: React.ReactNode;
};

const TAB_META: Record<
  AppraisalTabId,
  { step: number; accent: string; icon: React.ReactNode }
> = {
  technical: {
    step: 1,
    accent: "violet",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  behavioural: {
    step: 2,
    accent: "sky",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  overall: {
    step: 3,
    accent: "emerald",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  "dev-plan": {
    step: 4,
    accent: "amber",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3zm14 0h6v11a3 3 0 01-3 3h-1a4 4 0 01-4-4V3z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

type AppraisalWorkspaceProps = {
  tabs: AppraisalTab[];
  defaultTab?: AppraisalTabId;
};

export function AppraisalWorkspace({
  tabs,
  defaultTab = "technical",
}: AppraisalWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<AppraisalTabId>(defaultTab);
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const activeMeta = TAB_META[activeTab];
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <div className="appraisal-workspace">
      {/* Step progress — desktop */}
      <div className="mb-6 hidden sm:block">
        <div className="flex items-center">
          {tabs.map((tab, index) => {
            const meta = TAB_META[tab.id];
            const isActive = tab.id === activeTab;
            const isPast = index < activeIndex;

            return (
              <div key={tab.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="group flex items-center gap-3 text-left"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                      isActive
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : isPast
                          ? "bg-violet-100 text-violet-700"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    }`}
                  >
                    {isPast ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2.5 7l3 3 6-6"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      meta.step
                    )}
                  </span>
                  <span className="hidden lg:block">
                    <span
                      className={`block text-sm font-medium ${
                        isActive ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </span>
                </button>
                {index < tabs.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 rounded ${
                      index < activeIndex ? "bg-violet-300" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab cards — mobile + quick switch */}
      <div
        className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="tablist"
        aria-label="Appraisal sections"
      >
        {tabs.map((tab) => {
          const meta = TAB_META[tab.id];
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition sm:p-4 ${
                isActive
                  ? "border-violet-200 bg-white shadow-md shadow-violet-600/8 ring-1 ring-violet-100"
                  : "border-slate-200/80 bg-white/60 hover:border-slate-300 hover:bg-white hover:shadow-sm"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  isActive
                    ? "bg-violet-100 text-violet-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {meta.icon}
              </span>
              <span>
                <span
                  className={`block text-sm font-semibold ${
                    isActive ? "text-slate-900" : "text-slate-700"
                  }`}
                >
                  {tab.label}
                </span>
                <span className="mt-0.5 hidden text-xs text-slate-500 sm:block">
                  Step {meta.step}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Active section intro */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
            Step {activeMeta.step} of {tabs.length}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {active.label}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{active.description}</p>
        </div>
        {activeIndex < tabs.length - 1 && (
          <button
            type="button"
            onClick={() => setActiveTab(tabs[activeIndex + 1].id)}
            className="hidden shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-700 sm:inline-flex"
          >
            Next
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div
        role="tabpanel"
        className="animate-in fade-in duration-200"
        key={activeTab}
      >
        {active.content}
      </div>
    </div>
  );
}

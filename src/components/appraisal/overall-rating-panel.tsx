"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppraisalAlert,
  AppraisalPanel,
  AppraisalPanelHeader,
  AppraisalStickyFooter,
  AppraisalTableWrap,
  SaveButton,
} from "@/components/appraisal/appraisal-ui";
import { RATING_OPTIONS, type AppraisalStatus } from "@/lib/types/appraisal";

type OverallRatingPanelProps = {
  mode: "template" | "manager" | "employee";
  appraisalId?: string;
  appraisalStatus?: AppraisalStatus | string | null;
  kpiSectionWeight: number;
  behaviouralSectionWeight: number;
  kpiOverall?: number | null;
  kpiSectionActual?: number | null;
  behaviouralOverall?: number | null;
  behaviouralSectionActual?: number | null;
  overallScore?: number | null;
  ratingLabel?: string | null;
  managerComments?: string | null;
};

function formatScore(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return Number(value).toFixed(2);
}

export function OverallRatingPanel({
  mode,
  appraisalId,
  appraisalStatus = null,
  kpiSectionWeight,
  behaviouralSectionWeight,
  kpiOverall = null,
  kpiSectionActual = null,
  behaviouralOverall = null,
  behaviouralSectionActual = null,
  overallScore = null,
  ratingLabel = "",
  managerComments = "",
}: OverallRatingPanelProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isManager = mode === "manager" || mode === "template";
  const isTemplate = mode === "template";
  const isEmployee = mode === "employee";
  const employeeCanViewResults =
    appraisalStatus === "submitted" || appraisalStatus === "completed";

  const computedTotal = useMemo(() => {
    const kpi = Number(kpiSectionActual) || 0;
    const behavioural = Number(behaviouralSectionActual) || 0;
    return kpi + behavioural;
  }, [kpiSectionActual, behaviouralSectionActual]);

  const displayTotal =
    overallScore != null ? Number(overallScore) : computedTotal;

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!appraisalId || isTemplate) return;

    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/appraisals/${appraisalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating_label: form.get("rating_label"),
        manager_comments: form.get("manager_comments"),
      }),
    });

    setSaving(false);
    if (response.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <AppraisalPanel>
      <AppraisalPanelHeader
        title="Overall performance rating"
        subtitle={
          isEmployee
            ? employeeCanViewResults
              ? "Your final rating from your manager."
              : "Your manager will share your final rating after they complete the review."
            : "Your final score combines the technical and behavioural sections using their section weights."
        }
      />

      {(!isEmployee || employeeCanViewResults) && (
        <div className="border-b border-slate-100 px-0 py-6 md:px-6 md:py-8 lg:px-8">
          <div className="flex flex-col items-center justify-center px-0 py-6 text-center md:rounded-2xl md:border md:border-slate-200 md:px-6 md:py-8">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-slate-600 md:text-xs">
              Total score
            </p>
            <p className="appraisal-score-mobile mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 md:text-5xl">
              {formatScore(displayTotal)}
            </p>
            {!isTemplate && ratingLabel && (
              <p className="mt-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-800 md:text-sm">
                {ratingLabel}
              </p>
            )}
            {isTemplate && (
              <p className="mt-3 max-w-md text-xs text-slate-500 md:text-sm">
                Scores populate automatically when managers rate assigned
                appraisals ({kpiSectionWeight}% technical +{" "}
                {behaviouralSectionWeight}% behavioural).
              </p>
            )}
          </div>
        </div>
      )}

      {isEmployee && !employeeCanViewResults && (
        <div className="border-b border-slate-100 px-0 py-6 md:px-6 md:py-8 lg:px-8">
          <div className="px-0 py-6 text-center md:rounded-2xl md:border md:border-slate-200 md:px-6">
            <p className="text-xs font-medium text-slate-900 md:text-sm">
              Rating not available yet
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 md:text-sm">
              Complete your sections in the other tabs. Your manager will rate
              you and your final score will appear here when the review is
              finished.
            </p>
          </div>
        </div>
      )}

      {(!isEmployee || employeeCanViewResults) && (
      <AppraisalTableWrap>
        <table className="appraisal-data-table appraisal-summary-table w-full border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left md:px-6 lg:px-8">Section</th>
              <th className="px-3 py-3 text-center md:px-4">Weight</th>
              <th className="px-3 py-3 text-center md:px-4">Rating</th>
              <th className="px-4 py-3 text-center md:px-6 lg:px-8">Weighted</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td
                data-label="Technical (KPI)"
                className="appraisal-cell-index px-4 py-3 font-medium text-slate-800 md:px-6 md:py-4 lg:px-8"
              >
                Technical (KPI)
              </td>
              <td
                data-label="Weight"
                className="px-3 py-3 text-center tabular-nums text-slate-600 md:px-4 md:py-4"
              >
                {kpiSectionWeight}%
              </td>
              <td
                data-label="Rating"
                className="px-3 py-3 text-center tabular-nums font-medium md:px-4 md:py-4"
              >
                {formatScore(kpiOverall)}
              </td>
              <td
                data-label="Weighted"
                className="px-4 py-3 text-center text-sm font-semibold tabular-nums text-slate-900 md:px-6 md:py-4 md:text-base lg:px-8"
              >
                {formatScore(kpiSectionActual)}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <td
                data-label="Behavioural"
                className="appraisal-cell-index px-4 py-3 font-medium text-slate-800 md:px-6 md:py-4 lg:px-8"
              >
                Behavioural
              </td>
              <td
                data-label="Weight"
                className="px-3 py-3 text-center tabular-nums text-slate-600 md:px-4 md:py-4"
              >
                {behaviouralSectionWeight}%
              </td>
              <td
                data-label="Rating"
                className="px-3 py-3 text-center tabular-nums font-medium md:px-4 md:py-4"
              >
                {formatScore(behaviouralOverall)}
              </td>
              <td
                data-label="Weighted"
                className="px-4 py-3 text-center text-sm font-semibold tabular-nums text-slate-900 md:px-6 md:py-4 md:text-base lg:px-8"
              >
                {formatScore(behaviouralSectionActual)}
              </td>
            </tr>
          </tbody>
        </table>
      </AppraisalTableWrap>
      )}

      {!isTemplate && isManager && appraisalId && (
        <form
          id="overall-rating-form"
          onSubmit={handleSave}
          className="space-y-4 border-t border-slate-100 px-0 py-5 md:px-6 md:py-6 lg:px-8"
        >
          <label className="block space-y-2">
            <span className="text-xs font-medium text-slate-700 md:text-sm">
              Performance rating band
            </span>
            <select
              name="rating_label"
              defaultValue={ratingLabel ?? ""}
              className="h-10 w-full max-w-md rounded-xl border border-slate-200 px-3 text-xs text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 md:h-11 md:px-4 md:text-sm"
            >
              <option value="">Select rating</option>
              {RATING_OPTIONS.map((option) => (
                <option key={option.score} value={option.label}>
                  {option.score} — {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-medium text-slate-700 md:text-sm">
              Manager summary
            </span>
            <textarea
              name="manager_comments"
              rows={4}
              defaultValue={managerComments ?? ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 md:px-4 md:py-3 md:text-sm"
            />
          </label>
          {saved && (
            <AppraisalAlert variant="success">Overall rating saved.</AppraisalAlert>
          )}
        </form>
      )}

      {!isTemplate && mode === "employee" && employeeCanViewResults && (
        <div className="border-t border-slate-100 px-0 py-5 text-xs text-slate-600 md:px-6 md:py-6 md:text-sm lg:px-8">
          <p>
            Your rating:{" "}
            <span className="font-semibold text-slate-900">
              {ratingLabel || "Pending manager review"}
            </span>
          </p>
          {managerComments && (
            <p className="mt-3 rounded-xl border border-slate-200 p-4 leading-relaxed text-slate-700">
              {managerComments}
            </p>
          )}
        </div>
      )}

      {!isTemplate && isManager && appraisalId && (
        <AppraisalStickyFooter>
          <SaveButton
            loading={saving}
            label="Save overall rating"
            onClick={() => {
              const form = document.getElementById(
                "overall-rating-form"
              ) as HTMLFormElement;
              form?.requestSubmit();
            }}
          />
        </AppraisalStickyFooter>
      )}
    </AppraisalPanel>
  );
}

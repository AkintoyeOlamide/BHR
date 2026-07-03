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
        <div className="border-b border-slate-100 px-6 py-8 sm:px-8">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white px-6 py-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
              Total score
            </p>
            <p className="mt-2 text-5xl font-bold tabular-nums tracking-tight text-slate-900">
              {formatScore(displayTotal)}
            </p>
            {!isTemplate && ratingLabel && (
              <p className="mt-2 rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-800">
                {ratingLabel}
              </p>
            )}
            {isTemplate && (
              <p className="mt-3 max-w-md text-sm text-slate-500">
                Scores populate automatically when managers rate assigned
                appraisals ({kpiSectionWeight}% technical +{" "}
                {behaviouralSectionWeight}% behavioural).
              </p>
            )}
          </div>
        </div>
      )}

      {isEmployee && !employeeCanViewResults && (
        <div className="border-b border-slate-100 px-6 py-8 sm:px-8">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-6 py-8 text-center">
            <p className="text-sm font-medium text-amber-900">
              Rating not available yet
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-800">
              Complete your sections in the other tabs. Your manager will rate
              you and your final score will appear here when the review is
              finished.
            </p>
          </div>
        </div>
      )}

      {(!isEmployee || employeeCanViewResults) && (
      <AppraisalTableWrap>
        <table className="w-full min-w-[600px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-6 py-3 text-left sm:px-8">Section</th>
              <th className="px-4 py-3 text-center">Weight</th>
              <th className="px-4 py-3 text-center">Rating</th>
              <th className="px-6 py-3 text-center sm:px-8">Weighted</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="px-6 py-4 font-medium text-slate-800 sm:px-8">
                Technical (KPI)
              </td>
              <td className="px-4 py-4 text-center tabular-nums text-slate-600">
                {kpiSectionWeight}%
              </td>
              <td className="px-4 py-4 text-center tabular-nums font-medium">
                {formatScore(kpiOverall)}
              </td>
              <td className="px-6 py-4 text-center text-base font-semibold tabular-nums text-slate-900 sm:px-8">
                {formatScore(kpiSectionActual)}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="px-6 py-4 font-medium text-slate-800 sm:px-8">
                Behavioural
              </td>
              <td className="px-4 py-4 text-center tabular-nums text-slate-600">
                {behaviouralSectionWeight}%
              </td>
              <td className="px-4 py-4 text-center tabular-nums font-medium">
                {formatScore(behaviouralOverall)}
              </td>
              <td className="px-6 py-4 text-center text-base font-semibold tabular-nums text-slate-900 sm:px-8">
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
          className="space-y-4 border-t border-slate-100 px-6 py-6 sm:px-8"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Performance rating band
            </span>
            <select
              name="rating_label"
              defaultValue={ratingLabel ?? ""}
              className="h-11 w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
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
            <span className="text-sm font-medium text-slate-700">
              Manager summary
            </span>
            <textarea
              name="manager_comments"
              rows={4}
              defaultValue={managerComments ?? ""}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </label>
          {saved && (
            <AppraisalAlert variant="success">Overall rating saved.</AppraisalAlert>
          )}
        </form>
      )}

      {!isTemplate && mode === "employee" && employeeCanViewResults && (
        <div className="border-t border-slate-100 px-6 py-6 text-sm text-slate-600 sm:px-8">
          <p>
            Your rating:{" "}
            <span className="font-semibold text-slate-900">
              {ratingLabel || "Pending manager review"}
            </span>
          </p>
          {managerComments && (
            <p className="mt-3 rounded-xl bg-slate-50 p-4 leading-relaxed text-slate-700">
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

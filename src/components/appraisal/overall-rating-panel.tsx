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
  /** Manager ratings filled on all KPI rows */
  technicalManagerRated?: number;
  technicalTotal?: number;
  behaviouralManagerRated?: number;
  behaviouralTotal?: number;
  canSubmitToHr?: boolean;
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
  technicalManagerRated = 0,
  technicalTotal = 0,
  behaviouralManagerRated = 0,
  behaviouralTotal = 0,
  canSubmitToHr = false,
}: OverallRatingPanelProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const [selectedBand, setSelectedBand] = useState(ratingLabel ?? "");
  const isManager = mode === "manager" || mode === "template";
  const isTemplate = mode === "template";
  const isEmployee = mode === "employee";
  const withManager =
    appraisalStatus === "submitted" || appraisalStatus === "completed";
  const technicalDone =
    technicalTotal === 0 || technicalManagerRated >= technicalTotal;
  const behaviouralDone =
    behaviouralTotal === 0 || behaviouralManagerRated >= behaviouralTotal;
  const bandDone = Boolean(selectedBand?.trim() || ratingLabel?.trim());
  const managerRatingsDone = technicalDone && behaviouralDone;
  const staffCanSubmitToHr =
    isEmployee &&
    canSubmitToHr &&
    appraisalStatus === "submitted" &&
    managerRatingsDone;
  const managerCanSaveBand =
    isManager && !isTemplate && appraisalStatus === "submitted";

  const hasSectionScores =
    (kpiSectionActual != null && Number(kpiSectionActual) > 0) ||
    (behaviouralSectionActual != null && Number(behaviouralSectionActual) > 0) ||
    (kpiOverall != null && Number(kpiOverall) > 0) ||
    (behaviouralOverall != null && Number(behaviouralOverall) > 0) ||
    (overallScore != null && Number(overallScore) > 0);

  const showScoreBreakdown = !isEmployee || hasSectionScores || withManager;

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

  async function handleStaffSubmitToHr() {
    if (!appraisalId || !staffCanSubmitToHr) return;
    setCompleting(true);
    setCompleteMessage(null);

    const response = await fetch(`/api/appraisals/${appraisalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setCompleting(false);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setCompleteMessage(body.error ?? "Could not submit to HR.");
      return;
    }
    setCompleteMessage(
      body.hrNotified
        ? "Submitted to HR. They have been emailed and can see this in Results."
        : "Submitted to HR. They can see this under Results and Appraisals."
    );
    router.refresh();
  }

  return (
    <AppraisalPanel>
      <AppraisalPanelHeader
        title="Overall performance rating"
        subtitle={
          isEmployee
            ? withManager
              ? managerRatingsDone
                ? "Your manager has entered ratings. Review them on Technical and Behavioural, then submit to HR."
                : "Waiting for your manager to enter their ratings. They will appear here when saved."
              : "Combined score from your Technical and Behavioural ratings. Assign to your manager when ready."
            : "Save your rating band and comments. The employee reviews your ratings and submits to HR."
        }
      />

      {showScoreBreakdown ? (
        <div className="border-b border-slate-100 px-0 py-6 md:px-6 md:py-8 lg:px-8">
          <div className="flex flex-col items-center justify-center px-0 py-6 text-center md:rounded-2xl md:border md:border-slate-200 md:px-6 md:py-8">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-slate-600 md:text-xs">
              Total score
            </p>
            <p className="appraisal-score-mobile mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 md:text-5xl">
              {formatScore(displayTotal)}
            </p>
            {!isTemplate && ratingLabel && withManager && (
              <p className="mt-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-800 md:text-sm">
                {ratingLabel}
              </p>
            )}
            {isEmployee && !withManager && hasSectionScores && (
              <p className="mt-3 max-w-md text-xs text-slate-500 md:text-sm">
                Technical ({kpiSectionWeight}%) + Behavioural (
                {behaviouralSectionWeight}%) from the ratings you saved.
              </p>
            )}
            {isTemplate && (
              <p className="mt-3 max-w-md text-xs text-slate-500 md:text-sm">
                This is the blank form template only. Open an assigned appraisal
                to enter live ratings.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {showScoreBreakdown && (
        <AppraisalTableWrap title="Score breakdown" accent="emerald">
          <table className="appraisal-summary-table w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 md:px-6 lg:px-8">Section</th>
                <th className="px-3 py-3 text-center md:px-4">Weight</th>
                <th className="px-3 py-3 text-center md:px-4">Rating</th>
                <th className="px-4 py-3 text-center md:px-6 lg:px-8">Weighted</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td
                  data-label="Technical"
                  className="appraisal-cell-index px-4 py-3 font-medium text-slate-800 md:px-6 md:py-4 lg:px-8"
                >
                  Technical
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
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              disabled={!managerCanSaveBand && appraisalStatus === "completed"}
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
              readOnly={appraisalStatus === "completed"}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 md:px-4 md:py-3 md:text-sm"
            />
          </label>
          {saved && (
            <AppraisalAlert variant="success">
              Overall rating saved. Staff can see your ratings and submit to HR
              when every row is rated.
            </AppraisalAlert>
          )}
        </form>
      )}

      {!isTemplate && isEmployee && withManager && (
        <div className="border-t border-slate-100 px-0 py-5 text-xs text-slate-600 md:px-6 md:py-6 md:text-sm lg:px-8">
          <ul className="space-y-1.5">
            <ChecklistRow
              done={technicalDone}
              label={`Manager technical ratings (${technicalManagerRated}/${technicalTotal || "—"})`}
            />
            <ChecklistRow
              done={behaviouralDone}
              label={`Manager behavioural ratings (${behaviouralManagerRated}/${behaviouralTotal || "—"})`}
            />
          </ul>
          {ratingLabel && (
            <p className="mt-4">
              Manager rating band:{" "}
              <span className="font-semibold text-slate-900">{ratingLabel}</span>
            </p>
          )}
          {managerComments && (
            <p className="mt-3 rounded-xl border border-slate-200 p-4 leading-relaxed text-slate-700">
              {managerComments}
            </p>
          )}
        </div>
      )}

      {!isTemplate && isManager && appraisalId && (
        <AppraisalStickyFooter
          helper={
            appraisalStatus === "completed"
              ? "Staff has submitted this appraisal to HR."
              : managerCanSaveBand
                ? "Save manager ratings on Technical and Behavioural, then save the band here. Staff submits to HR."
                : "Waiting for the employee to assign this appraisal to you first."
          }
        >
          <div className="flex w-full flex-col gap-3">
            {managerCanSaveBand && (
              <ul className="space-y-1.5 text-xs text-slate-600 sm:text-sm">
                <ChecklistRow
                  done={technicalDone}
                  label={`Manager technical ratings (${technicalManagerRated}/${technicalTotal || "—"})`}
                />
                <ChecklistRow
                  done={behaviouralDone}
                  label={`Manager behavioural ratings (${behaviouralManagerRated}/${behaviouralTotal || "—"})`}
                />
                <ChecklistRow
                  done={bandDone}
                  label="Performance rating band selected"
                />
              </ul>
            )}
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
            {managerCanSaveBand && managerRatingsDone && (
              <p className="text-xs text-emerald-700">
                Manager ratings are complete. The employee can now submit this
                appraisal to HR.
              </p>
            )}
            {completeMessage && (
              <p className="text-xs text-emerald-700 sm:text-sm">
                {completeMessage}
              </p>
            )}
          </div>
        </AppraisalStickyFooter>
      )}

      {!isTemplate && isEmployee && appraisalId && withManager && (
        <AppraisalStickyFooter
          helper={
            appraisalStatus === "completed"
              ? "Submitted to HR."
              : staffCanSubmitToHr
                ? "Your manager’s ratings are in. Submit to HR when you are ready."
                : "Open Technical and Behavioural to see manager ratings as they are saved."
          }
        >
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={handleStaffSubmitToHr}
              disabled={completing || !staffCanSubmitToHr}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 sm:h-11 sm:px-5"
            >
              {completing
                ? "Submitting…"
                : appraisalStatus === "completed"
                  ? "Submitted to HR"
                  : "Submit to HR"}
            </button>
            {!staffCanSubmitToHr && appraisalStatus !== "completed" && (
              <p className="text-xs text-amber-700">
                Waiting for your manager to rate every Technical and Behavioural
                row.
              </p>
            )}
            {completeMessage && (
              <p className="text-xs text-emerald-700 sm:text-sm">
                {completeMessage}
              </p>
            )}
          </div>
        </AppraisalStickyFooter>
      )}
    </AppraisalPanel>
  );
}

function ChecklistRow({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
          done
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {done ? "✓" : "·"}
      </span>
      <span className={done ? "text-slate-800" : "text-slate-500"}>
        {label}
      </span>
    </li>
  );
}

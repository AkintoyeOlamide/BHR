"use client";

import Link from "next/link";
import {
  APPRAISAL_STATUS_LABELS,
  ASSESSMENT_TYPE_LABELS,
  type AppraisalStatus,
  type AssessmentType,
} from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";
import type { AdminAppraisalListItem } from "@/lib/appraisals/admin-list";
import { DeleteAppraisalButton } from "@/components/appraisal/delete-appraisal-button";

type AssignedAppraisalsListProps = {
  appraisals: AdminAppraisalListItem[];
  emptyMessage?: string;
  canDelete?: boolean;
};

export function AssignedAppraisalsList({
  appraisals,
  emptyMessage = "No appraisals assigned yet. Assign them from Staff or use Assign on the form template.",
  canDelete = true,
}: AssignedAppraisalsListProps) {
  if (appraisals.length === 0) {
    return <p className="text-sm text-stone-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {appraisals.map((appraisal) => {
        const score =
          appraisal.overall_score ?? appraisal.kpi_overall_rating;
        const status = appraisal.status as AppraisalStatus;
        const assessmentType =
          appraisal.assessment_type as AssessmentType;
        const readyForHr = status === "completed";

        return (
          <div
            key={appraisal.id}
            className={`portal-list-item group !block !items-stretch ${
              readyForHr ? "ring-1 ring-emerald-200 bg-emerald-50/40" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/manager/appraisals/${appraisal.id}`}
                className="min-w-0 flex-1"
              >
                <h4 className="font-medium text-stone-900">
                  {appraisal.employee_name}
                </h4>
                <p className="text-sm text-stone-500">
                  {appraisal.cycle_title}
                  {appraisal.review_period
                    ? ` · ${appraisal.review_period}`
                    : ""}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Reviewer: {appraisal.reviewer_name} ·{" "}
                  {ASSESSMENT_TYPE_LABELS[assessmentType] ?? "Both"}
                </p>
              </Link>
              <span className={appraisalStatusBadgeClass(status)}>
                {APPRAISAL_STATUS_LABELS[status]}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-stone-600">
                Score:{" "}
                <span className="font-semibold text-stone-900">
                  {score != null ? Number(score).toFixed(2) : "—"}
                </span>
                {appraisal.rating_label ? (
                  <span className="text-stone-500">
                    {" "}
                    · {appraisal.rating_label}
                  </span>
                ) : null}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {canDelete && (
                  <DeleteAppraisalButton
                    appraisalId={appraisal.id}
                    employeeName={appraisal.employee_name}
                    compact
                  />
                )}
                <Link
                  href={`/manager/appraisals/${appraisal.id}`}
                  className="portal-link text-xs"
                >
                  {readyForHr
                    ? "Open final review →"
                    : "View ratings, overall & dev plan →"}
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

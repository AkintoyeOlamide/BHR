"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteAppraisalButtonProps = {
  appraisalId: string;
  employeeName?: string;
  /** Compact text button for tables/lists */
  compact?: boolean;
  /** Redirect after delete (e.g. back to results) */
  redirectTo?: string;
  className?: string;
};

export function DeleteAppraisalButton({
  appraisalId,
  employeeName,
  compact = false,
  redirectTo,
  className = "",
}: DeleteAppraisalButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const label = employeeName?.trim() || "this appraisal";
    const confirmed = window.confirm(
      `Delete the appraisal for ${label}?\n\nThis cannot be undone. KPI ratings, behavioural ratings, and the development plan will also be removed.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/appraisals/${appraisalId}`, {
      method: "DELETE",
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not delete appraisal.");
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    router.refresh();
  }

  return (
    <span className={`inline-flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className={
          compact
            ? "text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
            : "inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50 sm:h-11 sm:px-5"
        }
      >
        {loading ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <span className="max-w-[180px] text-right text-[11px] text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}

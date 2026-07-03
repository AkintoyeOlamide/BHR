"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RATING_OPTIONS } from "@/lib/types/appraisal";

type AppraisalFormProps = {
  appraisalId: string;
  mode: "employee" | "manager";
  initial: {
    goals?: string | null;
    achievements?: string | null;
    strengths?: string | null;
    areas_for_improvement?: string | null;
    development_plan?: string | null;
    employee_self_review?: string | null;
    manager_comments?: string | null;
    overall_score?: number | null;
    rating_label?: string | null;
    review_period?: string | null;
    job_title?: string | null;
    department?: string | null;
    status?: string;
  };
};

function Field({
  label,
  name,
  defaultValue,
  rows = 3,
  readOnly = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  readOnly?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        readOnly={readOnly}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none read-only:bg-slate-50 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
      />
    </label>
  );
}

export function AppraisalForm({ appraisalId, mode, initial }: AppraisalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isManager = mode === "manager";

  async function save(body: Record<string, unknown>) {
    setLoading(true);
    setMessage(null);

    const response = await fetch(`/api/appraisals/${appraisalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error ?? "Could not save appraisal.");
      return false;
    }

    setMessage("Appraisal saved.");
    router.refresh();
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const body: Record<string, unknown> = {
      goals: form.get("goals"),
      achievements: form.get("achievements"),
      strengths: form.get("strengths"),
      areas_for_improvement: form.get("areas_for_improvement"),
      development_plan: form.get("development_plan"),
      employee_self_review: form.get("employee_self_review"),
      manager_comments: form.get("manager_comments"),
      review_period: form.get("review_period"),
      job_title: form.get("job_title"),
      department: form.get("department"),
      overall_score: form.get("overall_score")
        ? Number(form.get("overall_score"))
        : null,
      rating_label: form.get("rating_label"),
      status: isManager ? form.get("status") : "in_progress",
    };

    await save(body);
  }

  async function handleSubmitReview() {
    const form = document.getElementById("appraisal-form") as HTMLFormElement;
    const data = new FormData(form);

    await save({
      goals: data.get("goals"),
      achievements: data.get("achievements"),
      strengths: data.get("strengths"),
      areas_for_improvement: data.get("areas_for_improvement"),
      development_plan: data.get("development_plan"),
      employee_self_review: data.get("employee_self_review"),
      status: "submitted",
    });
  }

  return (
    <div className="space-y-6">
      <form id="appraisal-form" onSubmit={handleSubmit} className="space-y-4">
        {isManager && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Job title"
              name="job_title"
              defaultValue={initial.job_title ?? ""}
            />
            <Input
              label="Department"
              name="department"
              defaultValue={initial.department ?? ""}
            />
          </div>
        )}
        {isManager && (
          <Input
            label="Review period"
            name="review_period"
            defaultValue={initial.review_period ?? ""}
          />
        )}

        <Field label="Goals for this period" name="goals" defaultValue={initial.goals} />
        <Field label="Key achievements" name="achievements" defaultValue={initial.achievements} />
        <Field label="Strengths" name="strengths" defaultValue={initial.strengths} />
        <Field
          label="Areas for improvement"
          name="areas_for_improvement"
          defaultValue={initial.areas_for_improvement}
        />
        <Field
          label="Development plan"
          name="development_plan"
          defaultValue={initial.development_plan}
        />
        <Field
          label="Employee self-review"
          name="employee_self_review"
          defaultValue={initial.employee_self_review}
          rows={4}
          readOnly={isManager}
        />

        {isManager && (
          <>
            <Field
              label="Manager comments"
              name="manager_comments"
              defaultValue={initial.manager_comments}
              rows={4}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Overall score</span>
                <select
                  name="overall_score"
                  defaultValue={initial.overall_score?.toString() ?? ""}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900"
                >
                  <option value="">Select score</option>
                  {RATING_OPTIONS.map((option) => (
                    <option key={option.score} value={option.score}>
                      {option.score} — {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Rating label"
                name="rating_label"
                defaultValue={initial.rating_label ?? ""}
              />
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                name="status"
                defaultValue={initial.status ?? "in_progress"}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900"
              >
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="submitted">Submitted</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </>
        )}

        {message && (
          <p className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save appraisal"}
          </Button>
          {!isManager && (
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={handleSubmitReview}
            >
              Submit to HR
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

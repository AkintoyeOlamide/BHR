"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppraisalAlert,
  AppraisalPanel,
  AppraisalPanelHeader,
  AppraisalStickyFooter,
  SaveButton,
} from "@/components/appraisal/appraisal-ui";

type DevPlanPanelProps = {
  mode: "template" | "manager" | "employee";
  appraisalId?: string;
  initial: {
    strengths?: string | null;
    areas_for_improvement?: string | null;
    development_plan?: string | null;
    goals?: string | null;
  };
};

function Field({
  label,
  hint,
  name,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  hint?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block space-y-2">
      <div>
        <span className="text-sm font-medium text-slate-800">{label}</span>
        {hint && (
          <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        )}
      </div>
      <textarea
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
      />
    </label>
  );
}

export function DevPlanPanel({
  mode,
  appraisalId,
  initial,
}: DevPlanPanelProps) {
  const router = useRouter();
  const isTemplate = mode === "template";
  const isEmployee = mode === "employee";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    strengths: initial.strengths ?? "",
    areas_for_improvement: initial.areas_for_improvement ?? "",
    development_plan: initial.development_plan ?? "",
    goals: initial.goals ?? "",
  });

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    const url = isTemplate
      ? "/api/dev-plan-template"
      : `/api/appraisals/${appraisalId}`;

    const response = await fetch(url, {
      method: isTemplate ? "PUT" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error ?? "Could not save development plan.");
      return;
    }

    setMessage(
      isTemplate ? "Development plan template saved." : "Development plan saved."
    );
    router.refresh();
  }

  return (
    <AppraisalPanel>
      <AppraisalPanelHeader
        title="Development plan"
        subtitle={
          isEmployee
            ? "Share your goals for this review period."
            : "Capture strengths, growth areas, and concrete actions for the next review period."
        }
      />

      <div className="space-y-6 px-6 py-6 sm:px-8">
        <Field
          label="Goals for this period"
          hint="What should be achieved before the next review?"
          name="goals"
          value={form.goals}
          onChange={(goals) => setForm((f) => ({ ...f, goals }))}
        />
        {!isEmployee && (
          <>
            <Field
              label="Strengths"
              hint="What is this person doing well?"
              name="strengths"
              value={form.strengths}
              onChange={(strengths) => setForm((f) => ({ ...f, strengths }))}
            />
            <Field
              label="Areas for improvement"
              hint="Where is there room to grow?"
              name="areas_for_improvement"
              value={form.areas_for_improvement}
              onChange={(areas_for_improvement) =>
                setForm((f) => ({ ...f, areas_for_improvement }))
              }
            />
            <Field
              label="Development actions"
              hint="Specific training, projects, or support agreed with the employee."
              name="development_plan"
              value={form.development_plan}
              onChange={(development_plan) =>
                setForm((f) => ({ ...f, development_plan }))
              }
              rows={6}
            />
          </>
        )}

        {message && (
          <AppraisalAlert
            variant={message.includes("Could not") ? "error" : "success"}
          >
            {message}
          </AppraisalAlert>
        )}
      </div>

      <AppraisalStickyFooter
        helper={
          isEmployee
            ? "Save your goals when you are done — you can come back anytime."
            : "Save when you've finished this section — you can return anytime via the tabs above."
        }
      >
        <SaveButton
          loading={loading}
          label={
            isTemplate
              ? "Save template"
              : isEmployee
                ? "Save my goals"
                : "Save dev plan"
          }
          onClick={handleSave}
        />
      </AppraisalStickyFooter>
    </AppraisalPanel>
  );
}

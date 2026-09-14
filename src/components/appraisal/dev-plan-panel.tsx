"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssignToManagerCard } from "@/components/appraisal/assign-to-manager-card";
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
  appraisalStatus?: string;
  readOnly?: boolean;
  technicalRated?: number;
  technicalTotal?: number;
  behaviouralRated?: number;
  behaviouralTotal?: number;
  managerName?: string | null;
  hasManager?: boolean;
  initialManagerId?: string | null;
  showAssignCard?: boolean;
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
  readOnly = false,
}: {
  label: string;
  hint?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  readOnly?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <div>
        <span className="text-xs font-medium text-slate-800 md:text-sm">
          {label}
        </span>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      <textarea
        name={name}
        rows={rows}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-amber-200 read-only:bg-slate-50 md:px-4 md:py-3 md:text-sm"
      />
    </label>
  );
}

export function DevPlanPanel({
  mode,
  appraisalId,
  appraisalStatus = "not_started",
  readOnly = false,
  technicalRated = 0,
  technicalTotal = 0,
  behaviouralRated = 0,
  behaviouralTotal = 0,
  managerName = null,
  hasManager = false,
  initialManagerId = null,
  showAssignCard = true,
  initial,
}: DevPlanPanelProps) {
  const router = useRouter();
  const isTemplate = mode === "template";
  const isEmployee = mode === "employee";
  // Only the employee edits the live dev plan. Managers/HR are view-only.
  // After assignment (submitted) or submit to HR (completed), staff is locked too.
  const locked =
    !isTemplate &&
    (readOnly ||
      !isEmployee ||
      appraisalStatus === "submitted" ||
      appraisalStatus === "completed");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    strengths: initial.strengths ?? "",
    areas_for_improvement: initial.areas_for_improvement ?? "",
    development_plan: initial.development_plan ?? "",
    goals: initial.goals ?? "",
  });

  async function handleSave() {
    if (locked && !isTemplate) return;
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
    <div className="space-y-4">
      <AppraisalPanel accent="amber">
        <AppraisalPanelHeader
          accent="amber"
          title="Development plan"
          subtitle={
            isTemplate
              ? "Blank template used when new appraisals are assigned."
              : isEmployee
                ? locked
                  ? "Your development plan is locked. Managers and HR can view it but cannot edit it."
                  : "Write your goals, strengths, and development actions, then save. After you assign to your manager, no one else can edit it — including HR."
                : "Staff owns this section. You can view it, but only the employee can edit or save it."
          }
        />

        <div className="mx-4 space-y-5 rounded-lg bg-amber-50 p-4 md:mx-6 md:space-y-6 md:p-5 lg:mx-8">
          <Field
            label="Goals for this period"
            hint="What should be achieved before the next review?"
            name="goals"
            value={form.goals}
            readOnly={locked}
            onChange={(goals) => setForm((f) => ({ ...f, goals }))}
          />
          <Field
            label="Strengths"
            hint={
              isEmployee
                ? "What do you do well?"
                : "What is this person doing well?"
            }
            name="strengths"
            value={form.strengths}
            readOnly={locked}
            onChange={(strengths) => setForm((f) => ({ ...f, strengths }))}
          />
          <Field
            label="Areas for improvement"
            hint={
              isEmployee
                ? "Where do you want to grow?"
                : "Where is there room to grow?"
            }
            name="areas_for_improvement"
            value={form.areas_for_improvement}
            readOnly={locked}
            onChange={(areas_for_improvement) =>
              setForm((f) => ({ ...f, areas_for_improvement }))
            }
          />
          <Field
            label="Development actions"
            hint={
              isEmployee
                ? "Training, projects, or support that would help you."
                : "Specific training, projects, or support agreed with the employee."
            }
            name="development_plan"
            value={form.development_plan}
            readOnly={locked}
            onChange={(development_plan) =>
              setForm((f) => ({ ...f, development_plan }))
            }
            rows={6}
          />

          {message && (
            <AppraisalAlert
              variant={message.includes("Could not") ? "error" : "success"}
            >
              {message}
            </AppraisalAlert>
          )}
        </div>

        {locked && !isTemplate && (
          <div className="border-t border-amber-100 px-4 py-3 text-xs text-slate-600 md:px-6 md:text-sm lg:px-8">
            {isEmployee
              ? "Development plan locked — managers and HR can view only."
              : "View only — only the employee can edit this development plan."}
          </div>
        )}

        {!locked && (
          <AppraisalStickyFooter
            helper={
              isEmployee
                ? "Save your development plan. After you assign to your manager, no one else — including HR — can edit it."
                : isTemplate
                  ? "Save the blank template used for new appraisals."
                  : "View only."
            }
          >
            <SaveButton
              loading={loading}
              label={
                isTemplate
                  ? "Save template"
                  : "Save development plan"
              }
              onClick={handleSave}
            />
          </AppraisalStickyFooter>
        )}
      </AppraisalPanel>

      {isEmployee && appraisalId && showAssignCard ? (
        <div className="mt-4">
          <AssignToManagerCard
            appraisalId={appraisalId}
            status={appraisalStatus}
            technicalRated={technicalRated}
            technicalTotal={technicalTotal}
            behaviouralRated={behaviouralRated}
            behaviouralTotal={behaviouralTotal}
            managerName={managerName}
            initialManagerId={initialManagerId}
          />
        </div>
      ) : null}
    </div>
  );
}

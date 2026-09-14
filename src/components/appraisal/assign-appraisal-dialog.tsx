"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Option = { id: string; full_name: string; email: string; manager_id?: string | null };
type Cycle = { id: string; title: string };

type AssignOptions = {
  appraisers: Option[];
  employees: Option[];
  cycles: Cycle[];
  missingManagers?: string[];
  setupHint?: string;
};

type SelectedEmployeePayload = {
  id: string;
  full_name: string;
  email: string;
};

const selectClass =
  "h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200";

export function AssignAppraisalDialog({
  initialEmployeeId,
  initialEmployeeLabel,
  triggerLabel = "Assign",
  triggerClassName,
  onSuccess,
}: {
  initialEmployeeId?: string;
  initialEmployeeLabel?: string;
  triggerLabel?: string;
  triggerClassName?: string;
  onSuccess?: (message: string) => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [options, setOptions] = useState<AssignOptions | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    () => (initialEmployeeId ? [initialEmployeeId] : [])
  );
  const [reviewerId, setReviewerId] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSelectedEmployeeIds(initialEmployeeId ? [initialEmployeeId] : []);
    setReviewerId("");
  }, [open, initialEmployeeId]);

  useEffect(() => {
    if (!options || selectedEmployeeIds.length === 0) return;
    const managers = selectedEmployeeIds
      .map(
        (id) =>
          options.employees.find((employee) => employee.id === id)?.manager_id
      )
      .filter(Boolean) as string[];
    if (managers.length === 0) return;
    const unique = [...new Set(managers)];
    if (unique.length === 1) {
      setReviewerId(unique[0]);
    }
  }, [options, selectedEmployeeIds]);

  useEffect(() => {
    if (!open) return;

    setFetching(true);
    setMessage(null);
    setOptions(null);

    fetch("/api/assign-options", { credentials: "same-origin" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? "Could not load assign options.");
        }
        return body as AssignOptions;
      })
      .then((data) => setOptions(data))
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setFetching(false));
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const selectedReviewerId =
      reviewerId || String(form.get("reviewer_id") ?? "").trim();
    const cycleId = String(form.get("cycle_id") ?? "").trim();
    const reviewPeriod = String(form.get("review_period") ?? "").trim();
    const assessmentType = String(form.get("assessment_type") ?? "both").trim();
    const employeeIds = selectedEmployeeIds.filter(Boolean);
    const selectedEmployees: SelectedEmployeePayload[] = (
      options?.employees ?? []
    )
      .filter((employee) => employeeIds.includes(employee.id))
      .map((employee) => ({
        id: employee.id,
        full_name: employee.full_name,
        email: employee.email,
      }));

    if (employeeIds.length === 0 && !selectedReviewerId) {
      setLoading(false);
      setMessage("Select a manager, one or more employees, or both.");
      return;
    }

    const response = await fetch("/api/appraisals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        employee_ids: employeeIds,
        selected_employees: selectedEmployees,
        reviewer_id: selectedReviewerId || null,
        cycle_id: cycleId || null,
        review_period: reviewPeriod || null,
        assessment_type: assessmentType,
      }),
    });

    setLoading(false);

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(body.error ?? "Could not assign appraisal.");
      return;
    }

    const count = body.assigned ?? body.appraisals?.length ?? 1;
    let successMessage =
      count > 1
        ? `${count} appraisals assigned.`
        : "Appraisal assigned.";

    if (body.managerOnly) {
      successMessage = "Manager notified.";
    } else if (body.emailsSent > 0) {
      successMessage =
        count > 1
          ? `${count} appraisals assigned. ${body.emailsSent} notification email(s) sent.`
          : "Appraisal assigned. Notification email sent.";
    } else if (body.emailsSkipped) {
      successMessage =
        count > 1
          ? `${count} appraisals assigned. Email not sent — configure SMTP in .env.local.`
          : "Appraisal assigned. Email not sent — configure SMTP in .env.local.";
    }

    onSuccess?.(successMessage);
    setOpen(false);
    router.refresh();
  }

  function closeDialog() {
    setOpen(false);
    setMessage(null);
  }

  const modal =
    open && mounted ? (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/20"
          onClick={closeDialog}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-dialog-title"
          className="relative flex max-h-[min(92vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="shrink-0 border-b border-slate-100 px-6 py-5">
            <h3
              id="assign-dialog-title"
              className="text-lg font-semibold text-slate-900"
            >
              Assign appraisal
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Pick a manager and/or one or more employees. If staff already
              report to a manager (Managers tab), that manager is pre-selected.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {fetching ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading managers and employees…
              </p>
            ) : (
              <form id="assign-appraisal-form" onSubmit={handleSubmit} className="space-y-4">
                {options?.setupHint && (
                  <p className="rounded-xl border border-amber-200 px-4 py-3 text-sm text-amber-900">
                    {options.setupHint}
                  </p>
                )}

                {message && !options && (
                  <p className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-800">
                    {message}
                  </p>
                )}

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Manager (appraiser)
                  </span>
                  <select
                    name="reviewer_id"
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    disabled={!options?.appraisers.length}
                    className={selectClass}
                  >
                    <option value="">
                      {options?.appraisers.length
                        ? "Select manager (or use assigned manager)"
                        : "No managers available"}
                    </option>
                    {options?.appraisers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name} — {manager.email}
                      </option>
                    ))}
                  </select>
                  {options && options.appraisers.length === 0 && (
                    <p className="text-xs leading-relaxed text-amber-800">
                      No manager accounts yet. Go to the Managers tab, promote
                      someone, then refresh this page.
                    </p>
                  )}
                </label>

                <div className="block space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      Employees
                    </span>
                    {options && options.employees.length > 0 && !initialEmployeeId && (
                      <button
                        type="button"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        onClick={() => {
                          const allIds = options.employees.map((e) => e.id);
                          setSelectedEmployeeIds((prev) =>
                            prev.length === allIds.length ? [] : allIds
                          );
                        }}
                      >
                        {selectedEmployeeIds.length === options.employees.length
                          ? "Clear all"
                          : "Select all"}
                      </button>
                    )}
                  </div>
                  {initialEmployeeId ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {initialEmployeeLabel ?? "Selected employee"}
                    </p>
                  ) : !options?.employees.length ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      No employees available
                    </p>
                  ) : (
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                      {options.employees.map((employee) => {
                        const checked = selectedEmployeeIds.includes(employee.id);
                        return (
                          <label
                            key={employee.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-sm transition ${
                              checked
                                ? "bg-indigo-50 text-indigo-950"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedEmployeeIds((prev) =>
                                  checked
                                    ? prev.filter((id) => id !== employee.id)
                                    : [...prev, employee.id]
                                );
                              }}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>
                              <span className="font-medium">{employee.full_name}</span>
                              <span className="block text-xs text-slate-500">
                                {employee.email}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {selectedEmployeeIds.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {selectedEmployeeIds.length} employee
                      {selectedEmployeeIds.length === 1 ? "" : "s"} selected
                    </p>
                  )}
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Assessment type
                  </span>
                  <select name="assessment_type" defaultValue="both" className={selectClass}>
                    <option value="both">Both (Technical + Behavioural)</option>
                    <option value="technical">Technical only</option>
                    <option value="behavioural">Behavioural only</option>
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Review cycle
                  </span>
                  <select
                    name="cycle_id"
                    disabled={!options?.cycles.length}
                    className={selectClass}
                  >
                    <option value="">
                      {options?.cycles.length
                        ? "Select cycle"
                        : "No cycles available"}
                    </option>
                    {options?.cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.title}
                      </option>
                    ))}
                  </select>
                </label>

                <Input label="Review period" name="review_period" />

                {message && options && (
                  <p className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-800">
                    {message}
                  </p>
                )}
              </form>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <Button type="button" variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="assign-appraisal-form"
              disabled={loading || fetching || !options}
            >
              {loading ? "Assigning…" : "Assign"}
            </Button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "min-w-[140px] rounded-xl border-slate-200 font-semibold text-slate-700"
        }
      >
        {triggerLabel}
      </Button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}

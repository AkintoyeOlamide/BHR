"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Option = { id: string; full_name: string; email: string };
type Cycle = { id: string; title: string };

type AssignOptions = {
  appraisers: Option[];
  employees: Option[];
  cycles: Cycle[];
  missingManagers?: string[];
  setupHint?: string;
};

const selectClass =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100";

export function AssignAppraisalDialog({
  onSuccess,
}: {
  onSuccess?: (message: string) => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [options, setOptions] = useState<AssignOptions | null>(null);

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
    const employeeId = String(form.get("employee_id") ?? "").trim();
    const reviewerId = String(form.get("reviewer_id") ?? "").trim();
    const cycleId = String(form.get("cycle_id") ?? "").trim();
    const reviewPeriod = String(form.get("review_period") ?? "").trim();

    if (!employeeId && !reviewerId) {
      setLoading(false);
      setMessage("Select a manager, an employee, or both.");
      return;
    }

    const response = await fetch("/api/appraisals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        employee_id: employeeId || null,
        reviewer_id: reviewerId || null,
        cycle_id: cycleId || null,
        review_period: reviewPeriod || null,
      }),
    });

    setLoading(false);

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(body.error ?? "Could not assign appraisal.");
      return;
    }

    let successMessage = "Appraisal assigned.";

    if (body.email?.sent) {
      successMessage = body.managerOnly
        ? "Manager notified by email."
        : "Appraisal assigned and the manager was emailed.";
    } else if (body.email?.skipped && body.managerOnly) {
      successMessage =
        "Manager assignment saved. Email not sent — configure SMTP in .env.local.";
    } else if (body.email?.skipped) {
      successMessage =
        "Appraisal assigned. Email not sent — configure SMTP settings in .env.local to enable notifications.";
    } else if (body.managerOnly) {
      successMessage = "Manager notified.";
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
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
          onClick={closeDialog}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-dialog-title"
          className="portal-light relative flex max-h-[min(92vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="shrink-0 border-b border-slate-100 px-6 py-5">
            <h3
              id="assign-dialog-title"
              className="text-lg font-semibold text-slate-900"
            >
              Assign appraisal
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Optionally pick a manager and/or an employee. At least one is
              required. Cycle and review period are optional.
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
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {options.setupHint}
                  </p>
                )}

                {message && !options && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {message}
                  </p>
                )}

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Manager (appraiser)
                  </span>
                  <select
                    name="reviewer_id"
                    disabled={!options?.appraisers.length}
                    className={selectClass}
                  >
                    <option value="">
                      {options?.appraisers.length
                        ? "Select manager"
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
                      Manager accounts are missing. Ask your admin to run the
                      setup seed, then refresh this page.
                    </p>
                  )}
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Employee
                  </span>
                  <select
                    name="employee_id"
                    disabled={!options?.employees.length}
                    className={selectClass}
                  >
                    <option value="">
                      {options?.employees.length
                        ? "Select employee"
                        : "No employees available"}
                    </option>
                    {options?.employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name} — {employee.email}
                      </option>
                    ))}
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
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {message}
                  </p>
                )}
              </form>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
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
        className="min-w-[140px] rounded-xl border-violet-200 font-semibold text-violet-700 shadow-sm hover:bg-violet-50"
      >
        Assign
      </Button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}

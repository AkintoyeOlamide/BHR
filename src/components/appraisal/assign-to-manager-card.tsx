"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppraisalAlert } from "@/components/appraisal/appraisal-ui";

type ManagerOption = {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
};

type AssignToManagerCardProps = {
  appraisalId: string;
  status: string;
  technicalRated: number;
  technicalTotal: number;
  behaviouralRated: number;
  behaviouralTotal: number;
  managerName?: string | null;
  initialManagerId?: string | null;
};

export function AssignToManagerCard({
  appraisalId,
  status,
  technicalRated,
  technicalTotal,
  behaviouralRated,
  behaviouralTotal,
  managerName,
  initialManagerId = null,
}: AssignToManagerCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState(
    initialManagerId ?? ""
  );
  const [assignedManagerId, setAssignedManagerId] = useState(
    status === "submitted" || status === "completed"
      ? initialManagerId ?? ""
      : ""
  );

  const locked = status === "completed";
  const alreadyAssigned = status === "submitted" || status === "completed";

  const technicalDone =
    technicalTotal > 0 && technicalRated >= technicalTotal;
  const behaviouralDone =
    behaviouralTotal > 0 && behaviouralRated >= behaviouralTotal;

  const selectedManager = useMemo(
    () => managers.find((m) => m.id === selectedManagerId) ?? null,
    [managers, selectedManagerId]
  );

  const assignedManager = useMemo(() => {
    if (assignedManagerId) {
      const fromList = managers.find((m) => m.id === assignedManagerId);
      if (fromList) return fromList;
    }
    if (managerName) {
      return {
        id: assignedManagerId || "",
        full_name: managerName,
        email: "",
        department: null,
      } satisfies ManagerOption;
    }
    return null;
  }, [assignedManagerId, managers, managerName]);

  const managerChanged =
    Boolean(selectedManagerId) &&
    selectedManagerId !== (assignedManagerId || "");

  const canAssign =
    !locked &&
    technicalDone &&
    behaviouralDone &&
    Boolean(selectedManagerId) &&
    (!alreadyAssigned || changing) &&
    (!alreadyAssigned || managerChanged);

  function applyManagersList(list: ManagerOption[]) {
    setManagers(list);
    setSelectedManagerId((current) => {
      if (current && list.some((m) => m.id === current)) return current;
      if (initialManagerId && list.some((m) => m.id === initialManagerId)) {
        return initialManagerId;
      }
      if (assignedManagerId && list.some((m) => m.id === assignedManagerId)) {
        return assignedManagerId;
      }
      return current;
    });
  }

  async function loadManagers(opts?: { silent?: boolean }) {
    if (locked) {
      setLoadingManagers(false);
      return;
    }

    if (!opts?.silent) setLoadingManagers(true);
    try {
      const response = await fetch(
        `/api/managers/options?ts=${Date.now()}`,
        {
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "Could not load managers.");
      }
      const list = Array.isArray(body.managers)
        ? (body.managers as ManagerOption[])
        : [];
      applyManagersList(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load managers.");
    } finally {
      setLoadingManagers(false);
    }
  }

  useEffect(() => {
    void loadManagers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, initialManagerId]);

  useEffect(() => {
    if (status === "submitted" || status === "completed") {
      setAssignedManagerId(initialManagerId ?? "");
      if (initialManagerId) setSelectedManagerId(initialManagerId);
      setChanging(false);
    }
  }, [status, initialManagerId]);

  async function openPicker() {
    if (loading || locked) return;
    if (alreadyAssigned && !changing) return;
    setPickerOpen(true);
    await loadManagers();
  }

  async function handleAssign() {
    if (!canAssign) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/appraisals/${appraisalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "submitted",
        manager_id: selectedManagerId,
      }),
    });

    setLoading(false);

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(
        body.error ??
          (alreadyAssigned
            ? "Could not change manager."
            : "Could not assign appraisal to your manager.")
      );
      return;
    }

    const notified = body.managerNotified === true;
    const name =
      body.managerName ||
      selectedManager?.full_name ||
      managerName ||
      "your manager";
    const wasChange = alreadyAssigned;
    setAssignedManagerId(selectedManagerId);
    setChanging(false);
    setPickerOpen(false);
    setMessage(
      notified
        ? wasChange
          ? `Manager changed to ${name}. They have been emailed.`
          : `Assigned to ${name}. They have been emailed and will see this on their appraisals list.`
        : wasChange
          ? `Manager changed to ${name}.`
          : `Assigned to ${name}. They will see this on their appraisals list.`
    );
    router.refresh();
  }

  if (locked) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 md:p-5">
        <p className="text-sm font-semibold text-emerald-900">
          Submitted to HR
        </p>
        <p className="mt-1 text-sm text-emerald-800">
          {managerName ? (
            <>
              <strong>{managerName}</strong> completed manager ratings and sent
              this appraisal to HR.
            </>
          ) : (
            <>This appraisal has been submitted to HR.</>
          )}
        </p>
      </div>
    );
  }

  if (alreadyAssigned && !changing) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 md:p-5">
        <p className="text-sm font-semibold text-emerald-900">
          Sent to your manager
        </p>
        <p className="mt-1 text-sm text-emerald-800">
          {assignedManager?.full_name || managerName ? (
            <>
              <strong>{assignedManager?.full_name || managerName}</strong> has
              your appraisal for manager ratings.
            </>
          ) : (
            <>Your appraisal is with your manager for ratings.</>
          )}
        </p>

        {message && (
          <div className="mt-3">
            <AppraisalAlert variant="success">{message}</AppraisalAlert>
          </div>
        )}
        {error && (
          <div className="mt-3">
            <AppraisalAlert variant="error">{error}</AppraisalAlert>
          </div>
        )}

        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setChanging(true);
              setMessage(null);
              setError(null);
              setSelectedManagerId(assignedManagerId || initialManagerId || "");
              void loadManagers();
            }}
            className="w-full sm:w-auto"
          >
            Change manager
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-sm md:p-5">
      <p className="text-sm font-semibold text-slate-900">
        {alreadyAssigned ? "Change manager" : "Assign to your manager"}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {alreadyAssigned
          ? "Pick a different manager. Your appraisal will move to their list and they will be notified."
          : "When your Technical and Behavioural ratings are saved, choose your manager and send the appraisal. They get an email and it appears on their list to rate."}
      </p>

      {!alreadyAssigned && (
        <ul className="mt-4 space-y-2 text-sm">
          <ChecklistItem
            done={technicalDone}
            label={`Technical ratings saved (${technicalRated}/${technicalTotal})`}
          />
          <ChecklistItem
            done={behaviouralDone}
            label={`Behavioural ratings saved (${behaviouralRated}/${behaviouralTotal})`}
          />
          <ChecklistItem
            done={Boolean(selectedManagerId)}
            label={
              selectedManager
                ? `Manager selected: ${selectedManager.full_name}`
                : "Select your manager"
            }
          />
        </ul>
      )}

      <div className="mt-4">
        <span className="text-sm font-medium text-slate-700">Your manager</span>
        <button
          type="button"
          onClick={() => void openPicker()}
          disabled={loading}
          className="mt-1.5 flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 outline-none hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
        >
          <span className={selectedManager ? "text-slate-900" : "text-slate-500"}>
            {selectedManager
              ? `${selectedManager.full_name}${
                  selectedManager.email ? ` — ${selectedManager.email}` : ""
                }`
              : loadingManagers
                ? "Loading managers…"
                : "Select a manager"}
          </span>
          <span className="text-slate-400">▾</span>
        </button>

        {pickerOpen && (
          <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {loadingManagers
                  ? "Refreshing managers…"
                  : `${managers.length} manager${managers.length === 1 ? "" : "s"}`}
              </p>
              <button
                type="button"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                onClick={() => setPickerOpen(false)}
              >
                Close
              </button>
            </div>

            {loadingManagers && managers.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">Loading…</p>
            ) : managers.length === 0 ? (
              <p className="px-3 py-4 text-sm text-amber-800">
                No manager accounts yet. Ask HR to promote someone under
                Managers or Staff.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {managers.map((manager) => {
                  const selected = manager.id === selectedManagerId;
                  return (
                    <li key={manager.id}>
                      <button
                        type="button"
                        className={`flex w-full items-start gap-3 px-3 py-3 text-left text-sm hover:bg-indigo-50/70 ${
                          selected ? "bg-indigo-50" : "bg-white"
                        }`}
                        onClick={() => {
                          setSelectedManagerId(manager.id);
                          setPickerOpen(false);
                        }}
                      >
                        <span
                          className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-slate-300 bg-white"
                          }`}
                          aria-hidden
                        >
                          {selected ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-slate-900">
                            {manager.full_name}
                            {manager.id === assignedManagerId ? (
                              <span className="ml-2 text-xs font-normal text-emerald-700">
                                Current
                              </span>
                            ) : null}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {manager.email || "No email"}
                            {manager.department
                              ? ` · ${manager.department}`
                              : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {!loadingManagers && managers.length === 0 && (
        <p className="mt-3 text-xs text-amber-800">
          No manager accounts are available yet. Ask HR to promote someone to
          Manager under the Managers tab.
        </p>
      )}

      {!canAssign && managers.length > 0 && (
        <p className="mt-3 text-xs text-amber-700">
          {!technicalDone || !behaviouralDone
            ? "Save a rating on every Technical and Behavioural row first."
            : alreadyAssigned && !managerChanged
              ? "Select a different manager to move this appraisal."
              : "Select your manager above, then assign."}
        </p>
      )}

      {error && (
        <div className="mt-3">
          <AppraisalAlert variant="error">{error}</AppraisalAlert>
        </div>
      )}
      {message && (
        <div className="mt-3">
          <AppraisalAlert variant="success">{message}</AppraisalAlert>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {alreadyAssigned && (
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => {
              setChanging(false);
              setPickerOpen(false);
              setSelectedManagerId(assignedManagerId || "");
              setError(null);
            }}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleAssign}
          disabled={!canAssign || loading}
          className="w-full sm:w-auto"
        >
          {loading
            ? alreadyAssigned
              ? "Updating…"
              : "Sending…"
            : selectedManager
              ? alreadyAssigned
                ? `Move to ${selectedManager.full_name}`
                : `Assign to ${selectedManager.full_name}`
              : alreadyAssigned
                ? "Change manager"
                : "Assign to manager"}
        </Button>
      </div>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FACILITY_PRIORITY_LABELS,
  FACILITY_STATUSES,
  FACILITY_STATUS_LABELS,
  type FacilityPriority,
  type FacilityReport,
  type FacilityStatus,
} from "@/lib/types/facility";

function priorityBadge(priority: FacilityPriority) {
  switch (priority) {
    case "critical":
      return "bg-rose-100 text-rose-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function statusBadge(status: FacilityStatus) {
  switch (status) {
    case "reported":
      return "bg-amber-100 text-amber-800";
    case "in_progress":
      return "bg-sky-100 text-sky-800";
    case "awaiting_confirm":
      return "bg-violet-100 text-violet-800";
    case "resolved":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

type AssignDraft = {
  name: string;
  email: string;
  note: string;
};

export function FacilityReportsDashboard({
  reports,
  highlightReportId,
}: {
  reports: FacilityReport[];
  highlightReportId?: string | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | FacilityStatus>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(reports.map((r) => [r.id, r.facility_notes ?? ""]))
  );
  const [assignDrafts, setAssignDrafts] = useState<Record<string, AssignDraft>>(
    () =>
      Object.fromEntries(
        reports.map((r) => [
          r.id,
          {
            name: r.assigned_to_name ?? "",
            email: r.assigned_to_email ?? "",
            note: "",
          },
        ])
      )
  );

  useEffect(() => {
    if (!highlightReportId) return;
    const el = document.getElementById(`report-${highlightReportId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightReportId]);

  const counts = useMemo(() => {
    const base: Record<"all" | FacilityStatus, number> = {
      all: reports.length,
      reported: 0,
      in_progress: 0,
      awaiting_confirm: 0,
      resolved: 0,
    };
    for (const report of reports) {
      if (report.status in base) {
        base[report.status as FacilityStatus] += 1;
      }
    }
    return base;
  }, [reports]);

  const filtered = useMemo(() => {
    if (filter === "all") return reports;
    return reports.filter((r) => r.status === filter);
  }, [reports, filter]);

  function setAssignField(
    id: string,
    field: keyof AssignDraft,
    value: string
  ) {
    setAssignDrafts((prev) => ({
      ...prev,
      [id]: {
        name: prev[id]?.name ?? "",
        email: prev[id]?.email ?? "",
        note: prev[id]?.note ?? "",
        [field]: value,
      },
    }));
  }

  async function updateReport(
    id: string,
    patch: {
      status?: FacilityStatus;
      facility_notes?: string;
      assign?: AssignDraft;
      confirmDone?: boolean;
    }
  ) {
    setSavingId(id);
    setMessage(null);

    const response = await fetch(`/api/facility-reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    setSavingId(null);

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(body.error ?? "Could not update report.");
      return;
    }

    if (patch.assign) {
      setMessage(
        `Assigned to ${patch.assign.name}. Email with photos + fix link is being sent to ${patch.assign.email}.`
      );
      setAssignField(id, "note", "");
    } else if (patch.confirmDone) {
      setMessage(
        "Marked done. Original reporter is being emailed that the fix is complete."
      );
    } else {
      setMessage("Report updated.");
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="portal-stat-grid">
        <div className="portal-stat-tile portal-stat-tile--blue">
          <p className="portal-stat-value">{counts.all}</p>
          <p className="portal-stat-label">All reports</p>
        </div>
        <div className="portal-stat-tile portal-stat-tile--amber">
          <p className="portal-stat-value">{counts.reported}</p>
          <p className="portal-stat-label">Reported</p>
        </div>
        <div className="portal-stat-tile portal-stat-tile--teal">
          <p className="portal-stat-value">{counts.in_progress}</p>
          <p className="portal-stat-label">In progress</p>
        </div>
        <div className="portal-stat-tile portal-stat-tile--blue">
          <p className="portal-stat-value">{counts.awaiting_confirm}</p>
          <p className="portal-stat-label">Awaiting confirm</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", `All (${counts.all})`],
            ...FACILITY_STATUSES.map(
              (status) =>
                [
                  status,
                  `${FACILITY_STATUS_LABELS[status]} (${counts[status]})`,
                ] as const
            ),
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              filter === key
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="portal-surface text-sm text-slate-500">
            No facility reports yet.
          </p>
        ) : (
          filtered.map((report) => {
            const draft = assignDrafts[report.id] ?? {
              name: "",
              email: "",
              note: "",
            };

            return (
              <article
                key={report.id}
                id={`report-${report.id}`}
                className={`portal-surface space-y-4 ${
                  highlightReportId === report.id
                    ? "ring-2 ring-indigo-500 ring-offset-2"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900">
                      {report.issue_title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {report.location} · {report.department}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityBadge(report.priority)}`}
                    >
                      {FACILITY_PRIORITY_LABELS[report.priority]}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(report.status)}`}
                    >
                      {FACILITY_STATUS_LABELS[report.status] ?? report.status}
                    </span>
                  </div>
                </div>

                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Reported by</dt>
                    <dd className="font-medium text-slate-900">
                      {report.reporter_name} · {report.reporter_email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">When it happened</dt>
                    <dd className="font-medium text-slate-900">
                      {new Date(report.occurred_at).toLocaleString()}
                    </dd>
                  </div>
                  {report.assigned_to_email && (
                    <div className="sm:col-span-2">
                      <dt className="text-slate-500">Assigned to</dt>
                      <dd className="font-medium text-slate-900">
                        {report.assigned_to_name} · {report.assigned_to_email}
                        {report.assigned_at
                          ? ` · ${new Date(report.assigned_at).toLocaleString()}`
                          : ""}
                      </dd>
                      {report.assignment_note && (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                          Note: {report.assignment_note}
                        </p>
                      )}
                    </div>
                  )}
                </dl>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    How it spoilt
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {report.how_it_spoilt}
                  </p>
                </div>

                {report.photo_urls?.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {report.photo_urls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Report photo"
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {report.fix_submitted_at && (
                  <div className="space-y-3 rounded-xl bg-violet-50 p-4 ring-1 ring-violet-100">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                          Staff fix evidence
                        </p>
                        <p className="mt-1 text-sm text-violet-900">
                          Submitted{" "}
                          {new Date(report.fix_submitted_at).toLocaleString()}
                          {report.assigned_to_name
                            ? ` by ${report.assigned_to_name}`
                            : ""}
                        </p>
                      </div>
                      {(report.status === "awaiting_confirm" ||
                        Boolean(report.fix_submitted_at)) &&
                        report.status !== "resolved" && (
                          <Button
                            type="button"
                            disabled={savingId === report.id}
                            onClick={() =>
                              updateReport(report.id, { confirmDone: true })
                            }
                          >
                            {savingId === report.id
                              ? "Confirming…"
                              : "Confirm done"}
                          </Button>
                        )}
                    </div>
                    {report.fix_note && (
                      <p className="whitespace-pre-wrap text-sm text-violet-950">
                        {report.fix_note}
                      </p>
                    )}
                    {(report.fix_photo_urls?.length ?? 0) > 0 && (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {report.fix_photo_urls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-square overflow-hidden rounded-lg bg-white ring-1 ring-violet-200"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt="Fix photo"
                              className="h-full w-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    {report.status === "resolved" && report.confirmed_at && (
                      <p className="text-xs text-emerald-700">
                        Confirmed done{" "}
                        {new Date(report.confirmed_at).toLocaleString()}
                        {report.confirmed_by
                          ? ` by ${report.confirmed_by}`
                          : ""}
                        . Reporter was notified.
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assign to team member
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-slate-600">
                        Name
                      </span>
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) =>
                          setAssignField(report.id, "name", e.target.value)
                        }
                        className="h-10 w-full rounded-lg bg-white px-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="Team member name"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-slate-600">
                        Work email
                      </span>
                      <input
                        type="email"
                        value={draft.email}
                        onChange={(e) =>
                          setAssignField(report.id, "email", e.target.value)
                        }
                        className="h-10 w-full rounded-lg bg-white px-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="name@company.com"
                      />
                    </label>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      Note for assignee
                    </span>
                    <textarea
                      rows={2}
                      value={draft.note}
                      onChange={(e) =>
                        setAssignField(report.id, "note", e.target.value)
                      }
                      className="w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-200"
                      placeholder="What should they do / any extra context…"
                    />
                  </label>
                  <Button
                    type="button"
                    disabled={
                      savingId === report.id ||
                      !draft.name.trim() ||
                      !draft.email.trim() ||
                      !draft.note.trim()
                    }
                    onClick={() =>
                      updateReport(report.id, {
                        assign: {
                          name: draft.name.trim(),
                          email: draft.email.trim(),
                          note: draft.note.trim(),
                        },
                      })
                    }
                  >
                    {savingId === report.id
                      ? "Assigning…"
                      : "Assign & email team member"}
                  </Button>
                </div>

                <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">
                      Facility notes
                    </span>
                    <textarea
                      rows={2}
                      value={notes[report.id] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [report.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-violet-200"
                      placeholder="Internal notes for this job…"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <select
                      value={
                        FACILITY_STATUSES.includes(
                          report.status as FacilityStatus
                        )
                          ? report.status
                          : "reported"
                      }
                      onChange={(e) =>
                        updateReport(report.id, {
                          status: e.target.value as FacilityStatus,
                        })
                      }
                      disabled={savingId === report.id}
                      className="h-10 rounded-lg bg-white px-3 text-sm shadow-sm ring-1 ring-slate-200"
                    >
                      {FACILITY_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {FACILITY_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={savingId === report.id}
                      onClick={() =>
                        updateReport(report.id, {
                          facility_notes: notes[report.id] ?? "",
                        })
                      }
                    >
                      Save notes
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Submitted {new Date(report.created_at).toLocaleString()}
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

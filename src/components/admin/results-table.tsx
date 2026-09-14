"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteAppraisalButton } from "@/components/appraisal/delete-appraisal-button";
import {
  APPRAISAL_STATUS_LABELS,
  ASSESSMENT_TYPE_LABELS,
  type AppraisalStatus,
  type AssessmentType,
} from "@/lib/types/appraisal";
import { appraisalStatusBadgeClass } from "@/lib/ui/status-badge";
import type { AppraisalResultRow } from "@/lib/appraisals/results";

type ResultsTableProps = {
  results: AppraisalResultRow[];
};

function formatScore(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return Number(value).toFixed(2);
}

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildCsv(rows: AppraisalResultRow[]) {
  const headers = [
    "Employee",
    "Email",
    "Department",
    "Job title",
    "Cycle",
    "Review period",
    "Reviewer",
    "Assessment type",
    "Status",
    "Technical rating",
    "Technical weighted",
    "Behavioural rating",
    "Behavioural weighted",
    "Overall score",
    "Rating label",
    "Goals",
    "Strengths",
    "Areas for improvement",
    "Development plan",
    "Manager comments",
    "Updated at",
  ];

  const lines = rows.map((row) =>
    [
      row.employee_name,
      row.employee_email,
      row.department,
      row.job_title,
      row.cycle_title,
      row.review_period,
      row.reviewer_name,
      ASSESSMENT_TYPE_LABELS[row.assessment_type as AssessmentType] ??
        row.assessment_type,
      APPRAISAL_STATUS_LABELS[row.status as AppraisalStatus] ?? row.status,
      formatScore(row.kpi_overall_rating),
      formatScore(row.kpi_section_actual),
      formatScore(row.behavioural_overall_rating),
      formatScore(row.behavioural_section_actual),
      formatScore(row.overall_score),
      row.rating_label,
      row.goals,
      row.strengths,
      row.areas_for_improvement,
      row.development_plan,
      row.manager_comments,
      row.updated_at,
    ]
      .map(escapeCsv)
      .join(",")
  );

  return `\uFEFF${[headers.join(","), ...lines].join("\n")}`;
}

function buildPdfHtml(rows: AppraisalResultRow[]) {
  const bodyRows = rows
    .map((row) => {
      return `
        <tr>
          <td>${escapeHtml(row.employee_name)}<br><span class="muted">${escapeHtml(row.employee_email)}</span></td>
          <td>${escapeHtml(row.department || "—")}<br><span class="muted">${escapeHtml(row.job_title || "")}</span></td>
          <td>${escapeHtml(row.cycle_title)}<br><span class="muted">${escapeHtml(row.review_period || "")}</span></td>
          <td>${escapeHtml(row.reviewer_name)}</td>
          <td>${escapeHtml(APPRAISAL_STATUS_LABELS[row.status as AppraisalStatus] ?? row.status)}</td>
          <td class="num">${formatScore(row.kpi_overall_rating)}</td>
          <td class="num">${formatScore(row.behavioural_overall_rating)}</td>
          <td class="num"><strong>${formatScore(row.overall_score)}</strong></td>
          <td>${escapeHtml(row.rating_label || "—")}</td>
          <td class="wrap">${escapeHtml(summarize(row.development_plan || row.goals))}</td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>BHR Appraisal Results</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    p { margin: 0 0 16px; color: #64748b; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: top; text-align: left; }
    th { background: #f8fafc; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
    .num { text-align: center; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .muted { color: #94a3b8; font-size: 9px; }
    .wrap { max-width: 180px; word-break: break-word; }
    @media print {
      body { margin: 12px; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <h1>Bitachon HR — Appraisal Results</h1>
  <p>Generated ${new Date().toLocaleString()} · ${rows.length} record${rows.length === 1 ? "" : "s"}</p>
  <table>
    <thead>
      <tr>
        <th>Employee</th>
        <th>Department</th>
        <th>Cycle</th>
        <th>Reviewer</th>
        <th>Status</th>
        <th>Tech</th>
        <th>Beh</th>
        <th>Overall</th>
        <th>Band</th>
        <th>Dev plan / goals</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function summarize(value: string, max = 120) {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return results.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      return [
        row.employee_name,
        row.employee_email,
        row.department,
        row.job_title,
        row.cycle_title,
        row.reviewer_name,
        row.rating_label,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [results, query, statusFilter]);

  function handleCsv() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(
      `bhr-appraisal-results-${stamp}.csv`,
      buildCsv(filtered),
      "text/csv;charset=utf-8"
    );
  }

  function handlePdf() {
    const html = buildPdfHtml(filtered);
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      alert("Please allow pop-ups to download the PDF.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600">Search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, email, department…"
              className="h-10 w-full rounded-lg bg-white px-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-violet-200"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-lg bg-white px-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="all">All statuses</option>
              {Object.entries(APPRAISAL_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handleCsv}>
            Download CSV
          </Button>
          <Button type="button" onClick={handlePdf}>
            Download PDF
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {results.length} appraisal
        {results.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          No appraisal results match your filters yet.
        </p>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl ring-1 ring-slate-200">
          <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Employee</th>
                <th className="px-3 py-3 font-semibold">Department</th>
                <th className="px-3 py-3 font-semibold">Cycle</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 text-center font-semibold">Tech</th>
                <th className="px-3 py-3 text-center font-semibold">Beh</th>
                <th className="px-3 py-3 text-center font-semibold">Overall</th>
                <th className="px-3 py-3 font-semibold">Band</th>
                <th className="px-3 py-3 font-semibold">Dev plan</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const status = row.status as AppraisalStatus;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 align-top hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {row.employee_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {row.employee_email || "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Reviewer: {row.reviewer_name}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <p>{row.department || "—"}</p>
                      <p className="text-xs text-slate-500">
                        {row.job_title || ""}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <p>{row.cycle_title}</p>
                      <p className="text-xs text-slate-500">
                        {row.review_period || ""}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={appraisalStatusBadgeClass(status)}>
                        {APPRAISAL_STATUS_LABELS[status] ?? row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums font-medium text-slate-800">
                      {formatScore(row.kpi_overall_rating)}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums font-medium text-slate-800">
                      {formatScore(row.behavioural_overall_rating)}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums text-base font-semibold text-slate-900">
                      {formatScore(row.overall_score)}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {row.rating_label || "—"}
                    </td>
                    <td className="max-w-[220px] px-3 py-3 text-xs leading-relaxed text-slate-600">
                      {summarize(
                        row.development_plan ||
                          row.goals ||
                          row.strengths ||
                          "",
                        100
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/manager/appraisals/${row.id}`}
                          className="portal-link whitespace-nowrap text-xs"
                        >
                          Open →
                        </Link>
                        <DeleteAppraisalButton
                          appraisalId={row.id}
                          employeeName={row.employee_name}
                          compact
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

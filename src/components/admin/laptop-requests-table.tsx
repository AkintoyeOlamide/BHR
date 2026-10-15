import type { LaptopRequest } from "@/lib/types/laptop";
import { LAPTOP_REQUEST_STATUS_LABELS } from "@/lib/types/laptop";

function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type Props = {
  rows: LaptopRequest[];
};

export function LaptopRequestsTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
        <p className="text-sm font-medium text-slate-800">No laptop requests yet</p>
        <p className="mt-2 text-sm text-slate-500">
          No saved laptop requests in the backend yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {row.full_name}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">{row.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {row.department}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  row.currently_has_laptop
                    ? "bg-amber-50 text-amber-800"
                    : "bg-emerald-50 text-emerald-800"
                }`}
              >
                {row.currently_has_laptop
                  ? "Already has a laptop"
                  : "No laptop now"}
              </span>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                {LAPTOP_REQUEST_STATUS_LABELS[row.status] ?? row.status}
              </span>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Preferred specification
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {row.preferred_spec}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Reason
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {row.reason}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-slate-400">
            Submitted {formatWhen(row.created_at)}
          </p>
        </article>
      ))}
    </div>
  );
}

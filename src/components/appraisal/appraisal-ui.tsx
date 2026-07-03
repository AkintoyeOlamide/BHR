import { Button } from "@/components/ui/button";

/* ── Panel shell ── */

export function AppraisalPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`appraisal-panel portal-light overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function AppraisalPanelHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-violet-50/40 px-6 py-5 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {badge && (
            <span className="mb-2 inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet-700">
              {badge}
            </span>
          )}
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppraisalMetricBar({
  metrics,
}: {
  metrics: { label: string; value: string; highlight?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-3 sm:px-8">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-sm shadow-sm"
        >
          <span className="text-slate-500">{metric.label}</span>
          <span
            className={`font-semibold tabular-nums ${
              metric.highlight ? "text-violet-700" : "text-slate-900"
            }`}
          >
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AppraisalToolbar({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-3 sm:px-8">
      <div className="flex flex-wrap gap-2">{children}</div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function AppraisalTableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto px-4 pb-2 sm:px-6">
      <div className="min-w-[960px]">{children}</div>
    </div>
  );
}

export function AppraisalStickyFooter({
  children,
  helper,
}: {
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">{children}</div>
        {helper && (
          <p className="text-xs leading-relaxed text-slate-500 sm:max-w-md sm:text-right">
            {helper}
          </p>
        )}
      </div>
    </div>
  );
}

export function AppraisalAlert({
  variant,
  children,
}: {
  variant: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return (
    <p
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles[variant]}`}
      role="status"
    >
      {children}
    </p>
  );
}

export function WeightProgress({
  total,
  max = 100,
}: {
  total: number;
  max?: number;
}) {
  const pct = Math.min(100, (total / max) * 100);
  const over = total > max + 0.01;

  return (
    <div className="flex min-w-[140px] flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Weight used</span>
        <span
          className={`font-semibold tabular-nums ${over ? "text-red-600" : "text-slate-700"}`}
        >
          {total.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            over ? "bg-red-500" : pct >= 100 ? "bg-emerald-500" : "bg-violet-500"
          }`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

/* ── Table cell inputs (consistent styling) ── */

export const cellInputClass =
  "w-full min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 read-only:border-slate-100 read-only:bg-slate-50 read-only:text-slate-700";

export const cellSelectClass =
  "h-10 w-full min-w-[4.5rem] rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-500";

export const cellTextareaClass =
  "w-full min-h-[4.5rem] resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 read-only:border-slate-100 read-only:bg-slate-50";

export const cellNumberClass =
  "w-full min-w-[3.5rem] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-medium tabular-nums text-slate-900 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 read-only:border-slate-100 read-only:bg-slate-50";

export function RowRemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      aria-label="Remove row"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M3 3l8 8M11 3L3 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

export function SaveButton({
  loading,
  label,
  onClick,
}: {
  loading?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="min-w-[140px] shadow-md shadow-violet-600/10"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Saving…
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

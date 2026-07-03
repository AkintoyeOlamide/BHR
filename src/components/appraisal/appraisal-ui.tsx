import { Button } from "@/components/ui/button";

/* ── Panel shell ── */

const PANEL_ACCENTS = {
  violet: "#7c3aed",
  sky: "#0284c7",
  emerald: "#059669",
  amber: "#d97706",
} as const;

type PanelAccent = keyof typeof PANEL_ACCENTS;

export function AppraisalPanel({
  children,
  className = "",
  accent = "violet",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: PanelAccent;
}) {
  return (
    <div
      className={`appraisal-panel portal-light w-full max-w-full overflow-x-hidden rounded-lg bg-white text-slate-900 ${className}`}
    >
      <div
        className="h-1 w-full"
        style={{ backgroundColor: PANEL_ACCENTS[accent] }}
        aria-hidden
      />
      {children}
    </div>
  );
}

export function AppraisalPanelHeader({
  title,
  subtitle,
  badge,
  accent = "violet",
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  accent?: PanelAccent;
}) {
  const color = PANEL_ACCENTS[accent];

  return (
    <div className="px-3 py-3 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {badge && (
            <span
              className="mb-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white sm:mb-2 sm:text-[11px]"
              style={{ backgroundColor: color }}
            >
              {badge}
            </span>
          )}
          <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg md:text-xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 hidden max-w-2xl text-sm leading-relaxed text-slate-500 sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppraisalFormSection({
  title,
  children,
  accent = "violet",
}: {
  title: string;
  children: React.ReactNode;
  accent?: PanelAccent;
}) {
  const color = PANEL_ACCENTS[accent];
  const tint =
    accent === "violet"
      ? "#faf5ff"
      : accent === "sky"
        ? "#f0f9ff"
        : accent === "emerald"
          ? "#ecfdf5"
          : "#fffbeb";

  return (
    <section
      className="mx-3 mb-2 rounded-lg p-3 sm:mx-4 sm:p-4 md:mx-6 md:p-5 lg:mx-8"
      style={{ backgroundColor: tint }}
    >
      <div className="mb-3 flex items-center gap-2 sm:mb-4">
        <span
          className="h-4 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          {title}
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export function AppraisalMetricBar({
  metrics,
}: {
  metrics: { label: string; value: string; highlight?: boolean }[];
}) {
  return (
    <div className="mx-3 mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 sm:mx-4 sm:gap-3 sm:px-4 sm:py-3 md:mx-6 md:px-5 lg:mx-8">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="inline-flex items-center gap-2 text-sm"
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
    <div className="mx-3 mb-2 flex flex-col gap-2 rounded-lg bg-slate-50 px-3 py-2.5 sm:mx-4 sm:px-4 sm:py-3 md:mx-6 md:flex-row md:flex-wrap md:items-center md:justify-between lg:mx-8">
      <div className="flex flex-wrap gap-2">{children}</div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function AppraisalTableWrap({
  children,
  title,
  accent = "violet",
}: {
  children: React.ReactNode;
  title?: string;
  accent?: PanelAccent;
}) {
  const color = PANEL_ACCENTS[accent];

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 pb-2 md:px-6 lg:px-8">
      {title && (
        <div className="mb-3 flex items-center gap-2">
          <span
            className="h-4 w-1 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <h3
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color }}
          >
            {title}
          </h3>
        </div>
      )}
      <div className="w-full max-w-full rounded-lg bg-slate-50 p-2 md:p-3">{children}</div>
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
    <div className="sticky bottom-0 z-10 bg-stone-50/95 px-0 py-3 backdrop-blur-sm md:px-6 md:py-4 lg:px-8">
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
    error: "bg-red-50 text-red-800",
    success: "bg-emerald-50 text-emerald-800",
    info: "bg-sky-50 text-sky-800",
  };

  return (
    <p
      className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed md:px-4 md:py-3 md:text-sm ${styles[variant]}`}
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
    <div className="flex w-full min-w-0 flex-col gap-1 md:min-w-[140px]">
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
            over ? "bg-red-600" : "bg-slate-900"
          }`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

/* ── Table cell inputs (consistent styling) ── */

export const cellInputClass =
  "w-full min-h-9 rounded-lg bg-white px-2.5 py-2 text-xs text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 read-only:bg-slate-50 read-only:text-slate-600 read-only:shadow-none md:min-h-10 md:px-3 md:text-sm";

export const cellSelectClass =
  "h-9 w-full rounded-lg bg-white px-2 text-center text-xs font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-violet-200 disabled:bg-slate-50 disabled:text-slate-500 md:h-10 md:text-sm";

export const cellTextareaClass =
  "w-full min-h-[3.5rem] resize-y rounded-lg bg-white px-2.5 py-2 text-xs leading-relaxed text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200 read-only:bg-slate-50 md:min-h-[4.5rem] md:px-3 md:text-sm";

export const cellNumberClass =
  "w-full rounded-lg bg-white px-2 py-2 text-center text-xs font-medium tabular-nums text-slate-900 shadow-sm ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-violet-200 read-only:bg-slate-50 md:text-sm";

export function RowRemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:text-red-600"
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
      className="w-full min-w-0 sm:w-auto sm:min-w-[140px]"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          Saving…
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

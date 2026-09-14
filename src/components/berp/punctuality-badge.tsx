"use client";

import { isLateClockIn } from "@/lib/berp/time";

export function PunctualityBadge({
  clockIn,
}: {
  clockIn: string | null | undefined;
}) {
  if (!clockIn) return null;
  const late = isLateClockIn(clockIn);
  return (
    <span
      className={
        late
          ? "inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800"
          : "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800"
      }
    >
      {late ? "Late" : "On time"}
    </span>
  );
}

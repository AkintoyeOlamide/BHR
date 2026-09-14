"use client";

import { formatLagosDateTime } from "@/lib/berp/time";

export function LagosTime({
  value,
  lagosLabel,
  className,
}: {
  value: string | null | undefined;
  lagosLabel?: string | null;
  className?: string;
}) {
  const label = lagosLabel?.trim();
  return (
    <span className={className}>
      {label || formatLagosDateTime(value)}
    </span>
  );
}

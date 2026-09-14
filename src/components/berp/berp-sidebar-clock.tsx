"use client";

import { useEffect, useState } from "react";
import {
  formatLagosSidebarDate,
  formatLagosSidebarTime,
  lagosGreeting,
} from "@/lib/berp/time";

export function BerpSidebarClock({ firstName }: { firstName: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl bg-white/10 px-4 py-4 text-white">
      <p suppressHydrationWarning className="text-xs font-medium text-white/70">
        {formatLagosSidebarDate(now)}
      </p>
      <p
        suppressHydrationWarning
        className="mt-1 text-[2rem] font-semibold leading-none tracking-tight"
      >
        {formatLagosSidebarTime(now)}
      </p>
      <p suppressHydrationWarning className="mt-3 text-sm text-white/70">
        {lagosGreeting(now)},
      </p>
      <p className="mt-0.5 text-sm font-semibold">
        {firstName}{" "}
        <span aria-hidden className="font-normal">
          👋
        </span>
      </p>
    </div>
  );
}

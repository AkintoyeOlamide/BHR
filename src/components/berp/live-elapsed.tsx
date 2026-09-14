"use client";

import { useEffect, useState } from "react";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatElapsed(fromIso: string, nowMs = Date.now()) {
  const start = new Date(fromIso).getTime();
  let seconds = Math.floor((nowMs - start) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(rest)}`;
}

export function LiveElapsed({
  clockIn,
  className = "",
}: {
  clockIn: string;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span suppressHydrationWarning className={`font-mono tabular-nums ${className}`}>
      {formatElapsed(clockIn, now)}
    </span>
  );
}

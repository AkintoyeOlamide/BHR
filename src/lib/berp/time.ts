export const LAGOS_TZ = "Africa/Lagos";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function lagosParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS_TZ,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const monthNum = Number(read("month"));
  return {
    weekday: read("weekday").slice(0, 3),
    day: read("day"),
    month: MONTHS[monthNum - 1] ?? read("month"),
    year: read("year"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

export function formatLagosDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const p = lagosParts(date);
  return `${p.weekday}, ${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute}:${p.second}`;
}

export function formatLagosTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const p = lagosParts(date);
  return `${p.hour}:${p.minute}:${p.second}`;
}

export function formatLagosDay(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const p = lagosParts(date);
  return `${p.weekday}, ${p.day} ${p.month}`;
}

/** Prefer phone-written Lagos label; otherwise convert ISO → Africa/Lagos. */
export function displayLagos(
  iso: string | null | undefined,
  lagosLabel?: string | null
) {
  const label = lagosLabel?.trim();
  if (label) return label;
  return formatLagosDateTime(iso);
}

export function formatDuration(startIso: string, endIso: string | null) {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return "—";
  }
  const totalSec = Math.floor((end - start) / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** Clock-in at/after 09:00 Africa/Lagos = late; before 09:00 = on time. */
export function isLateClockIn(iso: string | null | undefined) {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const second = Number(parts.find((p) => p.type === "second")?.value ?? "0");
  const total = hour * 3600 + minute * 60 + second;
  return total >= 9 * 3600;
}

export function punctualityLabel(iso: string | null | undefined) {
  if (!iso) return null;
  return isLateClockIn(iso) ? "Late" : "On time";
}

export function lagosYmd(value?: Date | string | null) {
  const date = !value
    ? new Date()
    : typeof value === "string"
      ? new Date(value)
      : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: LAGOS_TZ });
}

export function isLagosToday(iso: string | null | undefined) {
  if (!iso) return false;
  const day = lagosYmd(iso);
  return Boolean(day) && day === lagosYmd();
}

export function leaveCoversLagosToday(start: string, end: string) {
  const today = lagosYmd();
  return Boolean(start && end && start <= today && end >= today);
}

export function displayLagosClockTime(
  iso: string | null | undefined,
  lagosLabel?: string | null
) {
  const label = lagosLabel?.trim();
  if (label) {
    const match = label.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (match) {
      const time = match[1];
      return time.split(":").length === 2 ? `${time}:00` : time;
    }
  }
  return formatLagosTime(iso);
}

export function formatYmdLong(ymd: string | null | undefined) {
  if (!ymd) return "—";
  const [year, month, day] = ymd.split("-").map(Number);
  if (!year || !month || !day) return ymd;
  const monthLabel = MONTHS[month - 1];
  if (!monthLabel) return ymd;
  return `${day} ${monthLabel} ${year}`;
}

export function lagosGreeting(now = new Date()) {
  const hour = Number(lagosParts(now).hour);
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatLagosSidebarDate(now = new Date()) {
  const p = lagosParts(now);
  return `${p.weekday}, ${p.day} ${p.month} ${p.year}`;
}

export function formatLagosSidebarTime(now = new Date()) {
  const p = lagosParts(now);
  return `${p.hour}:${p.minute}`;
}

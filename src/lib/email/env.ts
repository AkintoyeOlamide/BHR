export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "https://bhr-iota-mu.vercel.app"
  ).replace(/\/$/, "");
}

export function getEmailFrom() {
  return process.env.EMAIL_FROM ?? "BHR Appraisals <noreply@bhr.local>";
}

/** Display name for all facility-related outbound email. */
export function getFacilityEmailFrom() {
  const smtpUser = process.env.SMTP_USER?.trim();
  const fallback = getEmailFrom();
  const addressMatch = fallback.match(/<([^>]+)>/);
  const address = addressMatch?.[1] ?? smtpUser ?? "noreply@bhr.local";
  return `BITACHON FACILITY <${address}>`;
}

export function facilityEmailSubject(detail: string) {
  const cleaned = detail.trim().replace(/\s+/g, " ");
  return cleaned ? `BITACHON FACILITY — ${cleaned}` : "BITACHON FACILITY";
}

/** Display name for laptop-request outbound email. */
export function getLaptopEmailFrom() {
  const smtpUser = process.env.SMTP_USER?.trim();
  const fallback = getEmailFrom();
  const addressMatch = fallback.match(/<([^>]+)>/);
  const address = addressMatch?.[1] ?? smtpUser ?? "noreply@bhr.local";
  return `BITACHON HR <${address}>`;
}

export function laptopEmailSubject(detail: string) {
  const cleaned = detail.trim().replace(/\s+/g, " ");
  return cleaned ? `BITACHON HR — ${cleaned}` : "BITACHON HR";
}

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1";

  return {
    host,
    port,
    secure,
    auth: { user, pass },
  };
}

export function isEmailConfigured() {
  return getSmtpConfig() !== null;
}

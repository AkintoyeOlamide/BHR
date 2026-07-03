export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getEmailFrom() {
  return process.env.EMAIL_FROM ?? "BHR Appraisals <noreply@bhr.local>";
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

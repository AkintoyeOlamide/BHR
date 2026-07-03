import { getAppUrl } from "@/lib/email/env";
import {
  buildLoginCredentialsHtml,
  buildLoginCredentialsText,
  type LoginCredentials,
} from "@/lib/email/login-credentials-block";
import { sendEmail } from "@/lib/email/send";

export type EmployeeAssignmentEmailInput = {
  employeeEmail: string;
  employeeName: string;
  hrName: string;
  cycleTitle?: string | null;
  reviewPeriod?: string | null;
  credentials: LoginCredentials;
};

export function buildEmployeeAssignmentEmail(input: EmployeeAssignmentEmailInput) {
  const loginUrl = `${getAppUrl()}/login`;
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const cycleLine = input.cycleTitle
    ? `Review cycle: ${input.cycleTitle}`
    : null;
  const periodLine = input.reviewPeriod
    ? `Review period: ${input.reviewPeriod}`
    : null;
  const details = [cycleLine, periodLine].filter(Boolean).join("\n");

  const subject = "BHR: Your performance review is ready";

  const text = [
    `Hello ${input.employeeName},`,
    "",
    `${input.hrName} (HR) has opened your performance review on BHR.`,
    "You will only see your own review sections — not the HR admin or manager tools.",
    details,
    "",
    buildLoginCredentialsText(input.credentials),
    "",
    `Sign in here: ${loginUrl}`,
    `After signing in, open your review from: ${dashboardUrl}`,
    "",
    "Thank you,",
    "BHR Performance Appraisals",
  ]
    .filter((line) => line !== "")
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
      <p>Hello <strong>${escapeHtml(input.employeeName)}</strong>,</p>
      <p><strong>${escapeHtml(input.hrName)}</strong> (HR) has opened your performance review on <strong>BHR</strong>.</p>
      <p style="margin:12px 0;font-size:14px;color:#475569">
        You will sign in to your personal employee dashboard to complete your self-review.
        You will not see HR templates, staff lists, or manager rating tools.
      </p>
      ${details ? `<div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc"><p style="margin:0">${escapeHtml(details).replace(/\n/g, "<br>")}</p></div>` : ""}
      ${buildLoginCredentialsHtml(input.credentials)}
      <p style="margin:24px 0">
        <a href="${loginUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          Sign in to BHR
        </a>
      </p>
      <p style="font-size:14px;color:#475569">
        After signing in, go to
        <a href="${dashboardUrl}" style="color:#7c3aed">${dashboardUrl}</a>
        to open your review.
      </p>
      <p style="margin-top:24px;font-size:14px;color:#64748b">BHR Performance Appraisals</p>
    </div>
  `;

  return { subject, html, text };
}

export async function notifyEmployeeOfAssignment(
  input: EmployeeAssignmentEmailInput
) {
  const { subject, html, text } = buildEmployeeAssignmentEmail(input);

  return sendEmail({
    to: input.employeeEmail,
    subject,
    html,
    text,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { getAppUrl } from "@/lib/email/env";
import { sendEmail } from "@/lib/email/send";

export type ManagerStaffReadyEmailInput = {
  managerEmail: string;
  managerName: string;
  employeeName: string;
  cycleTitle?: string | null;
  reviewPeriod?: string | null;
  appraisalId: string;
};

export function buildManagerStaffReadyEmail(
  input: ManagerStaffReadyEmailInput
) {
  const appUrl = getAppUrl();
  const reviewUrl = `${appUrl}/manager/appraisals/${input.appraisalId}`;
  const loginUrl = `${appUrl}/login`;

  const subject = `BHR: ${input.employeeName} sent you their appraisal`;

  const text = [
    `Hello ${input.managerName},`,
    "",
    `${input.employeeName} has completed their self-ratings and assigned their appraisal to you.`,
    "",
    input.cycleTitle ? `Review cycle: ${input.cycleTitle}` : null,
    input.reviewPeriod ? `Review period: ${input.reviewPeriod}` : null,
    "",
    "Please sign in and enter your manager ratings.",
    `Open appraisal: ${reviewUrl}`,
    `Or sign in: ${loginUrl}`,
    "",
    "Thank you,",
    "BHR Performance Appraisals",
  ]
    .filter((line) => line !== null && line !== "")
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
      <p>Hello <strong>${escapeHtml(input.managerName)}</strong>,</p>
      <p>
        <strong>${escapeHtml(input.employeeName)}</strong> has completed their
        self-ratings and assigned their appraisal to you on <strong>BHR</strong>.
      </p>
      <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>Employee:</strong> ${escapeHtml(input.employeeName)}</p>
        ${
          input.cycleTitle
            ? `<p style="margin:0 0 8px"><strong>Review cycle:</strong> ${escapeHtml(input.cycleTitle)}</p>`
            : ""
        }
        ${
          input.reviewPeriod
            ? `<p style="margin:0"><strong>Review period:</strong> ${escapeHtml(input.reviewPeriod)}</p>`
            : ""
        }
      </div>
      <p>Please enter your <strong>manager ratings</strong> on the technical and behavioural sections, then complete the overall review.</p>
      <p style="margin:24px 0">
        <a href="${reviewUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          Open appraisal
        </a>
      </p>
      <p style="font-size:14px;color:#475569">
        Or sign in at
        <a href="${loginUrl}" style="color:#7c3aed">${loginUrl}</a>
      </p>
      <p style="margin-top:24px;font-size:14px;color:#64748b">BHR Performance Appraisals</p>
    </div>
  `;

  return { subject, html, text };
}

export async function notifyManagerStaffReady(
  input: ManagerStaffReadyEmailInput
) {
  const { subject, html, text } = buildManagerStaffReadyEmail(input);

  return sendEmail({
    to: input.managerEmail,
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

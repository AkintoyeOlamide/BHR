import { getAppUrl } from "@/lib/email/env";
import { FULL_HR_EMAILS } from "@/lib/auth/roles";
import { sendEmail } from "@/lib/email/send";

export type HrAppraisalCompleteEmailInput = {
  employeeName: string;
  managerName: string;
  cycleTitle?: string | null;
  reviewPeriod?: string | null;
  overallScore?: number | null;
  ratingLabel?: string | null;
  appraisalId: string;
};

export function buildHrAppraisalCompleteEmail(
  input: HrAppraisalCompleteEmailInput
) {
  const appUrl = getAppUrl();
  const reviewUrl = `${appUrl}/manager/appraisals/${input.appraisalId}`;
  const resultsUrl = `${appUrl}/admin/results`;

  const subject = `BHR: Appraisal ready for HR — ${input.employeeName}`;

  const text = [
    "Hello HR,",
    "",
    `${input.employeeName} has submitted their appraisal to HR after manager ratings by ${input.managerName}.`,
    "",
    `Employee: ${input.employeeName}`,
    `Manager: ${input.managerName}`,
    input.cycleTitle ? `Review cycle: ${input.cycleTitle}` : null,
    input.reviewPeriod ? `Review period: ${input.reviewPeriod}` : null,
    input.overallScore != null
      ? `Overall score: ${Number(input.overallScore).toFixed(2)}`
      : null,
    input.ratingLabel ? `Rating band: ${input.ratingLabel}` : null,
    "",
    `Open appraisal: ${reviewUrl}`,
    `All results: ${resultsUrl}`,
    "",
    "BHR Performance Appraisals",
  ]
    .filter((line) => line !== null && line !== "")
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
      <p>Hello HR,</p>
      <p>
        <strong>${escapeHtml(input.employeeName)}</strong> has submitted their
        appraisal to HR after manager ratings by
        <strong>${escapeHtml(input.managerName)}</strong>.
      </p>
      <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>Employee:</strong> ${escapeHtml(input.employeeName)}</p>
        <p style="margin:0 0 8px"><strong>Manager:</strong> ${escapeHtml(input.managerName)}</p>
        ${
          input.cycleTitle
            ? `<p style="margin:0 0 8px"><strong>Review cycle:</strong> ${escapeHtml(input.cycleTitle)}</p>`
            : ""
        }
        ${
          input.reviewPeriod
            ? `<p style="margin:0 0 8px"><strong>Review period:</strong> ${escapeHtml(input.reviewPeriod)}</p>`
            : ""
        }
        ${
          input.overallScore != null
            ? `<p style="margin:0 0 8px"><strong>Overall score:</strong> ${Number(input.overallScore).toFixed(2)}</p>`
            : ""
        }
        ${
          input.ratingLabel
            ? `<p style="margin:0"><strong>Rating band:</strong> ${escapeHtml(input.ratingLabel)}</p>`
            : ""
        }
      </div>
      <p style="margin:24px 0">
        <a href="${resultsUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          View in Results
        </a>
      </p>
      <p style="font-size:14px;color:#475569">
        Or open this appraisal:
        <a href="${reviewUrl}" style="color:#7c3aed">${reviewUrl}</a>
      </p>
      <p style="margin-top:24px;font-size:14px;color:#64748b">BHR Performance Appraisals</p>
    </div>
  `;

  return { subject, html, text };
}

export async function notifyHrAppraisalComplete(
  input: HrAppraisalCompleteEmailInput
) {
  const { subject, html, text } = buildHrAppraisalCompleteEmail(input);
  const recipients = [...FULL_HR_EMAILS];

  const results = await Promise.all(
    recipients.map((to) =>
      sendEmail({
        to,
        subject,
        html,
        text,
      })
    )
  );

  return {
    ok: results.some((r) => r.ok),
    results,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

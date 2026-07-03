import { getAppUrl } from "@/lib/email/env";
import { sendEmail } from "@/lib/email/send";

export type ManagerAssignmentEmailInput = {
  managerEmail: string;
  managerName: string;
  hrName: string;
  employeeName: string;
  cycleTitle?: string | null;
  reviewPeriod?: string | null;
  appraisalId: string;
  managerOnly?: boolean;
};

export function buildManagerAssignmentEmail(input: ManagerAssignmentEmailInput) {
  const loginUrl = `${getAppUrl()}/login`;
  const reviewUrl = input.appraisalId
    ? `${getAppUrl()}/manager/appraisals/${input.appraisalId}`
    : null;
  const cycleLine = input.cycleTitle
    ? `Review cycle: ${input.cycleTitle}`
    : null;
  const periodLine = input.reviewPeriod
    ? `Review period: ${input.reviewPeriod}`
    : null;
  const details = [cycleLine, periodLine].filter(Boolean).join("\n");

  if (input.managerOnly) {
    const subject = "BHR: You have been selected as an appraiser";

    const text = [
      `Hello ${input.managerName},`,
      "",
      `${input.hrName} (HR) has selected you as an appraiser on BHR.`,
      details,
      "",
      `Sign in to view your assigned reviews: ${loginUrl}`,
      "",
      "Thank you,",
      "BHR Performance Appraisals",
    ]
      .filter((line) => line !== "")
      .join("\n");

    const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
      <p>Hello <strong>${escapeHtml(input.managerName)}</strong>,</p>
      <p><strong>${escapeHtml(input.hrName)}</strong> (HR) has selected you as an appraiser on <strong>BHR</strong>.</p>
      ${details ? `<div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc"><p style="margin:0">${escapeHtml(details).replace(/\n/g, "<br>")}</p></div>` : ""}
      <p>Please sign in to view and complete any appraisals assigned to you.</p>
      <p style="margin:24px 0">
        <a href="${loginUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          Sign in to BHR
        </a>
      </p>
      <p style="margin-top:24px;font-size:14px;color:#64748b">BHR Performance Appraisals</p>
    </div>
  `;

    return { subject, html, text };
  }

  const subject = `BHR: Appraisal assigned for ${input.employeeName}`;

  const text = [
    `Hello ${input.managerName},`,
    "",
    `${input.hrName} (HR) has assigned an employee appraisal to you on BHR.`,
    "",
    `Employee: ${input.employeeName}`,
    details,
    "",
    `Sign in to complete the review: ${loginUrl}`,
    reviewUrl ? `Open this appraisal directly: ${reviewUrl}` : null,
    "",
    "Thank you,",
    "BHR Performance Appraisals",
  ]
    .filter((line) => line !== "")
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
      <p>Hello <strong>${escapeHtml(input.managerName)}</strong>,</p>
      <p><strong>${escapeHtml(input.hrName)}</strong> (HR) has assigned an employee appraisal to you on <strong>BHR</strong>.</p>
      <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>Employee:</strong> ${escapeHtml(input.employeeName)}</p>
        ${input.cycleTitle ? `<p style="margin:0 0 8px"><strong>Review cycle:</strong> ${escapeHtml(input.cycleTitle)}</p>` : ""}
        ${input.reviewPeriod ? `<p style="margin:0"><strong>Review period:</strong> ${escapeHtml(input.reviewPeriod)}</p>` : ""}
      </div>
      <p>Please sign in and complete the technical, behavioural, and overall review sections.</p>
      <p style="margin:24px 0">
        <a href="${loginUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          Sign in to BHR
        </a>
      </p>
      ${
        reviewUrl
          ? `<p style="font-size:14px;color:#475569">
        Or open the assigned review directly:
        <a href="${reviewUrl}" style="color:#7c3aed">${reviewUrl}</a>
      </p>`
          : ""
      }
      <p style="margin-top:24px;font-size:14px;color:#64748b">BHR Performance Appraisals</p>
    </div>
  `;

  return { subject, html, text };
}

export async function notifyManagerOfAssignment(
  input: ManagerAssignmentEmailInput
) {
  const { subject, html, text } = buildManagerAssignmentEmail(input);

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

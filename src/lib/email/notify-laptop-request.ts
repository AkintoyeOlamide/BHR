import {
  getAppUrl,
  getLaptopEmailFrom,
  laptopEmailSubject,
} from "@/lib/email/env";
import { sendEmail } from "@/lib/email/send";
import { getLaptopRequestInbox } from "@/lib/laptop/env";

export type LaptopRequestEmailInput = {
  requestId: string;
  fullName: string;
  email: string;
  department: string;
  reason: string;
  preferredSpec: string;
  currentlyHasLaptop: boolean;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildLaptopRequestEmail(input: LaptopRequestEmailInput) {
  const inboxUrl = `${getAppUrl()}/admin/laptops`;
  const hasLaptop = input.currentlyHasLaptop ? "Yes" : "No";
  const subject = laptopEmailSubject(
    `Laptop request from ${input.fullName}`
  );

  const text = [
    `${input.fullName} submitted a laptop request.`,
    "",
    `Name: ${input.fullName}`,
    `Email: ${input.email}`,
    `Department: ${input.department}`,
    `Currently has a laptop: ${hasLaptop}`,
    "",
    "Preferred specification:",
    input.preferredSpec,
    "",
    input.currentlyHasLaptop ? "Why they need it changed:" : "Reason:",
    input.reason,
    "",
    "View requests in Bitachon HR:",
    inboxUrl,
    "",
    "BITACHON HR",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4f46e5">
        BITACHON HR
      </p>
      <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a">
        New laptop request
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#334155">
        Submitted by <strong>${escapeHtml(input.fullName)}</strong>
        (${escapeHtml(input.email)}).
      </p>
      <div style="margin:0 0 24px;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>Name:</strong> ${escapeHtml(input.fullName)}</p>
        <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p style="margin:0 0 8px"><strong>Department:</strong> ${escapeHtml(input.department)}</p>
        <p style="margin:0 0 8px"><strong>Currently has a laptop:</strong> ${hasLaptop}</p>
        <p style="margin:0 0 8px"><strong>Preferred specification:</strong></p>
        <p style="margin:0 0 12px;white-space:pre-wrap">${escapeHtml(input.preferredSpec)}</p>
        <p style="margin:0 0 8px"><strong>${
          input.currentlyHasLaptop
            ? "Why they need it changed:"
            : "Reason:"
        }</strong></p>
        <p style="margin:0;white-space:pre-wrap">${escapeHtml(input.reason)}</p>
      </div>
      <p style="margin:0 0 24px">
        <a href="${inboxUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">
          View laptop requests
        </a>
      </p>
    </div>
  `;

  return { subject, html, text };
}

export async function notifyAppInboxOfLaptopRequest(
  input: LaptopRequestEmailInput
) {
  const to = getLaptopRequestInbox();
  if (!to) {
    return {
      ok: false as const,
      skipped: true,
      error:
        "No inbox configured. Set SMTP_USER or LAPTOP_REQUEST_EMAIL in .env.local.",
    };
  }

  const { subject, html, text } = buildLaptopRequestEmail(input);

  return sendEmail({
    to,
    from: getLaptopEmailFrom(),
    replyTo: input.email,
    subject,
    html,
    text,
  });
}

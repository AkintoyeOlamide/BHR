import { getAppUrl } from "@/lib/email/env";
import { sendEmail } from "@/lib/email/send";

export async function sendLoginOtpEmail(input: {
  to: string;
  code: string;
  name?: string | null;
}) {
  const appUrl = getAppUrl();
  const greeting = input.name?.trim() ? `Hello ${input.name.trim()},` : "Hello,";
  const subject = `BHR login code: ${input.code}`;

  const text = [
    greeting,
    "",
    `Your BHR sign-in code is: ${input.code}`,
    "",
    "This code expires in 10 minutes.",
    "If you did not try to sign in, you can ignore this email.",
    "",
    `Sign in: ${appUrl}/login`,
    "",
    "BHR Performance Appraisals",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:520px">
      <p>${escapeHtml(greeting)}</p>
      <p>Your BHR sign-in code is:</p>
      <p style="font-size:32px;letter-spacing:0.35em;font-weight:700;margin:20px 0">${escapeHtml(input.code)}</p>
      <p style="color:#475569">This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#64748b;font-size:14px">If you did not try to sign in, you can ignore this email.</p>
      <p style="margin-top:24px;font-size:14px;color:#64748b">BHR Performance Appraisals</p>
    </div>
  `;

  return sendEmail({
    to: input.to,
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
